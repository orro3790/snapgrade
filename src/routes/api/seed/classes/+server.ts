import { classSchema } from '$lib/schemas/class';
import { adminDb } from '$lib/firebase/admin';
import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';
import { generateRandomClass } from '$lib/utils/seedGenerators';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { data = {} } = await request.json();
        
        // Generate Firestore document reference first
        const docRef = adminDb.collection('classes').doc();
        
        // Generate random data merged with provided data
        const documentData = generateRandomClass({
            ...data,
            metadata: {
                id: docRef.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...data.metadata
            }
        });
        
        // Validate the merged data
        const validatedClass = classSchema.parse(documentData);
        
        // Store in Firestore
        await docRef.set(validatedClass);
        
        return json({
            status: 'success' as const,
            data: validatedClass
        });
        
    } catch (error) {
        console.error('Error:', error);
        
        if (error instanceof z.ZodError) {
            return json(
                { 
                    status: 'error' as const,
                    message: 'Invalid class data format',
                    errors: error.errors
                },
                { status: 400 }
            );
        }
        
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
