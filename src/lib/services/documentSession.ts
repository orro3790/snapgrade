import { adminDb } from '../firebase/admin';
import {
    documentSessionSchema,
    type DocumentSession,
    type DocumentSessionUpdate
} from '../schemas/documentSession';
import {
    pendingImageSchema,
    type PendingImage,
    isCdnUrlExpired,
    extractCdnExpiry
} from '../schemas/pending-image';
import * as documentProcessing from './documentProcessing';

// Constants
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MiB

/**
 * Create a new document session
 * @param userId User's Discord ID
 * @param expectedPages Number of pages expected in the document
 * @returns Created document session
 * @throws Error if validation fails
 */
export const createSession = async (
    userId: string,
    expectedPages: number
): Promise<DocumentSession> => {
    // Create and validate session object
    const session = documentSessionSchema.parse({
        sessionId: crypto.randomUUID(),
        userId,
        status: 'COLLECTING',
        pageCount: expectedPages,
        receivedPages: 0,
        pageOrder: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_TIMEOUT),
        totalSize: 0
    });

    // Store in Firestore
    await adminDb
        .collection('document_sessions')
        .doc(session.sessionId)
        .set(session);

    return session;
};

/**
 * Get active session for user
 * @param userId User's Discord ID
 * @returns Active session or null if none found
 */
export const getActiveSession = async (userId: string): Promise<DocumentSession | null> => {
    const snapshot = await adminDb
        .collection('document_sessions')
        .where('userId', '==', userId)
        .where('status', '==', 'COLLECTING')
        .where('expiresAt', '>', new Date())
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    // Get the raw data from Firestore
    const rawData = snapshot.docs[0].data();
    
    // Convert Firestore Timestamps to JavaScript Date objects
    const processedData = {
        ...rawData,
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : rawData.createdAt,
        expiresAt: rawData.expiresAt?.toDate ? rawData.expiresAt.toDate() : rawData.expiresAt,
        completedAt: rawData.completedAt?.toDate ? rawData.completedAt.toDate() : rawData.completedAt
    };

    // Parse and validate session data
    const session = documentSessionSchema.parse(processedData);
    return session;
};

/**
 * Add image to session with size validation
 * @param session Current document session
 * @param pendingImage Image to add to session
 * @throws Error if size limit exceeded or CDN URL expired
 */
export const addImageToSession = async (
    session: DocumentSession,
    pendingImage: PendingImage
): Promise<void> => {
    // Validate total size won't exceed limit
    const newTotalSize = session.totalSize + pendingImage.size;
    if (newTotalSize > MAX_TOTAL_SIZE) {
        throw new Error(`Adding this image would exceed the 10 MiB total size limit`);
    }

    // Extract and validate CDN URL expiry
    const expiryHex = extractCdnExpiry(pendingImage.imageUrl);
    if (!expiryHex) {
        throw new Error('Invalid Discord CDN URL: missing expiry');
    }
    if (isCdnUrlExpired(expiryHex)) {
        throw new Error('Discord CDN URL has expired');
    }

    const batch = adminDb.batch();

    // Update the pending image with session info
    const imageRef = adminDb.collection('pending_images').doc();
    const imageWithSession = pendingImageSchema.parse({
        ...pendingImage,
        sessionId: session.sessionId,
        pageNumber: session.receivedPages + 1,
        isPartOfMultiPage: true,
        cdnUrlExpiry: expiryHex
    });
    batch.set(imageRef, imageWithSession);

    // Update session
    const sessionRef = adminDb.collection('document_sessions').doc(session.sessionId);
    const updatedSessionData = {
        ...session,
        receivedPages: session.receivedPages + 1,
        pageOrder: [...session.pageOrder, imageRef.id],
        totalSize: newTotalSize,
        status: session.receivedPages + 1 === session.pageCount ? 'PROCESSING' : 'COLLECTING'
    };
    
    // Parse and validate session data
    const updatedSession = documentSessionSchema.parse(updatedSessionData);
    batch.update(sessionRef, updatedSession);

    await batch.commit();

    // If all pages received, start processing
    if (updatedSession.status === 'PROCESSING') {
        // Process in background
        documentProcessing.processSession(session.sessionId).catch((error: Error) => {
            console.error('Error processing document session:', {
                sessionId: session.sessionId,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
        });
    }
};

/**
 * Cancel session
 * @param sessionId ID of session to cancel
 */
export const cancelSession = async (sessionId: string): Promise<void> => {
    const update: DocumentSessionUpdate = {
        status: 'FAILED',
        error: 'Session cancelled by user'
    };

    await adminDb
        .collection('document_sessions')
        .doc(sessionId)
        .update(update);
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
    const snapshot = await adminDb
        .collection('document_sessions')
        .where('status', '==', 'COLLECTING')
        .where('expiresAt', '<=', new Date())
        .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
        const update: DocumentSessionUpdate = {
            status: 'FAILED',
            error: 'Session expired'
        };
        batch.update(doc.ref, update);
    });

    await batch.commit();
};

/**
 * Check if any CDN URLs in a session have expired
 * @param sessionId ID of session to check
 * @returns boolean indicating if any URLs have expired
 */
export const checkSessionUrlExpiry = async (sessionId: string): Promise<boolean> => {
    const imagesSnapshot = await adminDb
        .collection('pending_images')
        .where('sessionId', '==', sessionId)
        .get();

    for (const doc of imagesSnapshot.docs) {
        // Get the raw data from Firestore
        const rawData = doc.data();
        
        // Convert Firestore Timestamps to JavaScript Date objects
        const processedData = {
            ...rawData,
            createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : rawData.createdAt
        };
        
        // Parse and validate image data
        const image = pendingImageSchema.parse(processedData);
        if (image.cdnUrlExpiry && isCdnUrlExpired(image.cdnUrlExpiry)) {
            return true;
        }
    }

    return false;
};