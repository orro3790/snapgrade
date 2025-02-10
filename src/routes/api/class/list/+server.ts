import { adminAuth, adminDb } from '$lib/firebase/admin';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { FirebaseError } from 'firebase/app';

/**
 * GET endpoint to fetch a list of active classes
 * Returns a simplified list containing just id and name for dropdown selection
 */
export const GET: RequestHandler = async (event) => {
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

        // Fetch active classes from Firestore
        const classesSnapshot = await adminDb
            .collection('classes')
            .where('status', '==', 'active')
            .get();

        // Transform to simplified format for dropdown
        const classes = classesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));

        // Validate response format
        const responseSchema = z.array(
            z.object({
                id: z.string(),
                name: z.string()
            })
        );
        
        const validatedClasses = responseSchema.parse(classes);
        
        return json({
            status: 'success' as const,
            data: validatedClasses
        });
        
    } catch (error) {
        console.error('Error:', error);
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return json(
                { 
                    status: 'error' as const,
                    message: 'Invalid response format',
                    errors: error.errors
                },
                { status: 500 }
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
