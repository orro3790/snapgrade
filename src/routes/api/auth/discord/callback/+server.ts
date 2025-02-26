import { redirect, type RequestHandler } from '@sveltejs/kit';
import { adminDb } from '$lib/firebase/admin';
import { discordMappingSchema } from '$lib/schemas/discord';
import { 
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI
} from '$env/static/private';
import { z } from 'zod';

const discordTokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string()
});

const discordUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    avatar: z.string().optional()
});

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
    // Check if user is logged in
    if (!locals.user) {
        return redirect(303, '/login');
    }

    const code = url.searchParams.get('code');
    if (!code) {
        return redirect(303, '/?modal=discordSettings&error=discord_auth_failed');
    }

    // Verify state
    const state = url.searchParams.get('state');
    const savedState = cookies.get('discord_oauth_state');
    
    if (!state || !savedState || state !== savedState) {
        console.error('Discord auth error: Invalid state');
        return redirect(303, '/?modal=discordSettings&error=discord_auth_failed');
    }

    // Clear state cookie
    cookies.delete('discord_oauth_state', { path: '/' });

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: DISCORD_REDIRECT_URI
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Discord token error:', error);
            return redirect(303, '/?modal=discordSettings&error=discord_auth_failed');
        }

        const tokens = discordTokenSchema.parse(await tokenResponse.json());

        // Get Discord user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`
            }
        });

        if (!userResponse.ok) {
            const error = await userResponse.text();
            console.error('Discord user error:', error);
            return redirect(303, '/?modal=discordSettings&error=discord_user_failed');
        }

        const discordUser = discordUserSchema.parse(await userResponse.json());

        // Check if mapping already exists
        const existingMapping = await adminDb
            .collection('discord_mappings')
            .where('discordId', '==', discordUser.id)
            .get();

        if (!existingMapping.empty) {
            // Update existing mapping
            const doc = existingMapping.docs[0];
            await doc.ref.update({
                lastUsed: new Date(),
                status: 'active'
            });
        } else {
            // Create new mapping
            const mapping = discordMappingSchema.parse({
                discordId: discordUser.id,
                firebaseUid: locals.user.id,
                createdAt: new Date(),
                lastUsed: new Date(),
                status: 'active'
            });

            await adminDb.collection('discord_mappings').add(mapping);
        }

        return redirect(303, '/?modal=discordSettings&discord=connected');
    } catch (error) {
        console.error('Discord auth error:', error);
        return redirect(303, '/?modal=discordSettings&error=discord_auth_failed');
    }
};