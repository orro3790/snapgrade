import WebSocket from 'ws';
import { adminDb } from '../firebase/admin';
import {
    discordMappingSchema,
    type AuthResult,
    type MessageCreateEvent,
    type ReadyEvent,
    type GatewayPayload,
    type Interaction
} from '../schemas/discord-consolidated';
import { handleInteraction } from './interaction-handler';

// Gateway opcodes enum
enum GatewayOpcodes {
    Dispatch = 0,
    Heartbeat = 1,
    Identify = 2,
    PresenceUpdate = 3,
    VoiceStateUpdate = 4,
    Resume = 6,
    Reconnect = 7,
    RequestGuildMembers = 8,
    InvalidSession = 9,
    Hello = 10,
    HeartbeatAck = 11
}

// Discord Intents we need
const INTENTS = (1 << 0) | // GUILDS
               (1 << 9) | // GUILD_MESSAGES
               (1 << 12) | // DIRECT_MESSAGES
               (1 << 4);  // GUILD_INTEGRATIONS - needed for interactions

/**
 * Create a Discord bot connection
 * @param token Discord bot token
 * @returns Object with connect and disconnect functions
 */
function createDiscordBot(token: string) {
    let ws: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let sequence: number | null = null;
    let sessionId: string | null = null;
    let resumeGatewayUrl: string | null = null;
    let lastHeartbeatAck = true;
    let isDisconnecting = false;

    /**
     * Get the gateway URL from Discord
     */
    const getGatewayUrl = async (): Promise<string> => {
        const response = await fetch('https://discord.com/api/v10/gateway/bot', {
            headers: {
                Authorization: `Bot ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to get gateway URL: ${response.status} ${response.statusText}\n${errorText}`
            );
        }

        const data = await response.json();
        return data.url;
    };

    /**
     * Send a payload to the gateway
     */
    const send = (payload: GatewayPayload): void => {
        if (!ws) return;

        try {
            ws.send(JSON.stringify(payload));
        } catch (error) {
            console.error('Error sending payload to Gateway:', error);
        }
    };

    /**
     * Send a heartbeat to the gateway
     */
    const sendHeartbeat = (): void => {
        if (!ws) return;
        lastHeartbeatAck = false;
        send({
            op: GatewayOpcodes.Heartbeat,
            d: sequence
        });
    };

    /**
     * Start the heartbeat interval
     */
    const startHeartbeat = (interval: number): void => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }

        const jitter = Math.random();
        setTimeout(() => {
            sendHeartbeat();
            heartbeatInterval = setInterval(() => {
                if (!lastHeartbeatAck) {
                    reconnect();
                    return;
                }
                sendHeartbeat();
            }, interval);
        }, interval * jitter);
    };

    /**
     * Identify with the gateway
     */
    const identify = (): void => {
        const identifyData = {
            token,
            intents: INTENTS,
            properties: {
                os: 'linux',
                browser: 'snapgrade',
                device: 'snapgrade'
            }
        };

        send({
            op: GatewayOpcodes.Identify,
            d: identifyData
        });
    };

    /**
     * Resume a connection with the gateway
     */
    const resume = (): void => {
        if (!sessionId || !resumeGatewayUrl) {
            connect();
            return;
        }

        ws = new WebSocket(`${resumeGatewayUrl}?v=10&encoding=json`);

        ws.on('open', () => {
            const resumeData = {
                token,
                session_id: sessionId,
                seq: sequence
            };

            send({
                op: GatewayOpcodes.Resume,
                d: resumeData
            });
        });

        ws.on('message', handleMessage);
        ws.on('close', handleClose);
        ws.on('error', handleError);
    };

    /**
     * Reconnect to the gateway
     */
    const reconnect = (): void => {
        if (ws) {
            ws.close();
        }

        if (sessionId && resumeGatewayUrl) {
            resume();
        } else {
            connect();
        }
    };

    /**
     * Handle a message from the gateway
     */
    const handleMessage = (data: WebSocket.Data): void => {
        try {
            const payload = JSON.parse(data.toString()) as GatewayPayload;
            
            if (payload.s) sequence = payload.s;

            switch (payload.op) {
                case GatewayOpcodes.Hello:
                    startHeartbeat((payload.d as { heartbeat_interval: number }).heartbeat_interval);
                    identify();
                    break;
                case GatewayOpcodes.HeartbeatAck:
                    lastHeartbeatAck = true;
                    break;
                case GatewayOpcodes.Heartbeat:
                    sendHeartbeat();
                    break;
                case GatewayOpcodes.Dispatch:
                    handleDispatch(payload);
                    break;
                case GatewayOpcodes.InvalidSession:
                    handleInvalidSession(payload.d as boolean);
                    break;
                case GatewayOpcodes.Reconnect:
                    reconnect();
                    break;
            }
        } catch (error) {
            console.error('Error handling Gateway message:', error);
        }
    };

    /**
     * Handle a dispatch event from the gateway
     */
    const handleDispatch = (payload: GatewayPayload): void => {
        if (!payload.t) return;

        switch (payload.t) {
            case 'READY': {
                const readyData = payload.d as ReadyEvent;
                sessionId = readyData.session_id;
                resumeGatewayUrl = readyData.resume_gateway_url;
                console.log('Bot is ready!');
                break;
            }
            case 'MESSAGE_CREATE': {
                const messageData = payload.d as MessageCreateEvent;
                void handleIncomingMessage(messageData);
                break;
            }
            case 'INTERACTION_CREATE': {
                // Handle interaction events (button clicks, slash commands)
                console.log('Received interaction:', payload.d);
                // Cast the payload data to Interaction type
                void handleInteraction(payload.d as Interaction);
                break;
            }
        }
    };

    /**
     * Handle an invalid session event
     */
    const handleInvalidSession = (resumable: boolean): void => {
        if (resumable) {
            resume();
        } else {
            setTimeout(() => {
                connect();
            }, Math.random() * 4000 + 1000);
        }
    };

    /**
     * Handle a close event from the gateway
     */
    const handleClose = (code: number): void => {
        console.log(`Gateway connection closed with code ${code}`);

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        // Don't reconnect if we're intentionally disconnecting
        if (isDisconnecting) {
            console.log('Not reconnecting - bot is shutting down');
            return;
        }

        // Handle specific close codes
        switch (code) {
            case 4004: // Authentication failed
            case 4012: // Invalid API version
            case 4013: // Invalid intents
            case 4014: // Disallowed intents
                console.error(`Fatal Gateway error: ${code}`);
                break;
            default:
                // Don't attempt to reconnect if we're in the process of exiting
                if (!process.exitCode) {
                    reconnect();
                }
        }
    };

    /**
     * Handle an error event from the gateway
     */
    const handleError = (error: Error): void => {
        console.error('Gateway error:', error);
    };

    /**
     * Check if a user is authenticated
     */
    const checkUserAuth = async (discordId: string): Promise<AuthResult> => {
        try {
            const mappingRef = adminDb
                .collection('discord_mappings')
                .where('discordId', '==', discordId);
            
            const snapshot = await mappingRef.get();

            if (snapshot.empty) {
                return { authenticated: false };
            }

            const mappingDoc = snapshot.docs[0];
            const data = mappingDoc.data();
            
            // Convert Firestore Timestamp objects to JavaScript Date objects
            const convertedData = {
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                lastUsed: data.lastUsed?.toDate ? data.lastUsed.toDate() : data.lastUsed
            };
            
            const mapping = discordMappingSchema.parse(convertedData);

            await mappingDoc.ref.update({
                lastUsed: new Date()
            });

            return {
                authenticated: true,
                status: mapping.status,
                firebaseUid: mapping.firebaseUid
            };
        } catch (error) {
            console.error('Error checking user auth:', error);
            throw error;
        }
    };

    /**
     * Send a direct message to a user
     */
    const sendDirectMessage = async (channelId: string, content: string): Promise<void> => {
        try {
            await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });
        } catch (error) {
            console.error('Error sending direct message:', error);
            throw error;
        }
    };

    /**
     * Handle an incoming message
     */
    const handleIncomingMessage = async (message: MessageCreateEvent): Promise<void> => {
        if (message.author.bot) return;

        try {
            const authStatus = await checkUserAuth(message.author.id);
            
            if (!authStatus.authenticated) {
                await sendDirectMessage(
                    message.channel_id,
                    "You need to link your Discord account with Snapgrade first. " +
                    "Please visit the Snapgrade website and connect your Discord account."
                );
                return;
            }

            if (authStatus.status !== 'active') {
                await sendDirectMessage(
                    message.channel_id,
                    authStatus.status === 'suspended'
                        ? "Your account has been suspended. Please contact support."
                        : "Your subscription is inactive. Please renew your subscription to continue using Snapgrade."
                );
                return;
            }

            if (message.attachments.length > 0) {
                await handleImageAttachments(message);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await sendDirectMessage(
                message.channel_id,
                "Sorry, there was an error processing your message. Please try again later."
            );
        }
    };

    /**
     * Handle image attachments in a message
     */
    const handleImageAttachments = async (message: MessageCreateEvent): Promise<void> => {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const images = message.attachments.filter(
            attachment => attachment.content_type && validImageTypes.includes(attachment.content_type)
        );

        if (images.length === 0) {
            await sendDirectMessage(
                message.channel_id,
                "Please send valid image files (JPEG, PNG, WEBP, or GIF)."
            );
            return;
        }

        await sendDirectMessage(
            message.channel_id,
            `Processing ${images.length} image(s)... This may take a moment.`
        );

        try {
            // Convert Discord attachments to the format expected by handleImageUpload
            const attachmentsForUpload = images.map(image => ({
                id: image.id,
                url: image.url,
                filename: image.filename,
                contentType: image.content_type!,
                size: image.size
            }));

            // Use the document session handler to process images
            const { handleImageUpload } = await import('./document-session-handler.js');
            await handleImageUpload(message.channel_id, message.author.id, attachmentsForUpload);
        } catch (error) {
            console.error('Error storing image information:', error);
            await sendDirectMessage(
                message.channel_id,
                "Sorry, there was an error processing your images. Please try again later."
            );
        }
    };

    /**
     * Connect to the Discord gateway
     */
    const connect = async (): Promise<void> => {
        try {
            const gatewayUrl = await getGatewayUrl();
            ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);
            ws.on('open', () => console.log('Connected to Discord Gateway'));
            ws.on('message', handleMessage);
            ws.on('close', handleClose);
            ws.on('error', (error: Error) => {
                console.error('WebSocket error:', error);
                handleError(error);
            });

            return new Promise((resolve, reject) => {
                if (!ws) {
                    reject(new Error('WebSocket not initialized'));
                    return;
                }

                ws.once('open', () => {
                    console.log('WebSocket connection established');
                    resolve();
                });

                ws.once('error', (error) => {
                    console.error('WebSocket connection failed:', error);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Failed to connect to Discord Gateway:', error);
            throw error;
        }
    };

    /**
     * Disconnect from the Discord gateway
     */
    const disconnect = async (): Promise<void> => {
        // Only disconnect if not already disconnecting
        if (isDisconnecting) {
            return;
        }
        
        isDisconnecting = true;

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        if (ws) {
            // Set a timeout to force close if normal close doesn't work
            const forceCloseTimeout = setTimeout(() => {
                console.log('Forcing WebSocket termination after timeout');
                if (ws) {
                    ws.terminate();
                    ws = null;
                }
            }, 2000); // 2 seconds timeout
            
            // Add one-time close listener to clear the timeout
            ws.once('close', () => {
                clearTimeout(forceCloseTimeout);
            });
            
            // Normal close
            ws.close(1000, 'Bot disconnecting');
            ws = null;
        }

        sequence = null;
        sessionId = null;
        resumeGatewayUrl = null;
        lastHeartbeatAck = true;
        isDisconnecting = false;
    };

    return {
        connect,
        disconnect
    };
}

/**
 * Initialize and start the Discord bot
 */
export async function startBot() {
    try {
        // Get bot token from environment
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
        }

        // Create and connect bot
        const bot = createDiscordBot(token);
        await bot.connect();

        // Setup cleanup function
        const cleanup = async () => {
            console.log('Disconnecting bot...');
            await bot.disconnect();
            console.log('Bot disconnected');
            
            // Return true to indicate successful cleanup
            return true;
        };

        // Signal handlers are now managed in index.ts

        return cleanup;
    } catch (error) {
        console.error('Failed to start bot:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

// Export the startBot function for use in index.ts
export default startBot;