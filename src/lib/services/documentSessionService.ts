import { adminDb } from '../discord/firebase';
import { documentSessionSchema, type DocumentSession, type DocumentSessionUpdate } from '../schemas/documentSession';
import { pendingImageSchema, type PendingImage, isCdnUrlExpired, extractCdnExpiry } from '../schemas/pending-image';
import { DocumentProcessingService } from './documentProcessingService';

export class DocumentSessionService {
    private static readonly SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    private static readonly MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MiB

    /**
     * Create a new document session
     */
    public static async createSession(userId: string, expectedPages: number): Promise<DocumentSession> {
        const session: DocumentSession = documentSessionSchema.parse({
            sessionId: crypto.randomUUID(),
            userId,
            status: 'COLLECTING',
            pageCount: expectedPages,
            receivedPages: 0,
            pageOrder: [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
            totalSize: 0
        });

        await adminDb.collection('document_sessions').doc(session.sessionId).set(session);
        return session;
    }

    /**
     * Get active session for user
     */
    public static async getActiveSession(userId: string): Promise<DocumentSession | null> {
        const snapshot = await adminDb
            .collection('document_sessions')
            .where('userId', '==', userId)
            .where('status', '==', 'COLLECTING')
            .where('expiresAt', '>', new Date())
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const session = documentSessionSchema.parse(snapshot.docs[0].data());
        return session;
    }

    /**
     * Add image to session with size validation
     */
    public static async addImageToSession(
        session: DocumentSession,
        pendingImage: PendingImage
    ): Promise<void> {
        // Validate total size won't exceed limit
        const newTotalSize = session.totalSize + pendingImage.size;
        if (newTotalSize > this.MAX_TOTAL_SIZE) {
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
        const updatedSession = documentSessionSchema.parse({
            ...session,
            receivedPages: session.receivedPages + 1,
            pageOrder: [...session.pageOrder, imageRef.id],
            totalSize: newTotalSize,
            status: session.receivedPages + 1 === session.pageCount ? 'PROCESSING' : 'COLLECTING'
        });
        batch.update(sessionRef, updatedSession);

        await batch.commit();

        // If all pages received, start processing
        if (updatedSession.status === 'PROCESSING') {
            // Process in background
            DocumentProcessingService.processSession(session.sessionId).catch((error: Error) => {
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
    }

    /**
     * Cancel session
     */
    public static async cancelSession(sessionId: string): Promise<void> {
        await adminDb
            .collection('document_sessions')
            .doc(sessionId)
            .update({
                status: 'FAILED',
                error: 'Session cancelled by user'
            } satisfies DocumentSessionUpdate);
    }

    /**
     * Clean up expired sessions
     */
    public static async cleanupExpiredSessions(): Promise<void> {
        const snapshot = await adminDb
            .collection('document_sessions')
            .where('status', '==', 'COLLECTING')
            .where('expiresAt', '<=', new Date())
            .get();

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'FAILED',
                error: 'Session expired'
            } satisfies DocumentSessionUpdate);
        });

        await batch.commit();
    }

    /**
     * Check if any CDN URLs in a session have expired
     */
    public static async checkSessionUrlExpiry(sessionId: string): Promise<boolean> {
        const imagesSnapshot = await adminDb
            .collection('pending_images')
            .where('sessionId', '==', sessionId)
            .get();

        for (const doc of imagesSnapshot.docs) {
            const image = pendingImageSchema.parse(doc.data());
            if (image.cdnUrlExpiry && isCdnUrlExpired(image.cdnUrlExpiry)) {
                return true;
            }
        }

        return false;
    }
}