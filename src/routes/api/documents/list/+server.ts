// File: src/routes/api/documents/list/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.uid) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { filters } = await request.json();
        
        let query = adminDb.collection('documents')
            .where('userId', '==', locals.uid);
        
        // Apply filters
        if (filters.classId) {
            query = query.where('classId', '==', filters.classId);
        }
        
        if (filters.studentId) {
            query = query.where('studentId', '==', filters.studentId);
        }
        
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        
        const docs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
            };
        });
        
        // Date range filtering
        let filteredDocs = docs;
        if (filters.dateRange?.start || filters.dateRange?.end) {
            const start = filters.dateRange.start ? new Date(filters.dateRange.start) : new Date(0);
            const end = filters.dateRange.end ? new Date(filters.dateRange.end) : new Date();
            
            filteredDocs = docs.filter(doc => {
                const date = doc.createdAt ? new Date(doc.createdAt) : null;
                return date && date >= start && date <= end;
            });
        }
        
        return json({ documents: filteredDocs });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
};