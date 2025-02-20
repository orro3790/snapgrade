import { adminDb } from '$lib/firebase/admin';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get Discord connection status
	const mappingQuery = await adminDb
		.collection('discord_mappings')
		.where('firebaseUid', '==', locals.user.id)
		.limit(1)
		.get();

	const discordConnected = !mappingQuery.empty;
	const discordStatus = discordConnected
		? mappingQuery.docs[0].data().status
		: null;

	return {
		discord: {
			connected: discordConnected,
			status: discordStatus
		}
	};
};