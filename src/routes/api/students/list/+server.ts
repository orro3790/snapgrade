// File: src/routes/api/students/list/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.uid) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { classId } = await request.json();
        
        if (!classId) {
            return json({ error: 'Class ID is required' }, { status: 400 });
        }
        
        const snapshot = await adminDb.collection('students')
            .where('classId', '==', classId)
            .where('status', '==', 'active')
            .get();
        
        const students = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        return json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        return json({ error: 'Failed to fetch students' }, { status: 500 });
    }
};