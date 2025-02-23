import { DiscordBot } from './bot';

// Discord Intents we need
const INTENTS = (1 << 0) | // GUILDS
               (1 << 9) | // GUILD_MESSAGES
               (1 << 12); // DIRECT_MESSAGES

/**
 * Initialize and start the Discord bot
 */
async function startBot() {
    try {
        console.log('Starting Discord bot...');
        
        // Get bot token from environment
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
        }

        // Create and connect bot
        const bot = new DiscordBot(token, INTENTS);
        await bot.connect();
        console.log('Bot connected successfully');

        // Setup cleanup function
        const cleanup = async () => {
            console.log('Disconnecting bot...');
            await bot.disconnect();
            console.log('Bot disconnected');
        };

        // Handle process signals
        process.on('SIGINT', () => void cleanup());
        process.on('SIGTERM', () => void cleanup());

        // Keep the process alive
        process.stdin.resume();

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