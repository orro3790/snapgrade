import { redirect, type RequestHandler } from '@sveltejs/kit';
import { revokeTokens } from '$lib/discord/tokens';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		await revokeTokens(locals.user.id);
		return redirect(303, '/settings?discord=disconnected');
	} catch (error) {
		console.error('Failed to disconnect Discord:', error);
		return redirect(303, '/settings?error=discord_disconnect_failed');
	}
};