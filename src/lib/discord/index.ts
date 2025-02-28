import { startBot as initBot } from './bot';
import { initScheduledTasks } from './scheduled-tasks';

/**
 * Initialize and start the Discord bot
 */
async function startBot() {
    try {
        console.log('Starting Discord bot...');
        
        // Start the bot using the function from bot.ts
        const cleanup = await initBot();
        // Log is already printed in bot.ts via the WebSocket 'open' event

        // Initialize scheduled tasks
        initScheduledTasks();
        console.log('Scheduled tasks initialized');

        // Handle process signals - with proper process exit
        process.on('SIGINT', async () => {
            console.log('Received SIGINT signal');
            await cleanup();
            // Exit the process after cleanup
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM signal');
            await cleanup();
            // Exit the process after cleanup
            process.exit(0);
        });

        return cleanup;
    } catch (error) {
        console.error('Failed to start bot:', formatError(error));
        process.exit(1);
    }
}

/**
 * Format error details for logging
 */
function formatError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }
    return { error };
}

// Handle unhandled errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', formatError(error));
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', formatError(error));
    process.exit(1);
});

// Start the bot
startBot().catch(error => {
    console.error('Failed to start bot:', formatError(error));
    process.exit(1);
});