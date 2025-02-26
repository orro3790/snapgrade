// File: src/routes/api/documents/update/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.uid) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { documentId, classId, className, studentId, studentName } = await request.json();
        
        if (!documentId) {
            return json({ error: 'Document ID is required' }, { status: 400 });
        }
        
        // Verify the document belongs to the user
        const docRef = adminDb.collection('documents').doc(documentId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            return json({ error: 'Document not found' }, { status: 404 });
        }
        
        const docData = docSnap.data() || {};
        if (docData.userId !== locals.uid) {
            return json({ error: 'Unauthorized to update this document' }, { status: 403 });
        }
        
        // Update the document
        await docRef.update({
            classId,
            className,
            studentId,
            studentName,
            updatedAt: new Date()
        });
        
        return json({ 
            success: true,
            message: 'Document updated successfully'
        });
    } catch (error) {
        console.error('Error updating document:', error);
        return json({ error: 'Failed to update document' }, { status: 500 });
    }
};