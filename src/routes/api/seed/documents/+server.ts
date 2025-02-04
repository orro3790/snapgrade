// File: src/routes/api/seed/documents/+server.ts
import { documentSchema, documentResponseSchema } from '$lib/schemas/document';
import { adminDb } from '$lib/firebase/admin';
import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';
import { generateRandomDocument } from '$lib/utils/seedGenerators';


export const POST: RequestHandler = async ({ request }) => {
    try {
        const { data = {} } = await request.json();
        
        // Generate random data merged with provided data
        const documentData = generateRandomDocument(data);
        
        // Validate the merged data
        const validatedDoc = documentSchema.parse(documentData);
        
        // Store in Firestore
        const docRef = await adminDb
            .collection('documents')
            .add(validatedDoc);
            
        // Create response with document ID
        const response = documentResponseSchema.parse({
            ...validatedDoc,
            id: docRef.id
        });
        
        return json({
            status: 'success' as const,
            data: response
        });
        
    } catch (error) {
        console.error('Error:', error);
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return json(
                { 
                    status: 'error' as const,
                    message: 'Invalid document format',
                    errors: error.errors
                },
                { status: 400 }
            );
        }
        
        // Handle Firebase errors
        if (error instanceof FirebaseError) {
            return json(
                { 
                    status: 'error' as const,
                    message: error.message,
                    code: error.code
                },
                { status: 500 }
            );
        }
        
        // Handle unknown errors
        return json(
            { 
                status: 'error' as const,
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'internal/unknown'
            },
            { status: 500 }
        );
    }
};
