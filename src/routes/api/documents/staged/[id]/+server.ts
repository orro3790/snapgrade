// File: src/routes/api/documents/staged/[id]/+server.ts
import { adminAuth, adminDb } from '$lib/firebase/admin';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { documentResponseSchema } from '$lib/schemas/document';
import { FirebaseError } from 'firebase/app';

/**
 * GET endpoint to fetch a specific staged document by ID
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

    // Get document ID from params
    const documentId = event.params.id;

    // Validate document ID
    const idSchema = z.string().uuid();
    const validatedId = idSchema.safeParse(documentId);

    if (!validatedId.success) {
      return json(
        {
          status: 'error' as const,
          message: 'Invalid document ID',
          errors: validatedId.error.errors
        },
        { status: 400 }
      );
    }

    // Fetch staged document from Firestore
    const documentSnapshot = await adminDb.collection('documents').doc(documentId).get();

    if (!documentSnapshot.exists) {
      return json(
        {
          status: 'error' as const,
          message: 'Document not found',
          code: 'documents/not-found'
        },
        { status: 404 }
      );
    }

    // Ensure document is staged
    const documentData = documentSnapshot.data();
    if (documentData?.status !== 'staged') {
      return json(
        {
          status: 'error' as const,
          message: 'Document is not staged',
          code: 'documents/not-staged'
        },
        { status: 400 }
      );
    }

    // Validate response format
    const validatedDocument = documentResponseSchema.safeParse({
      ...documentData,
      id: documentSnapshot.id,
      createdAt: documentData?.createdAt?.toDate(),
      updatedAt: documentData?.updatedAt?.toDate()
    });

    if (!validatedDocument.success) {
      return json(
        {
          status: 'error' as const,
          message: 'Invalid document format',
          errors: validatedDocument.error.errors
        },
        { status: 500 }
      );
    }

    return json({
      status: 'success' as const,
      data: validatedDocument.data
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
