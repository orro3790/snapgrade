import 'dotenv/config';
import { initializeBot } from './init.js';

/**
 * Cleanup function returned by initializeBot
 */
type Cleanup = () => Promise<void>;

// Global cleanup function
let cleanup: Cleanup | null = null;

/**
 * Start the Discord bot
 */
async function startBot() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required but not found in environment variables');
    }

    try {
        // Initialize bot and store cleanup function
        cleanup = await initializeBot(token);
        console.log('Bot started successfully');

        // Keep the process alive
        process.stdin.resume();
    } catch (error) {
        console.error('Failed to start bot:', formatError(error));
        process.exit(1);
    }
}

/**
 * Helper function to format error details
 */
function formatError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            error
        };
    }
    return { error };
}

/**
 * Gracefully shutdown the bot
 */
async function shutdown(code = 0) {
    try {
        if (cleanup) {
            console.log('Shutting down bot...');
            await cleanup();
        }
    } catch (error) {
        console.error('Error during shutdown:', formatError(error));
        code = 1;
    } finally {
        process.exit(code);
    }
}

// Handle process signals
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

// Handle unhandled errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', formatError(error));
    void shutdown(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', formatError(error));
    void shutdown(1);
});

// Start the bot
startBot().catch(error => {
    console.error('Failed to start bot:', formatError(error));
    process.exit(1);
});

// Export cleanup function for programmatic use
export { cleanup };