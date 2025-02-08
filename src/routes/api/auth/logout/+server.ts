import { adminAuth } from '$lib/firebase/admin';
import { logout } from '$lib/server/auth';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * @description Logs out the user by revoking their refresh token and clearing cookies.
 */
export const POST: RequestHandler = async ({ cookies }) => {
	try {
		// Get the user's session cookie.
		const sessionCookie = cookies.get('__session');

		// If there's no session cookie, the user is already logged out.
		if (!sessionCookie) {
			return json({ message: 'Already logged out' });
		}

		// Decode the session cookie to get the user's UID.
		const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

		// Call the logout function from src/lib/server/auth.ts
		await logout(cookies, decodedToken.uid);

		return json({ message: 'Successfully logged out' });
	} catch (e) {
		console.error(e);
		throw error(500, 'Failed to logout');
	}
};
