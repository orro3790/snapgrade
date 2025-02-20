import { z } from 'zod';

export const envSchema = z.object({
    DISCORD_CLIENT_ID: z.string().min(1, 'Discord client ID is required'),
    DISCORD_CLIENT_SECRET: z.string().min(1, 'Discord client secret is required'),
    DISCORD_REDIRECT_URI: z.string().url('Discord redirect URI must be a valid URL'),
});

export type Env = z.infer<typeof envSchema>;