import 'dotenv/config';

/**
 * Start the Discord bot
 */
import { initializeBot } from './init.js';

// Global bot instance
let bot: Awaited<ReturnType<typeof initializeBot>> | null = null;

async function startBot() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required but not found in environment variables');
    }

    try {
        // Initialize and store bot instance
        bot = await initializeBot(token);
        console.log('Bot started successfully');

        // Keep the process alive
        process.stdin.resume();
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Helper function to format error details
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

// Start the bot and handle any errors
startBot().catch(error => {
    console.error('Failed to start bot:', formatError(error));
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: unknown) => {
    console.error('Unhandled promise rejection:', formatError(error));
    process.exit(1);
});

// Export bot instance for potential programmatic use
export { bot };