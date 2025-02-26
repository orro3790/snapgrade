// File: src/routes/api/classes/list/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.uid) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const snapshot = await adminDb.collection('classes')
            .where('userId', '==', locals.uid)
            .where('status', '==', 'active')
            .get();
        
        const classes = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        return json({ classes });
    } catch (error) {
        console.error('Error fetching classes:', error);
        return json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
};