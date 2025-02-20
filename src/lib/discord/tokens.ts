import { adminDb } from '../firebase/admin';
import { envSchema } from '../schemas/env';
import { z } from 'zod';

const env = envSchema.parse({
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI
});

const discordTokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string()
});

const storedTokenSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_at: z.date(),
    updated_at: z.date()
});

type DiscordToken = z.infer<typeof discordTokenSchema>;
type StoredToken = z.infer<typeof storedTokenSchema>;

/**
 * Get a valid access token for a user
 * Will refresh the token if it's expired
 */
export async function getAccessToken(userId: string): Promise<string | null> {
    const tokenDoc = await adminDb.collection('discord_tokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
        return null;
    }

    try {
        const tokenData = storedTokenSchema.parse(tokenDoc.data());
        
        // Check if token is expired or will expire in the next 5 minutes
        if (tokenData.expires_at.getTime() - 5 * 60 * 1000 < Date.now()) {
            // Token needs refresh
            try {
                const newToken = await refreshToken(userId, tokenData.refresh_token);
                return newToken.access_token;
            } catch (error) {
                console.error('Failed to refresh token:', error);
                return null;
            }
        }

        return tokenData.access_token;
    } catch (error) {
        console.error('Invalid token data:', error);
        return null;
    }
}

/**
 * Refresh an expired token
 */
async function refreshToken(userId: string, refreshToken: string): Promise<DiscordToken> {
    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Token refresh failed:', error);
        
        // Delete invalid token
        await adminDb.collection('discord_tokens').doc(userId).delete();
        
        throw new Error('Failed to refresh token');
    }

    const newToken = discordTokenSchema.parse(await response.json());

    // Store new token
    const storedToken: StoredToken = {
        access_token: newToken.access_token,
        refresh_token: newToken.refresh_token,
        expires_at: new Date(Date.now() + newToken.expires_in * 1000),
        updated_at: new Date()
    };

    await adminDb.collection('discord_tokens').doc(userId).set(storedToken);

    return newToken;
}

/**
 * Revoke a user's Discord tokens
 */
export async function revokeTokens(userId: string): Promise<void> {
    const tokenDoc = await adminDb.collection('discord_tokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
        return;
    }

    try {
        const tokenData = storedTokenSchema.parse(tokenDoc.data());
        
        // Revoke the tokens with Discord
        await fetch('https://discord.com/api/oauth2/token/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: env.DISCORD_CLIENT_ID,
                client_secret: env.DISCORD_CLIENT_SECRET,
                token: tokenData.access_token
            })
        });

        // Delete tokens from database
        await adminDb.collection('discord_tokens').doc(userId).delete();
        
        // Update discord mapping status
        const mappingQuery = await adminDb
            .collection('discord_mappings')
            .where('firebaseUid', '==', userId)
            .limit(1)
            .get();

        if (!mappingQuery.empty) {
            await mappingQuery.docs[0].ref.update({
                status: 'INACTIVE',
                lastUsed: new Date()
            });
        }
    } catch (error) {
        console.error('Invalid token data:', error);
        // Still delete the token document even if parsing failed
        await adminDb.collection('discord_tokens').doc(userId).delete();
    }
}