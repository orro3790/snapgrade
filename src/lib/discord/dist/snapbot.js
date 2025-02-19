import WebSocket from 'ws';
import { adminDb } from './firebase.js';
import { discordMappingSchema } from './schemas.js';
import { pendingImageSchema } from './schemas.js';
var GatewayOpcodes;
(function (GatewayOpcodes) {
    GatewayOpcodes[GatewayOpcodes["Dispatch"] = 0] = "Dispatch";
    GatewayOpcodes[GatewayOpcodes["Heartbeat"] = 1] = "Heartbeat";
    GatewayOpcodes[GatewayOpcodes["Identify"] = 2] = "Identify";
    GatewayOpcodes[GatewayOpcodes["PresenceUpdate"] = 3] = "PresenceUpdate";
    GatewayOpcodes[GatewayOpcodes["VoiceStateUpdate"] = 4] = "VoiceStateUpdate";
    GatewayOpcodes[GatewayOpcodes["Resume"] = 6] = "Resume";
    GatewayOpcodes[GatewayOpcodes["Reconnect"] = 7] = "Reconnect";
    GatewayOpcodes[GatewayOpcodes["RequestGuildMembers"] = 8] = "RequestGuildMembers";
    GatewayOpcodes[GatewayOpcodes["InvalidSession"] = 9] = "InvalidSession";
    GatewayOpcodes[GatewayOpcodes["Hello"] = 10] = "Hello";
    GatewayOpcodes[GatewayOpcodes["HeartbeatAck"] = 11] = "HeartbeatAck";
})(GatewayOpcodes || (GatewayOpcodes = {}));
var GatewayCloseCodes;
(function (GatewayCloseCodes) {
    GatewayCloseCodes[GatewayCloseCodes["UnknownError"] = 4000] = "UnknownError";
    GatewayCloseCodes[GatewayCloseCodes["UnknownOpcode"] = 4001] = "UnknownOpcode";
    GatewayCloseCodes[GatewayCloseCodes["DecodeError"] = 4002] = "DecodeError";
    GatewayCloseCodes[GatewayCloseCodes["NotAuthenticated"] = 4003] = "NotAuthenticated";
    GatewayCloseCodes[GatewayCloseCodes["AuthenticationFailed"] = 4004] = "AuthenticationFailed";
    GatewayCloseCodes[GatewayCloseCodes["AlreadyAuthenticated"] = 4005] = "AlreadyAuthenticated";
    GatewayCloseCodes[GatewayCloseCodes["InvalidSeq"] = 4007] = "InvalidSeq";
    GatewayCloseCodes[GatewayCloseCodes["RateLimited"] = 4008] = "RateLimited";
    GatewayCloseCodes[GatewayCloseCodes["SessionTimeout"] = 4009] = "SessionTimeout";
    GatewayCloseCodes[GatewayCloseCodes["InvalidShard"] = 4010] = "InvalidShard";
    GatewayCloseCodes[GatewayCloseCodes["ShardingRequired"] = 4011] = "ShardingRequired";
    GatewayCloseCodes[GatewayCloseCodes["InvalidAPIVersion"] = 4012] = "InvalidAPIVersion";
    GatewayCloseCodes[GatewayCloseCodes["InvalidIntents"] = 4013] = "InvalidIntents";
    GatewayCloseCodes[GatewayCloseCodes["DisallowedIntents"] = 4014] = "DisallowedIntents";
})(GatewayCloseCodes || (GatewayCloseCodes = {}));
export class DiscordBot {
    constructor(token, intents) {
        this.token = token;
        this.intents = intents;
        this.ws = null;
        this.heartbeatInterval = null;
        this.sequence = null;
        this.sessionId = null;
        this.resumeGatewayUrl = null;
        this.lastHeartbeatAck = true;
        this.isDisconnecting = false;
    }
    async connect() {
        try {
            console.log('Starting bot connection...');
            const gatewayUrl = await this.getGatewayUrl();
            console.log('Using Gateway URL:', gatewayUrl);
            console.log('Establishing WebSocket connection...');
            this.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);
            this.ws.on('open', this.handleOpen.bind(this));
            this.ws.on('message', this.handleMessage.bind(this));
            this.ws.on('close', this.handleClose.bind(this));
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', {
                    message: error.message,
                    error
                });
                this.handleError(error);
            });
            return new Promise((resolve, reject) => {
                this.ws.once('open', () => {
                    console.log('WebSocket connection established');
                    resolve();
                });
                this.ws.once('error', (error) => {
                    console.error('WebSocket connection failed:', error);
                    reject(error);
                });
            });
        }
        catch (error) {
            const err = error;
            console.error('Failed to connect to Discord Gateway:', {
                name: err.name,
                message: err.message,
                stack: err.stack,
                error: err
            });
            throw error;
        }
    }
    async getGatewayUrl() {
        try {
            console.log('Fetching Gateway URL...');
            const response = await fetch('https://discord.com/api/v10/gateway/bot', {
                headers: {
                    Authorization: `Bot ${this.token}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get gateway URL: ${response.status} ${response.statusText}\n${errorText}`);
            }
            const data = await response.json();
            console.log('Gateway URL fetched successfully');
            return data.url;
        }
        catch (error) {
            console.error('Error getting Gateway URL:', error);
            throw error;
        }
    }
    handleOpen() {
        console.log('Connected to Discord Gateway');
    }
    handleMessage(data) {
        try {
            const payload = JSON.parse(data.toString());
            if (payload.s)
                this.sequence = payload.s;
            switch (payload.op) {
                case GatewayOpcodes.Hello:
                    this.handleHello(payload.d);
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
                    this.handleInvalidSession(payload.d);
                    break;
                case GatewayOpcodes.Reconnect:
                    this.handleReconnect();
                    break;
            }
        }
        catch (error) {
            console.error('Error handling Gateway message:', error);
        }
    }
    handleHello(data) {
        this.startHeartbeat(data.heartbeat_interval);
        this.identify();
    }
    startHeartbeat(interval) {
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
    sendHeartbeat() {
        if (!this.ws)
            return;
        this.lastHeartbeatAck = false;
        this.send({
            op: GatewayOpcodes.Heartbeat,
            d: this.sequence
        });
    }
    identify() {
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
    handleDispatch(payload) {
        if (!payload.t)
            return;
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
    isReadyData(data) {
        return data !== null &&
            typeof data === 'object' &&
            'session_id' in data &&
            'resume_gateway_url' in data;
    }
    isMessageData(data) {
        return data !== null &&
            typeof data === 'object' &&
            'content' in data &&
            'author' in data;
    }
    async handleIncomingMessage(message) {
        if (message.author.bot)
            return;
        try {
            const authStatus = await this.checkUserAuth(message.author.id);
            if (!authStatus.authenticated) {
                await this.sendDirectMessage(message.channel_id, "You need to link your Discord account with Snapgrade first. " +
                    "Please visit the Snapgrade website and connect your Discord account.");
                return;
            }
            if (authStatus.status !== 'ACTIVE') {
                await this.sendDirectMessage(message.channel_id, authStatus.status === 'SUSPENDED'
                    ? "Your account has been suspended. Please contact support."
                    : "Your subscription is inactive. Please renew your subscription to continue using Snapgrade.");
                return;
            }
            if (message.attachments.length > 0) {
                await this.handleImageAttachments(message);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            await this.sendDirectMessage(message.channel_id, "Sorry, there was an error processing your message. Please try again later.");
        }
    }
    async checkUserAuth(discordId) {
        try {
            const mappingRef = adminDb.collection('discord_mappings').where('discordId', '==', discordId);
            const snapshot = await mappingRef.get();
            if (snapshot.empty) {
                return { authenticated: false };
            }
            const mappingDoc = snapshot.docs[0];
            const mapping = discordMappingSchema.parse(mappingDoc.data());
            await mappingDoc.ref.update({
                lastUsed: new Date()
            });
            return {
                authenticated: true,
                status: mapping.status,
                firebaseUid: mapping.firebaseUid
            };
        }
        catch (error) {
            console.error('Error checking user auth:', error);
            throw error;
        }
    }
    async handleImageAttachments(message) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const images = message.attachments.filter(attachment => attachment.content_type && validImageTypes.includes(attachment.content_type));
        if (images.length === 0) {
            await this.sendDirectMessage(message.channel_id, "Please send a valid image file (JPEG, PNG, WEBP, or GIF).");
            return;
        }
        if (images.length > 1) {
            await this.sendDirectMessage(message.channel_id, "Please send only one image at a time.");
            return;
        }
        const image = images[0];
        await this.sendDirectMessage(message.channel_id, "Processing your image... This may take a moment.");
        try {
            const pendingImage = pendingImageSchema.parse({
                discordMessageId: message.id,
                channelId: message.channel_id,
                userId: message.author.id,
                imageUrl: image.url,
                filename: image.filename,
                contentType: image.content_type,
                size: image.size,
                status: 'PENDING',
                createdAt: new Date()
            });
            await adminDb.collection('pending_images').add(pendingImage);
        }
        catch (error) {
            console.error('Error storing image information:', error);
            await this.sendDirectMessage(message.channel_id, "Sorry, there was an error processing your image. Please try again later.");
        }
    }
    async sendDirectMessage(channelId, content) {
        try {
            await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });
        }
        catch (error) {
            console.error('Error sending direct message:', error);
            throw error;
        }
    }
    handleInvalidSession(resumable) {
        if (resumable) {
            this.resume();
        }
        else {
            setTimeout(() => {
                this.connect();
            }, Math.random() * 4000 + 1000);
        }
    }
    handleReconnect() {
        this.reconnect();
    }
    reconnect() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.sessionId && this.resumeGatewayUrl) {
            this.resume();
        }
        else {
            this.connect();
        }
    }
    resume() {
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
    handleClose(code) {
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
    handleError(error) {
        console.error('Gateway error:', error);
    }
    send(payload) {
        if (!this.ws)
            return;
        try {
            this.ws.send(JSON.stringify(payload));
        }
        catch (error) {
            console.error('Error sending payload to Gateway:', error);
        }
    }
    async disconnect() {
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
