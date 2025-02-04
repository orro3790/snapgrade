import { documentSchema, documentResponseSchema  } from '$lib/schemas/document';
import { adminAuth, adminDb } from '$lib/firebase/admin';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';

export const POST: RequestHandler = async (event) => {
    const { request } = event;
    try {
        // Get bearer token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json(
                { 
                    status: 'error' as const, 
                    message: 'Missing or invalid authorization header',
                    code: 'auth/invalid-header'
                },
                { status: 401 }
            );
        }

        // Extract and verify the token
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        // Verify account status
        if (decodedToken.customClaims?.accountStatus !== 'ACTIVE') {
            return json(
                { 
                    status: 'error' as const, 
                    message: 'Account not active',
                    code: 'auth/account-inactive'
                },
                { status: 403 }
            );
        }

        // Parse and validate request data
        const { data } = await request.json();
        const validatedDoc = documentSchema.parse({
            ...data,
            userId: decodedToken.uid,
            sourceType: 'manual' // Web submissions are always manual
        });
        
        // Add metadata
        const docWithMetadata = {
            ...validatedDoc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Store in Firestore
        const docRef = await adminDb
            .collection('documents')
            .add(docWithMetadata);
        
        // Validate response format
        const response = documentResponseSchema.parse({
            ...docWithMetadata,
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
                { status: error.code.includes('auth') ? 401 : 500 }
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
