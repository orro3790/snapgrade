import WebSocket from 'ws';
import { adminDb } from './firebase.js';
import { discordMappingSchema, type DiscordMapping } from './schemas.js';
import { DocumentHandler } from './handlers/documentHandler';
import type { MessageData, ActionRow } from '../schemas/discordInteractions';

// Gateway opcodes
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
    HeartbeatAck = 11,
}

// Gateway close codes
enum GatewayCloseCodes {
    UnknownError = 4000,
    UnknownOpcode = 4001,
    DecodeError = 4002,
    NotAuthenticated = 4003,
    AuthenticationFailed = 4004,
    AlreadyAuthenticated = 4005,
    InvalidSeq = 4007,
    RateLimited = 4008,
    SessionTimeout = 4009,
    InvalidShard = 4010,
    ShardingRequired = 4011,
    InvalidAPIVersion = 4012,
    InvalidIntents = 4013,
    DisallowedIntents = 4014,
}

// Gateway payload interfaces
interface GatewayPayload<T = unknown> {
    op: GatewayOpcodes;
    d?: T;
    s?: number | null;
    t?: string | null;
}

interface HelloData {
    heartbeat_interval: number;
}

interface ReadyData {
    session_id: string;
    resume_gateway_url: string;
}


interface IdentifyProperties {
    os: string;
    browser: string;
    device: string;
}

interface IdentifyData {
    token: string;
    intents: number;
    properties: IdentifyProperties;
}

interface ResumeData {
    token: string;
    session_id: string;
    seq: number | null;
}

export class DiscordBot {
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private sequence: number | null = null;
    private sessionId: string | null = null;
    private resumeGatewayUrl: string | null = null;
    private lastHeartbeatAck: boolean = true;
    private isDisconnecting: boolean = false;
    private documentHandler: DocumentHandler;

    constructor(
        private readonly token: string,
        private readonly intents: number
    ) {
        this.documentHandler = new DocumentHandler(this.sendDirectMessage.bind(this));
    }

