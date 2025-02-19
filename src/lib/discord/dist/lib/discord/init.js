import { DiscordBot } from './snapbot.js';
// Discord Gateway Intents (https://discord.com/developers/docs/topics/gateway#gateway-intents)
const INTENTS = ((1 << 0) | // GUILDS
    (1 << 9) | // DIRECT_MESSAGES
    (1 << 15) // MESSAGE_CONTENT
);
/**
 * Initialize the Discord bot
 * @param token Discord bot token
 */
export async function initializeBot(token) {
    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required but not provided');
    }
    // Create bot instance
    const bot = new DiscordBot(token, INTENTS);
    // Handle process signals
    process.on('SIGINT', async () => {
        console.log('Received SIGINT. Shutting down bot...');
        await cleanup(bot);
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM. Shutting down bot...');
        await cleanup(bot);
        process.exit(0);
    });
    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught exception:', error);
        await cleanup(bot);
        process.exit(1);
    });
    process.on('unhandledRejection', async (error) => {
        console.error('Unhandled rejection:', error);
        await cleanup(bot);
        process.exit(1);
    });
    try {
        // Connect to Discord
        await bot.connect();
        console.log('Bot initialized and connected to Discord');
        return bot;
    }
    catch (error) {
        console.error('Failed to initialize bot:', error);
        throw error;
    }
}
/**
 * Clean up bot resources
 */
async function cleanup(bot) {
    try {
        // Gracefully disconnect the bot
        await bot.disconnect();
        console.log('Bot disconnected and cleanup completed');
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
