import { envSchema } from '../schemas/env';

/**
 * Validate and parse environment variables
 */
const validateEnv = () => envSchema.parse(process.env);

/**
 * Get the bot token, throwing an error if not configured
 */
export const getBotToken = (): string => {
    const env = validateEnv();
    if (!env.DISCORD_BOT_TOKEN) {
        throw new Error('DISCORD_BOT_TOKEN is required but not configured');
    }
    return env.DISCORD_BOT_TOKEN;
};

/**
 * Get the client ID for OAuth flows
 */
export const getClientId = (): string => {
    const env = validateEnv();
    return env.DISCORD_CLIENT_ID;
};

/**
 * Get the client secret for OAuth flows
 */
export const getClientSecret = (): string => {
    const env = validateEnv();
    return env.DISCORD_CLIENT_SECRET;
};

/**
 * Get the OAuth redirect URI
 */
export const getRedirectUri = (): string => {
    const env = validateEnv();
    return env.DISCORD_REDIRECT_URI;
};