    /**
     * Initialize the bot and connect to Discord's Gateway
     */
    public async connect(): Promise<void> {
        try {
            console.log('Starting bot connection...');
            
            // Get the Gateway URL
            const gatewayUrl = await this.getGatewayUrl();
            console.log('Using Gateway URL:', gatewayUrl);
            
            // Connect to the Gateway
            console.log('Establishing WebSocket connection...');
            this.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);

            // Set up event handlers
            this.ws.on('open', this.handleOpen.bind(this));
            this.ws.on('message', this.handleMessage.bind(this));
            this.ws.on('close', this.handleClose.bind(this));
            this.ws.on('error', (error: Error) => {
                console.error('WebSocket error:', {
                    message: error.message,
                    error
                });
                this.handleError(error);
            });

            // Return a promise that resolves when connection is established
            return new Promise<void>((resolve, reject) => {
                this.ws!.once('open', () => {
                    console.log('WebSocket connection established');
                    resolve();
                });
                
                this.ws!.once('error', (error: Error) => {
                    console.error('WebSocket connection failed:', error);
                    reject(error);
                });
            });
        } catch (error) {
            const err = error as Error;
            console.error('Failed to connect to Discord Gateway:', {
                name: err.name,
                message: err.message,
                stack: err.stack,
                error: err
            });
            throw error;
        }
    }

    /**
     * Get the Gateway URL from Discord's API
     */
    private async getGatewayUrl(): Promise<string> {
        try {
            console.log('Fetching Gateway URL...');
            const response = await fetch('https://discord.com/api/v10/gateway/bot', {
                headers: {
                    Authorization: `Bot ${this.token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Failed to get gateway URL: ${response.status} ${response.statusText}\n${errorText}`
                );
            }

            const data = await response.json();
            console.log('Gateway URL fetched successfully');
            return data.url;
        } catch (error) {
            console.error('Error getting Gateway URL:', error);
            throw error;
        }
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        console.log('Connected to Discord Gateway');
    }

    /**
     * Handle WebSocket messages
     */
    private handleMessage(data: WebSocket.Data): void {
        try {
            const payload: GatewayPayload = JSON.parse(data.toString());
            
            // Update sequence number if present
            if (payload.s) this.sequence = payload.s;

            switch (payload.op) {
                case GatewayOpcodes.Hello:
                    this.handleHello(payload.d as HelloData);
                    break;
                case GatewayOpcodes.HeartbeatAck:
                    this.lastHeartbeatAck = true;
                    break;
                case GatewayOpcodes.Heartbeat:
                    this.sendHeartbeat();
                    break;
                case GatewayOpcodes.Dispatch:
                    this.handleDispatch(payload as GatewayPayload<ReadyData | MessageData>);
                    break;
                case GatewayOpcodes.InvalidSession:
                    this.handleInvalidSession(payload.d as boolean);
                    break;
                case GatewayOpcodes.Reconnect:
                    this.handleReconnect();
                    break;
            }
        } catch (error) {
            console.error('Error handling Gateway message:', error);
        }
    }

    /**
     * Handle Hello event and start heartbeating
     */
    private handleHello(data: HelloData): void {
        // Start heartbeating
        this.startHeartbeat(data.heartbeat_interval);
        
        // Send identify payload
        this.identify();
    }

    /**
     * Start the heartbeat interval
     */
    private startHeartbeat(interval: number): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Add jitter to prevent thundering herd
        const jitter = Math.random();
        setTimeout(() => {
            this.sendHeartbeat();
            this.heartbeatInterval = setInterval(() => {
                if (!this.lastHeartbeatAck) {
                    // No heartbeat ack received, need to reconnect
                    this.reconnect();
                    return;
                }
                this.sendHeartbeat();
            }, interval);
        }, interval * jitter);
    }

    /**
     * Send a heartbeat to the Gateway
     */
    private sendHeartbeat(): void {
        if (!this.ws) return;

        this.lastHeartbeatAck = false;
        this.send({
            op: GatewayOpcodes.Heartbeat,
            d: this.sequence
        });
    }

    /**
     * Send identify payload to the Gateway
     */
    private identify(): void {
        const identifyData: IdentifyData = {
            token: this.token,
            intents: this.intents,
            properties: {
                os: 'linux',
                browser: 'snapgrade',
                device: 'snapgrade'
            }
        };

        this.send({
            op: GatewayOpcodes.Identify,
            d: identifyData
        });
    }

    /**
     * Handle dispatch events
     */
    private handleDispatch(payload: GatewayPayload<ReadyData | MessageData>): void {
        if (!payload.t) return;

        switch (payload.t) {
            case 'READY': {
                if (this.isReadyData(payload.d)) {
                    this.sessionId = payload.d.session_id;
                    this.resumeGatewayUrl = payload.d.resume_gateway_url;
                    console.log('Bot is ready!');
                }
                break;
            }
            case 'MESSAGE_CREATE': {
                if (this.isMessageData(payload.d)) {
                    this.handleIncomingMessage(payload.d);
                }
                break;
            }
        }
    }

    /**
     * Type guards for payload data
     */
    private isReadyData(data: unknown): data is ReadyData {
        return data !== null &&
               typeof data === 'object' &&
               'session_id' in data &&
               'resume_gateway_url' in data;
    }

    private isMessageData(data: unknown): data is MessageData {
        return data !== null &&
               typeof data === 'object' &&
               'content' in data &&
               'author' in data;
    }

    /**
     * Handle invalid session
     */
    private handleInvalidSession(resumable: boolean): void {
        if (resumable) {
            this.resume();
        } else {
            // Wait a random amount of time between 1 and 5 seconds
            setTimeout(() => {
                this.connect();
            }, Math.random() * 4000 + 1000);
        }
    }

    /**
     * Handle reconnect request
     */
    private handleReconnect(): void {
        this.reconnect();
    }

    /**
     * Reconnect to the Gateway
     */
    private reconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
        
        if (this.sessionId && this.resumeGatewayUrl) {
            // We can resume the session
            this.resume();
        } else {
            // We need to start a new session
            this.connect();
        }
    }

    /**
     * Resume a session
     */
    private resume(): void {
        if (!this.sessionId || !this.resumeGatewayUrl) {
            this.connect();
            return;
        }

        this.ws = new WebSocket(`${this.resumeGatewayUrl}?v=10&encoding=json`);
        
        this.ws.on('open', () => {
            const resumeData: ResumeData = {
                token: this.token,
                session_id: this.sessionId!,
                seq: this.sequence
            };

            this.send({
                op: GatewayOpcodes.Resume,
                d: resumeData
            });
        });

        this.ws.on('message', this.handleMessage.bind(this));
        this.ws.on('close', this.handleClose.bind(this));
        this.ws.on('error', this.handleError.bind(this));
    }

    /**
     * Handle WebSocket close
     */
    private handleClose(code: number): void {
        console.log(`Gateway connection closed with code ${code}`);
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Handle different close codes
        switch (code) {
            case GatewayCloseCodes.AuthenticationFailed:
            case GatewayCloseCodes.InvalidAPIVersion:
            case GatewayCloseCodes.InvalidIntents:
            case GatewayCloseCodes.DisallowedIntents:
                // Fatal errors - don't reconnect
                console.error(`Fatal Gateway error: ${code}`);
                break;
            default:
                // Attempt to reconnect for other codes
                this.reconnect();
        }
    }

    /**
     * Handle WebSocket errors
     */
    private handleError(error: Error): void {
        console.error('Gateway error:', error);
    }

    /**
     * Send a payload to the Gateway
     */
    private send(payload: GatewayPayload): void {
        if (!this.ws) return;
        
        try {
            this.ws.send(JSON.stringify(payload));
        } catch (error) {
            console.error('Error sending payload to Gateway:', error);
        }
    }

    /**
     * Gracefully disconnect from the Gateway
     */
    public async disconnect(): Promise<void> {
        this.isDisconnecting = true;

        // Clear heartbeat interval
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Close WebSocket connection with a normal closure
        if (this.ws) {
            this.ws.close(1000, 'Bot disconnecting');
            this.ws = null;
        }

        // Reset state
        this.sequence = null;
        this.sessionId = null;
        this.resumeGatewayUrl = null;
        this.lastHeartbeatAck = true;
        this.isDisconnecting = false;
    }

    /**
     * Handle incoming messages
     */
    private async handleIncomingMessage(message: MessageData): Promise<void> {
        // Ignore messages from bots
        if (message.author.bot) return;

        try {
            // Get the user's authentication status
            const authStatus = await this.checkUserAuth(message.author.id);

            if (!authStatus.authenticated) {
                await this.sendDirectMessage(message.channel_id, 
                    "You need to link your Discord account with Snapgrade first. " +
                    "Please visit the Snapgrade website and connect your Discord account."
                );
                return;
            }

            if (authStatus.status !== 'ACTIVE') {
                await this.sendDirectMessage(message.channel_id,
                    authStatus.status === 'SUSPENDED' 
                        ? "Your account has been suspended. Please contact support."
                        : "Your subscription is inactive. Please renew your subscription to continue using Snapgrade."
                );
                return;
            }

            // Process any image attachments
            if (message.attachments.length > 0) {
                await this.documentHandler.handleImageAttachments(message);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await this.sendDirectMessage(message.channel_id,
                "Sorry, there was an error processing your message. Please try again later."
            );
        }
    }

    /**
     * Send a direct message to a channel
     */
    /**
     * Check user's authentication status
     */
    private async checkUserAuth(discordId: string): Promise<{
        authenticated: boolean;
        status?: DiscordMapping['status'];
        firebaseUid?: string;
    }> {
        try {
            const mappingRef = adminDb.collection('discord_mappings').where('discordId', '==', discordId);
            const snapshot = await mappingRef.get();

            if (snapshot.empty) {
                return { authenticated: false };
            }

            const mappingDoc = snapshot.docs[0];
            const mapping = discordMappingSchema.parse(mappingDoc.data());

            // Update lastUsed timestamp
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
    }

    /**
     * Send a direct message to a channel
     */
    private async sendDirectMessage(
        channelId: string,
        content: string,
        components?: ActionRow[]
    ): Promise<void> {
        try {
            const body: { content: string; components?: ActionRow[] } = { content };
            if (components) {
                body.components = components;
            }

            await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
        } catch (error) {
            console.error('Error sending direct message:', error);
            throw error;
        }
    }

    // ... (keep remaining methods)
}