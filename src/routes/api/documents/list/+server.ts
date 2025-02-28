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
        
        // Get the user's Discord ID if available (for documents created through Discord)
        const discordIdSnapshot = await adminDb.collection('discord_mappings')
            .where('firebaseUid', '==', locals.uid)
            .limit(1)
            .get();
            
        const discordId = !discordIdSnapshot.empty
            ? discordIdSnapshot.docs[0].data().discordId
            : null;
        
        console.log(`Fetching documents for user: ${locals.uid}, Discord ID: ${discordId || 'Not found'}`);
        
        // Need to use two separate queries since Firestore doesn't support OR conditions
        // First query: Get documents with Firebase UID
        let mainQuery = adminDb.collection('documents')
            .where('userId', '==', locals.uid);
        
        // Apply filters to main query
        if (filters.classId) {
            mainQuery = mainQuery.where('classId', '==', filters.classId);
        }
        
        if (filters.studentId) {
            mainQuery = mainQuery.where('studentId', '==', filters.studentId);
        }
        
        if (filters.status) {
            mainQuery = mainQuery.where('status', '==', filters.status);
        }
        
        // Execute the main query
        const mainSnapshot = await mainQuery.orderBy('createdAt', 'desc').get();
        const mainDocs = mainSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
            };
        });
        
        let allDocs = [...mainDocs];
        
        // If we have a Discord ID, also fetch documents created with it
        if (discordId) {
            let discordQuery = adminDb.collection('documents')
                .where('userId', '==', discordId);
            
            // Apply the same filters
            if (filters.classId) {
                discordQuery = discordQuery.where('classId', '==', filters.classId);
            }
            
            if (filters.studentId) {
                discordQuery = discordQuery.where('studentId', '==', filters.studentId);
            }
            
            if (filters.status) {
                discordQuery = discordQuery.where('status', '==', filters.status);
            }
            
            const discordSnapshot = await discordQuery.orderBy('createdAt', 'desc').get();
            const discordDocs = discordSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                    updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
                };
            });
            
            console.log(`Found ${discordDocs.length} documents with Discord ID and ${mainDocs.length} with Firebase UID`);
            
            // Combine both sets of docs
            allDocs = [...mainDocs, ...discordDocs];
            
            // Sort combined results by createdAt
            allDocs.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB.getTime() - dateA.getTime(); // descending order
            });
        }
        
        // Date range filtering
        let filteredDocs = allDocs;
        if (filters.dateRange?.start || filters.dateRange?.end) {
            const start = filters.dateRange.start ? new Date(filters.dateRange.start) : new Date(0);
            const end = filters.dateRange.end ? new Date(filters.dateRange.end) : new Date();
            
            filteredDocs = allDocs.filter((doc) => {
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