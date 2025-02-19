import { DiscordBot } from './snapbot.js';
const INTENTS = ((1 << 0) |
    (1 << 9) |
    (1 << 15));
export async function initializeBot(token) {
    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required but not provided');
    }
    const bot = new DiscordBot(token, INTENTS);
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
        await bot.connect();
        console.log('Bot initialized and connected to Discord');
        return bot;
    }
    catch (error) {
        console.error('Failed to initialize bot:', error);
        throw error;
    }
}
async function cleanup(bot) {
    try {
        await bot.disconnect();
        console.log('Bot disconnected and cleanup completed');
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
