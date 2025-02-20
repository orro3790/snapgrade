import WebSocket from 'ws';
import { z } from 'zod';
import { handleIncomingMessage } from './messageHandlers';
import type { MessageData } from '../schemas/discord';

// Gateway payload schemas
const gatewayPayloadSchema = z.object({
    op: z.number(),
    d: z.unknown().optional(),
    s: z.number().nullable().optional(),
    t: z.string().nullable().optional()
});

const helloDataSchema = z.object({
    heartbeat_interval: z.number()
});

const readyDataSchema = z.object({
    session_id: z.string(),
    resume_gateway_url: z.string()
});

const identifyPropertiesSchema = z.object({
    os: z.string(),
    browser: z.string(),
    device: z.string()
});

const identifySchema = z.object({
    token: z.string(),
    intents: z.number(),
    properties: identifyPropertiesSchema
});

// Discord API message schemas
const discordAuthorSchema = z.object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    bot: z.boolean().optional()
});

const discordAttachmentSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    filename: z.string(),
    content_type: z.string().optional(),
    size: z.number()
});

const discordMessageSchema = z.object({
    id: z.string(),
    channel_id: z.string(),
    author: discordAuthorSchema,
    content: z.string(),
    attachments: z.array(discordAttachmentSchema)
});

// Inferred types
type GatewayPayload = z.infer<typeof gatewayPayloadSchema>;
type DiscordMessage = z.infer<typeof discordMessageSchema>;

// Gateway state management
interface GatewayState {
    ws: WebSocket | null;
    heartbeatInterval: NodeJS.Timeout | null;
    sequence: number | null;
    sessionId: string | null;
    resumeGatewayUrl: string | null;
    lastHeartbeatAck: boolean;
}

/**
 * Create initial gateway state
 */
export const createGatewayState = (): GatewayState => ({
    ws: null,
    heartbeatInterval: null,
    sequence: null,
    sessionId: null,
    resumeGatewayUrl: null,
    lastHeartbeatAck: true
});

/**
 * Get the Gateway URL from Discord's API
 */
export const getGatewayUrl = async (token: string): Promise<string> => {
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
 * Send a payload to the Gateway
 */
export const sendPayload = (ws: WebSocket, payload: GatewayPayload): void => {
    try {
        ws.send(JSON.stringify(payload));
    } catch (error) {
        console.error('Error sending payload:', error);
    }
};

/**
 * Send identify payload to the Gateway
 */
export const sendIdentify = (ws: WebSocket, token: string, intents: number): void => {
    const identifyData = identifySchema.parse({
        token,
        intents,
        properties: {
            os: 'linux',
            browser: 'snapgrade',
            device: 'snapgrade'
        }
    });

    sendPayload(ws, {
        op: 2, // IDENTIFY
        d: identifyData
    });
};

/**
 * Send heartbeat to the Gateway
 */
export const sendHeartbeat = (ws: WebSocket, sequence: number | null): void => {
    sendPayload(ws, {
        op: 1, // HEARTBEAT
        d: sequence
    });
};

/**
 * Start heartbeat interval
 */
export const startHeartbeat = (
    ws: WebSocket,
    interval: number,
    sequence: number | null,
    onMissedAck: () => void
): NodeJS.Timeout => {
    // Add jitter to prevent thundering herd
    const jitter = Math.random();
    const initialDelay = interval * jitter;

    // Send first heartbeat after jittered delay
    setTimeout(() => {
        sendHeartbeat(ws, sequence);
    }, initialDelay);

    // Return interval for subsequent heartbeats
    return setInterval(() => {
        if (!ws) return;
        sendHeartbeat(ws, sequence);
        
        // Check if we got an ack for the last heartbeat
        setTimeout(() => {
            if (!ws) return;
            onMissedAck();
        }, interval / 2);
    }, interval);
};

/**
 * Handle Hello event
 */
export const handleHello = (
    state: GatewayState,
    data: unknown,
    token: string,
    intents: number
): void => {
    if (!state.ws) return;

    const helloData = helloDataSchema.parse(data);
    
    // Start heartbeating
    state.heartbeatInterval = startHeartbeat(
        state.ws,
        helloData.heartbeat_interval,
        state.sequence,
        () => {
            if (!state.lastHeartbeatAck) {
                console.error('Missed heartbeat ACK, reconnecting...');
                state.ws?.close();
            }
            state.lastHeartbeatAck = false;
        }
    );

    // Send identify
    sendIdentify(state.ws, token, intents);
};

/**
 * Handle Ready event
 */
export const handleReady = (state: GatewayState, data: unknown): void => {
    const readyData = readyDataSchema.parse(data);
    state.sessionId = readyData.session_id;
    state.resumeGatewayUrl = readyData.resume_gateway_url;
    console.log('Bot is ready!');
};

/**
 * Transform Discord API message to internal format
 */
const transformMessage = (discordMessage: unknown): MessageData => {
    // Validate and parse the Discord message
    const message = discordMessageSchema.parse(discordMessage);
    
    // Transform to our internal format
    return {
        id: message.id,
        channelId: message.channel_id,
        author: {
            id: message.author.id
        },
        attachments: message.attachments.map(att => ({
            id: att.id,
            url: att.url,
            filename: att.filename,
            contentType: att.content_type,
            size: att.size
        }))
    };
};

/**
 * Handle Gateway message
 */
export const handleMessage = async (
    state: GatewayState,
    data: WebSocket.Data,
    token: string,
    intents: number
): Promise<void> => {
    try {
        const payload = gatewayPayloadSchema.parse(JSON.parse(data.toString()));
        
        // Update sequence if present
        if (payload.s) state.sequence = payload.s;

        switch (payload.op) {
            case 10: // HELLO
                handleHello(state, payload.d, token, intents);
                break;
            
            case 11: // HEARTBEAT_ACK
                state.lastHeartbeatAck = true;
                break;
            
            case 0: // DISPATCH
                if (payload.t === 'READY') {
                    handleReady(state, payload.d);
                } else if (payload.t === 'MESSAGE_CREATE') {
                    const message = transformMessage(payload.d);
                    await handleIncomingMessage(message);
                }
                break;
            
            case 7: // RECONNECT
                state.ws?.close();
                break;
            
            case 9: // INVALID_SESSION
                if (payload.d === true) {
                    // Session is resumable
                    state.ws?.close();
                } else {
                    // Session is not resumable
                    state.sessionId = null;
                    state.resumeGatewayUrl = null;
                    state.ws?.close();
                }
                break;
        }
    } catch (error) {
        console.error('Error handling gateway message:', error);
    }
};