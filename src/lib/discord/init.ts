import WebSocket from 'ws';
import { createGatewayState, getGatewayUrl, handleMessage } from './events';

// Discord Gateway Intents (https://discord.com/developers/docs/topics/gateway#gateway-intents)
const INTENTS = (
    (1 << 0) |  // GUILDS
    (1 << 9) |  // DIRECT_MESSAGES
    (1 << 15)   // MESSAGE_CONTENT
);

/**
 * Initialize the Discord bot connection
 * @param token Discord bot token
 * @returns Cleanup function to disconnect the bot
 */
export async function initializeBot(token: string): Promise<() => Promise<void>> {
    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required but not provided');
    }

    // Create gateway state
    const state = createGatewayState();

    try {
        // Get gateway URL
        const gatewayUrl = await getGatewayUrl(token);
        console.log('Using Gateway URL:', gatewayUrl);

        // Connect to gateway
        state.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);

        // Set up event handlers
        state.ws.on('message', async (data) => {
            await handleMessage(state, data, token, INTENTS);
        });

        state.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        state.ws.on('close', (code) => {
            console.log(`WebSocket closed with code ${code}`);
            cleanup();
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
            if (!state.ws) return reject(new Error('WebSocket not initialized'));

            state.ws.once('open', () => {
                console.log('Connected to Discord Gateway');
                resolve();
            });

            state.ws.once('error', reject);
        });

        // Handle process signals
        const cleanup = createCleanupHandler(state);
        setupProcessHandlers(cleanup);

        console.log('Bot initialized and connected to Discord');
        return cleanup;
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        throw error;
    }
}

/**
 * Create cleanup handler for the bot
 */
function createCleanupHandler(state: ReturnType<typeof createGatewayState>) {
    return async function cleanup(): Promise<void> {
        try {
            // Clear heartbeat interval
            if (state.heartbeatInterval) {
                clearInterval(state.heartbeatInterval);
                state.heartbeatInterval = null;
            }

            // Close WebSocket connection
            if (state.ws) {
                state.ws.close(1000, 'Bot shutting down');
                state.ws = null;
            }

            // Reset state
            state.sequence = null;
            state.sessionId = null;
            state.resumeGatewayUrl = null;
            state.lastHeartbeatAck = true;

            console.log('Bot disconnected and cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    };
}

/**
 * Set up process signal and error handlers
 */
function setupProcessHandlers(cleanup: () => Promise<void>): void {
    // Handle process signals
    process.on('SIGINT', async () => {
        console.log('Received SIGINT. Shutting down bot...');
        await cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM. Shutting down bot...');
        await cleanup();
        process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught exception:', error);
        await cleanup();
        process.exit(1);
    });

    process.on('unhandledRejection', async (error) => {
        console.error('Unhandled rejection:', error);
        await cleanup();
        process.exit(1);
    });
}