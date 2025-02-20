import 'dotenv/config';
import { initializeBot } from './init.js';
import { getBotToken } from './tokenManager';
import { updateStatus } from './statusMonitor';

/**
 * Start the Discord bot
 */
async function startBot() {
    try {
        updateStatus('connecting');
        
        // Get bot token using our token manager
        const token = getBotToken();
        
        // Initialize bot and store cleanup function
        const cleanup = await initializeBot(token);
        console.log('Bot started successfully');
        
        // Update status to connected
        updateStatus('connected');

        // Keep the process alive
        process.stdin.resume();

        return cleanup;
    } catch (error) {
        const formattedError = formatError(error);
        console.error('Failed to start bot:', formattedError);
        updateStatus('error', error instanceof Error ? error : new Error('Unknown error'));
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
        updateStatus('disconnected');
        const cleanup = await startBot();
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
    updateStatus('error', error instanceof Error ? error : new Error('Unknown error'));
    void shutdown(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', formatError(error));
    updateStatus('error', error instanceof Error ? error : new Error('Unknown error'));
    void shutdown(1);
});

// Start the bot
startBot().catch(error => {
    console.error('Failed to start bot:', formatError(error));
    updateStatus('error', error instanceof Error ? error : new Error('Unknown error'));
    process.exit(1);
});