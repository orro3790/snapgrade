/**
 * Start the Discord bot
 */
import { initializeBot } from './init';

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

// Start the bot
startBot();

// Export bot instance for potential programmatic use
export { bot };