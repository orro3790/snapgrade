import 'dotenv/config';
import { initializeBot } from './init.js';
let bot = null;
async function startBot() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required but not found in environment variables');
    }
    try {
        bot = await initializeBot(token);
        console.log('Bot started successfully');
        process.stdin.resume();
    }
    catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}
function formatError(error) {
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
startBot().catch(error => {
    console.error('Failed to start bot:', formatError(error));
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', formatError(error));
    process.exit(1);
});
export { bot };
