import WebSocket from 'ws';
import { adminDb } from './firebase.js';
import { 
    discordMappingSchema,
    pendingImageSchema,
    type AuthResult,
    type MessageCreateEvent,
    type ReadyEvent,
    type GatewayPayload
} from '../schemas/discord';

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

// Gateway close codes enum
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
    DisallowedIntents = 4014
}

export class DiscordBot {
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private sequence: number | null = null;
    private sessionId: string | null = null;
    private resumeGatewayUrl: string | null = null;
    private lastHeartbeatAck = true;
    private isDisconnecting = false;

    constructor(
        private token: string,
        private intents: number
    ) {}

    async connect(): Promise<void> {
        try {
            console.log('Starting bot connection...');
            const gatewayUrl = await this.getGatewayUrl();
            console.log('Using Gateway URL:', gatewayUrl);

            console.log('Establishing WebSocket connection...');
            this.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);

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

            return new Promise((resolve, reject) => {
                this.ws!.once('open', () => {
                    console.log('WebSocket connection established');
                    resolve();
                });

                this.ws!.once('error', (error) => {
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

    private handleOpen(): void {
        console.log('Connected to Discord Gateway');
    }

    private handleMessage(data: WebSocket.Data): void {
        try {
            const payload = JSON.parse(data.toString()) as GatewayPayload;
            
            if (payload.s) this.sequence = payload.s;

            switch (payload.op) {
                case GatewayOpcodes.Hello:
                    this.handleHello(payload.d as { heartbeat_interval: number });
                    break;

                case GatewayOpcodes.HeartbeatAck:
                    this.lastHeartbeatAck = true;
                    break;

                case GatewayOpcodes.Heartbeat:
                    this.sendHeartbeat();
                    break;

                case GatewayOpcodes.Dispatch:
                    this.handleDispatch(payload);
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

    private handleHello(data: { heartbeat_interval: number }): void {
        this.startHeartbeat(data.heartbeat_interval);
        this.identify();
    }

    private startHeartbeat(interval: number): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        const jitter = Math.random();
        setTimeout(() => {
            this.sendHeartbeat();
            this.heartbeatInterval = setInterval(() => {
                if (!this.lastHeartbeatAck) {
                    this.reconnect();
                    return;
                }
                this.sendHeartbeat();
            }, interval);
        }, interval * jitter);
    }

    private sendHeartbeat(): void {
        if (!this.ws) return;
        this.lastHeartbeatAck = false;
        this.send({
            op: GatewayOpcodes.Heartbeat,
            d: this.sequence
        });
    }

    private identify(): void {
        const identifyData = {
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

    private handleDispatch(payload: GatewayPayload): void {
        if (!payload.t) return;

        switch (payload.t) {
            case 'READY': {
                const readyData = payload.d as ReadyEvent;
                this.sessionId = readyData.session_id;
                this.resumeGatewayUrl = readyData.resume_gateway_url;
                console.log('Bot is ready!');
                break;
            }

            case 'MESSAGE_CREATE': {
                const messageData = payload.d as MessageCreateEvent;
                void this.handleIncomingMessage(messageData);
                break;
            }
        }
    }

    private async handleIncomingMessage(message: MessageCreateEvent): Promise<void> {
        if (message.author.bot) return;

        try {
            const authStatus = await this.checkUserAuth(message.author.id);
            
            if (!authStatus.authenticated) {
                await this.sendDirectMessage(
                    message.channel_id,
                    "You need to link your Discord account with Snapgrade first. " +
                    "Please visit the Snapgrade website and connect your Discord account."
                );
                return;
            }

            if (authStatus.status !== 'ACTIVE') {
                await this.sendDirectMessage(
                    message.channel_id,
                    authStatus.status === 'SUSPENDED'
                        ? "Your account has been suspended. Please contact support."
                        : "Your subscription is inactive. Please renew your subscription to continue using Snapgrade."
                );
                return;
            }

            if (message.attachments.length > 0) {
                await this.handleImageAttachments(message);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await this.sendDirectMessage(
                message.channel_id,
                "Sorry, there was an error processing your message. Please try again later."
            );
        }
    }

    private async checkUserAuth(discordId: string): Promise<AuthResult> {
        try {
            console.log('Checking auth for Discord user:', discordId);
            
            const mappingRef = adminDb
                .collection('discord_mappings')
                .where('discordId', '==', discordId);
            
            const snapshot = await mappingRef.get();

            if (snapshot.empty) {
                console.log('No mapping found for Discord ID:', discordId);
                return { authenticated: false };
            }

            const mappingDoc = snapshot.docs[0];
            const mapping = discordMappingSchema.parse(mappingDoc.data());
            console.log('Parsed mapping:', mapping);

            // Update last used
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

    private async handleImageAttachments(message: MessageCreateEvent): Promise<void> {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const images = message.attachments.filter(
            attachment => attachment.content_type && validImageTypes.includes(attachment.content_type)
        );

        if (images.length === 0) {
            await this.sendDirectMessage(
                message.channel_id,
                "Please send a valid image file (JPEG, PNG, WEBP, or GIF)."
            );
            return;
        }

        if (images.length > 1) {
            await this.sendDirectMessage(
                message.channel_id,
                "Please send only one image at a time."
            );
            return;
        }

        const image = images[0];
        await this.sendDirectMessage(
            message.channel_id,
            "Processing your image... This may take a moment."
        );

        try {
            const pendingImage = pendingImageSchema.parse({
                discordMessageId: message.id,
                channelId: message.channel_id,
                userId: message.author.id,
                imageUrl: image.url,
                filename: image.filename,
                contentType: image.content_type!,
                size: image.size,
                status: 'PENDING',
                createdAt: new Date()
            });

            await adminDb.collection('pending_images').add(pendingImage);
        } catch (error) {
            console.error('Error storing image information:', error);
            await this.sendDirectMessage(
                message.channel_id,
                "Sorry, there was an error processing your image. Please try again later."
            );
        }
    }

    private async sendDirectMessage(channelId: string, content: string): Promise<void> {
        try {
            await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });
        } catch (error) {
            console.error('Error sending direct message:', error);
            throw error;
        }
    }

    private handleInvalidSession(resumable: boolean): void {
        if (resumable) {
            this.resume();
        } else {
            setTimeout(() => {
                this.connect();
            }, Math.random() * 4000 + 1000);
        }
    }

    private handleReconnect(): void {
        this.reconnect();
    }

    private reconnect(): void {
        if (this.ws) {
            this.ws.close();
        }

        if (this.sessionId && this.resumeGatewayUrl) {
            this.resume();
        } else {
            this.connect();
        }
    }

    private resume(): void {
        if (!this.sessionId || !this.resumeGatewayUrl) {
            this.connect();
            return;
        }

        this.ws = new WebSocket(`${this.resumeGatewayUrl}?v=10&encoding=json`);

        this.ws.on('open', () => {
            const resumeData = {
                token: this.token,
                session_id: this.sessionId,
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

    private handleClose(code: number): void {
        console.log(`Gateway connection closed with code ${code}`);

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        switch (code) {
            case GatewayCloseCodes.AuthenticationFailed:
            case GatewayCloseCodes.InvalidAPIVersion:
            case GatewayCloseCodes.InvalidIntents:
            case GatewayCloseCodes.DisallowedIntents:
                console.error(`Fatal Gateway error: ${code}`);
                break;
            default:
                this.reconnect();
        }
    }

    private handleError(error: Error): void {
        console.error('Gateway error:', error);
    }

    private send(payload: GatewayPayload): void {
        if (!this.ws) return;

        try {
            this.ws.send(JSON.stringify(payload));
        } catch (error) {
            console.error('Error sending payload to Gateway:', error);
        }
    }

    async disconnect(): Promise<void> {
        this.isDisconnecting = true;

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Bot disconnecting');
            this.ws = null;
        }

        this.sequence = null;
        this.sessionId = null;
        this.resumeGatewayUrl = null;
        this.lastHeartbeatAck = true;
        this.isDisconnecting = false;
    }
}