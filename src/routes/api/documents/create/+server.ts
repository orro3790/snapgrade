import { createStagedDocumentSchema, createDocumentSchema, documentResponseSchema  } from '$lib/schemas/document';
import { adminAuth, adminDb } from '$lib/firebase/admin';
import type { RequestHandler } from '../$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';

// Create a new document
export const POST: RequestHandler = async (event) => {
    const { request } = event;
    try {
        // Get session cookie
        const sessionCookie = event.cookies.get('session');
        if (!sessionCookie) {
            return json(
                { 
                    status: 'error' as const, 
                    message: 'No session cookie found',
                    code: 'auth/no-session'
                },
                { status: 401 }
            );
        }

        // Verify the session cookie
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Fetch current user status from Firestore
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists) {
            return json(
                { 
                    status: 'error' as const, 
                    message: 'User not found',
                    code: 'auth/user-not-found'
                },
                { status: 404 }
            );
        }

        const userData = userDoc.data();

        console.log(userData);
        if (userData?.metadata.accountStatus !== 'active') {
            return json(
                { 
                    status: 'error' as const, 
                    message: 'Account not active',
                    code: 'auth/account-inactive'
                },
                { status: 403 }
            );
        }

        // Parse and validate request data using appropriate schema
        const { data } = await request.json();

        // Determine which schema to use based on 'status'
        let validatedDoc;
        if (data.status === 'staged') {
            validatedDoc = createStagedDocumentSchema.parse({
                ...data,
                userId: decodedToken.uid,
                sourceType: data.sourceType || 'llmwhisperer' // Default to 'llmwhisperer' if not provided
            });
        } else {
            validatedDoc = createDocumentSchema.parse({
                ...data,
                userId: decodedToken.uid,
                sourceType: 'manual' // Web submissions are always manual
            });
        }

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
