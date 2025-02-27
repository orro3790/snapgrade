// File: src/routes/api/documents/update/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';
import { documentUpdateSchema } from '$lib/schemas/document';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.uid) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const updateData = await request.json();
        
        // Log the received data for debugging
        console.log('Document update request received:', updateData);
        
        // Validate using the imported Zod schema
        const result = documentUpdateSchema.safeParse(updateData);
        
        if (!result.success) {
            // Format Zod validation errors
            const formattedErrors = result.error.format();
            console.error('Validation error:', formattedErrors);
            return json({
                error: 'Invalid document update data',
                details: formattedErrors
            }, { status: 400 });
        }
        
        // Extract validated data
        const { documentId, classId, className, studentId, studentName } = result.data;
        
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
        
        // Enhanced error handling with more specific messages
        let errorMessage = 'Failed to update document';
        const statusCode = 500;
        
        if (error instanceof Error) {
            errorMessage = `${errorMessage}: ${error.message}`;
            
            // Log stack trace for server debugging
            console.error('Stack trace:', error.stack);
        }
        
        return json({
            error: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: statusCode });
    }
};