// File: src/routes/api/documents/batch/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.uid) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { action, documentIds } = await request.json();
        
        if (!action || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return json({ error: 'Invalid request parameters' }, { status: 400 });
        }
        
        if (action === 'delete') {
            // Verify all documents belong to the user
            const batch = adminDb.batch();
            const invalidDocIds: string[] = [];
            
            // Check each document
            for (const docId of documentIds) {
                const docRef = adminDb.collection('documents').doc(docId);
                const docSnap = await docRef.get();
                
                if (!docSnap.exists) {
                    invalidDocIds.push(docId);
                    continue;
                }
                
                const docData = docSnap.data() || {};
                if (docData.userId !== locals.uid) {
                    invalidDocIds.push(docId);
                    continue;
                }
                
                // Add to batch for deletion
                batch.delete(docRef);
            }
            
            if (invalidDocIds.length > 0) {
                return json({ 
                    error: 'Some documents could not be deleted',
                    invalidDocIds
                }, { status: 400 });
            }
            
            // Commit the batch
            await batch.commit();
            
            return json({ 
                success: true, 
                message: `Successfully deleted ${documentIds.length} document(s)` 
            });
        }
        
        return json({ error: 'Unsupported action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing batch action:', error);
        return json({ error: 'Failed to process documents' }, { status: 500 });
    }
};