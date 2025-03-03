import { adminDb } from '../firebase/admin';
import {
    createSession,
    getActiveSession,
    checkSessionUrlExpiry
} from '../services/documentSession';
import { type PendingImage, extractCdnExpiry } from '../schemas/pending-image';
import { SUPPORTED_IMAGE_TYPES, type DocumentSession } from '../schemas/documentSession';
import { sendInteractiveMessage } from './interactive-messages';
import { ComponentType, ButtonStyle } from '../schemas/discord-consolidated';

// Maximum number of pages allowed per document
const MAX_PAGES = 10;

/**
 * Handle image uploads and manage document sessions
 * @param channelId Discord channel ID
 * @param userId User's Discord ID
 * @param attachments Array of image attachments
 */
export const handleImageUpload = async (
    channelId: string,
    userId: string,
    attachments: Array<{
        id: string;
        url: string;
        filename: string;
        contentType?: string;
        size: number;
    }>
): Promise<void> => {
    try {
        // Check for active session
        const activeSession = await getActiveSession(userId);
        
        // Process images in order (sort by filename)
        const sortedAttachments = [...attachments].sort((a, b) =>
            a.filename.localeCompare(b.filename)
        );

        // Check if upload would exceed the maximum page limit
        const currentPageCount = activeSession ? activeSession.receivedPages : 0;
        const newTotalPageCount = currentPageCount + sortedAttachments.length;
        
        if (newTotalPageCount > MAX_PAGES) {
            await sendInteractiveMessage(
                channelId,
                `This upload would exceed the maximum limit of ${MAX_PAGES} pages per document. ` +
                `You currently have ${currentPageCount} pages and are trying to add ${sortedAttachments.length} more. ` +
                `Please reduce the number of pages and try again.`,
                []
            );
            console.log(`[PERF] Upload rejected: would exceed ${MAX_PAGES} page limit. ` +
                        `Current: ${currentPageCount}, Attempted to add: ${sortedAttachments.length}`);
            return;
        }
        
        // Create a temporary session ID if no active session
        const tempSessionId = activeSession ?
            activeSession.sessionId :
            `temp_${userId}_${Date.now()}`;
        
        // Add each image to Firestore
        const batch = adminDb.batch();
        const pendingImageRefs: FirebaseFirestore.DocumentReference[] = [];
        
        for (const [index, attachment] of sortedAttachments.entries()) {
            console.log('Processing image:', {
                index,
                id: attachment.id,
                filename: attachment.filename
            });

            // Validate content type
            if (!attachment.contentType || !SUPPORTED_IMAGE_TYPES.includes(
                attachment.contentType as typeof SUPPORTED_IMAGE_TYPES[number]
            )) {
                console.warn(`Unsupported content type: ${attachment.contentType}`);
                continue;
            }

            const pendingImage: PendingImage = {
                discordMessageId: attachment.id,
                channelId,
                userId,
                imageUrl: attachment.url,
                filename: attachment.filename,
                contentType: attachment.contentType as typeof SUPPORTED_IMAGE_TYPES[number],
                size: attachment.size,
                status: 'PENDING',
                createdAt: new Date(),
                sessionId: tempSessionId,
                pageNumber: activeSession ?
                    (activeSession.receivedPages + index + 1) :
                    (index + 1),
                isPartOfMultiPage: sortedAttachments.length > 1 || !!(activeSession && activeSession.receivedPages > 0),
                cdnUrlExpiry: extractCdnExpiry(attachment.url),
                isOrphaned: !activeSession // Mark as orphaned if no active session
            };

            // Create a new document reference
            const imageRef = adminDb.collection('pending_images').doc();
            batch.set(imageRef, pendingImage);
            pendingImageRefs.push(imageRef);
        }
        
        // Commit the batch
        await batch.commit();
        
        if (activeSession) {
            // Update existing session with new images
            await adminDb
                .collection('document_sessions')
                .doc(activeSession.sessionId)
                .update({
                    receivedPages: activeSession.receivedPages + sortedAttachments.length,
                    pageOrder: [...activeSession.pageOrder, ...pendingImageRefs.map(ref => ref.id)],
                    updatedAt: new Date()
                });
            
            // Send confirmation with quick actions
            const newTotal = activeSession.receivedPages + sortedAttachments.length;
            await sendInteractiveMessage(
                channelId,
                `Added ${sortedAttachments.length} image(s) to document (${newTotal} total). Is this document complete?`,
                [
                    {
                        type: ComponentType.Button,
                        custom_id: "end_upload",
                        label: "Yes, Process Document",
                        style: ButtonStyle.Success
                    },
                    {
                        type: ComponentType.Button,
                        custom_id: "continue_upload",
                        label: "No, More Pages Coming",
                        style: ButtonStyle.Secondary
                    }
                ]
            );
        } else {
            // No active session, ask if user wants to create a document
            await sendInteractiveMessage(
                channelId,
                "I've received your image(s). Would you like to create a document for processing?",
                [
                    {
                        type: ComponentType.Button,
                        custom_id: `start_doc_${tempSessionId}`,
                        label: "Create Document",
                        style: ButtonStyle.Primary
                    }
                ]
            );
        }
    } catch (error) {
        console.error('Error handling image upload:', error);
        await sendInteractiveMessage(
            channelId,
            "Sorry, there was an error processing your images. Please try again later.",
            []
        );
    }
};

