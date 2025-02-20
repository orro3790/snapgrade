import { redirect, type RequestHandler } from '@sveltejs/kit';
import { 
    DISCORD_CLIENT_ID,
    DISCORD_REDIRECT_URI
} from '$env/static/private';

// Scopes we need for the bot
const DISCORD_SCOPES = [
    'identify',           // Get user info
    'guilds',            // List user's guilds
    'guilds.join',       // Join guilds
    'messages.read'      // Read messages
].join(' ');

export const GET: RequestHandler = async ({ locals, cookies }) => {
    // Check if user is logged in
    if (!locals.user) {
        return redirect(303, '/login');
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();
    cookies.set('discord_oauth_state', state, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
    });

    // Redirect to Discord auth URL
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: DISCORD_SCOPES,
        state
    });

    return redirect(303, `https://discord.com/api/oauth2/authorize?${params}`);
};