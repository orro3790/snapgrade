import WebSocket from 'ws';
import { z } from 'zod';
import { handleIncomingMessage } from './messageHandlers';
import { 
    rawDiscordMessageSchema,
    transformDiscordMessage
} from '../schemas/discord';
import { updateStatus } from './statusMonitor';

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
export const sendPayload = (ws: WebSocket, payload: z.infer<typeof gatewayPayloadSchema>): void => {
    try {
        console.log('Sending payload:', {
            op: payload.op,
            type: payload.t,
            hasData: !!payload.d
        });
        ws.send(JSON.stringify(payload));
    } catch (error) {
        console.error('Error sending payload:', error);
        updateStatus('error', error instanceof Error ? error : new Error('Failed to send payload'));
    }
};

/**
 * Send identify payload to the Gateway
 */
export const sendIdentify = (ws: WebSocket, token: string, intents: number): void => {
    console.log('Sending identify payload with intents:', intents.toString(2));
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
    console.log('Received HELLO with heartbeat interval:', helloData.heartbeat_interval);
    
    // Start heartbeating
    state.heartbeatInterval = startHeartbeat(
        state.ws,
        helloData.heartbeat_interval,
        state.sequence,
        () => {
            if (!state.lastHeartbeatAck) {
                console.error('Missed heartbeat ACK, reconnecting...');
                updateStatus('error', new Error('Missed heartbeat ACK'));
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
    updateStatus('connected');
    console.log('Bot is ready! Session ID:', readyData.session_id);
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
        console.log('Received gateway payload:', {
            op: payload.op,
            type: payload.t,
            hasSequence: !!payload.s,
            hasData: !!payload.d
        });
        
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
                    console.log('Received MESSAGE_CREATE event');
                    const rawMessage = rawDiscordMessageSchema.parse(payload.d);
                    console.log('Message data:', {
                        id: rawMessage.id,
                        author: rawMessage.author.username,
                        content: rawMessage.content.substring(0, 50),
                        attachments: rawMessage.attachments.length
                    });
                    const message = transformDiscordMessage(rawMessage);
                    await handleIncomingMessage(message);
                }
                break;
            
            case 7: // RECONNECT
                console.log('Received RECONNECT request');
                updateStatus('connecting');
                state.ws?.close();
                break;
            
            case 9: // INVALID_SESSION
                console.log('Received INVALID_SESSION:', payload.d);
                if (payload.d === true) {
                    // Session is resumable
                    updateStatus('connecting');
                    state.ws?.close();
                } else {
                    // Session is not resumable
                    state.sessionId = null;
                    state.resumeGatewayUrl = null;
                    updateStatus('disconnected');
                    state.ws?.close();
                }
                break;
        }
    } catch (error) {
        console.error('Error handling gateway message:', error);
        updateStatus('error', error instanceof Error ? error : new Error('Failed to handle gateway message'));
    }
};