/**
 * Start a new document session
 * @param channelId Discord channel ID
 * @param userId User's Discord ID
 * @param pageCount Expected number of pages
 * @returns The created session
 */
export const startDocumentSession = async (
    channelId: string,
    userId: string,
    pageCount: number
): Promise<DocumentSession> => {
    try {
        // Create a new session
        const session = await createSession(userId, pageCount);
        return session;
    } catch (error) {
        console.error('Error starting document session:', error);
        await sendInteractiveMessage(
            channelId,
            "Failed to start document session. Please try again.",
            []
        );
        throw error;
    }
};

/**
 * End the current document session and start processing
 * @param channelId Discord channel ID
 * @param userId User's Discord ID
 * @returns The session ID if successful, null otherwise
 */
export const endDocumentSession = async (
    channelId: string,
    userId: string
): Promise<string | null> => {
    try {
        // Get active session
        const session = await getActiveSession(userId);
        
        if (!session) {
            await sendInteractiveMessage(
                channelId,
                "You don't have an active document session.",
                []
            );
            return null;
        }
        
        // Check if any CDN URLs have expired
        const hasExpiredUrls = await checkSessionUrlExpiry(session.sessionId);
        if (hasExpiredUrls) {
            await sendInteractiveMessage(
                channelId,
                "Some of your images have expired. Please start a new session and upload the images again.",
                []
            );
            
            // Mark session as failed
            await adminDb
                .collection('document_sessions')
                .doc(session.sessionId)
                .update({
                    status: 'FAILED',
                    error: 'Discord CDN URLs expired'
                });
                
            return null;
        }
        
        // Skip the confirmation prompt and directly proceed to metadata dialog
        // The metadata dialog will be shown by the caller (handleEndUpload in interaction-handler.ts)
        console.log(`Proceeding directly to metadata dialog for session ${session.sessionId}`);
        
        // Note: Processing will start after metadata selection in metadata-handler.ts
        
        return session.sessionId;
    } catch (error) {
        console.error('Error ending document session:', error);
        await sendInteractiveMessage(
            channelId,
            "Failed to process document. Please try again.",
            []
        );
        return null;
    }
};

/**
 * Cleanup job for orphaned images that were never associated with a session
 * Finds and deletes orphaned images older than 24 hours
 */
export const cleanupOrphanedImages = async (): Promise<void> => {
    try {
        // Find orphaned images older than 24 hours
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        
        console.log(`Cleaning up orphaned images older than ${cutoffTime.toISOString()}`);
        
        const orphanedImagesSnapshot = await adminDb
            .collection('pending_images')
            .where('isOrphaned', '==', true)
            .where('createdAt', '<', cutoffTime)
            .get();
        
        if (orphanedImagesSnapshot.empty) {
            console.log('No orphaned images to clean up');
            return;
        }
        
        console.log(`Found ${orphanedImagesSnapshot.size} orphaned images to clean up`);
        
        const batch = adminDb.batch();
        orphanedImagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('Orphaned images cleanup completed successfully');
    } catch (error) {
        console.error('Error cleaning up orphaned images:', error);
    }
};

/**
 * Update session timeout
 * @param sessionId Session ID to update
 * @param additionalTime Additional time in milliseconds (default: 10 minutes)
 */
export const extendSessionTimeout = async (
    sessionId: string,
    additionalTime: number = 10 * 60 * 1000
): Promise<void> => {
    try {
        const sessionRef = adminDb.collection('document_sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        
        if (!sessionDoc.exists) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        const newExpiryTime = new Date(Date.now() + additionalTime);
        
        await sessionRef.update({
            expiresAt: newExpiryTime,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error extending session timeout:', error);
        throw error;
    }
};