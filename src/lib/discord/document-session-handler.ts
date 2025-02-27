import { adminDb } from '../firebase/admin';
import {
    createSession,
    getActiveSession,
    addImageToSession,
    checkSessionUrlExpiry
} from '../services/documentSession';
import { type PendingImage, extractCdnExpiry } from '../schemas/pending-image';
import { SUPPORTED_IMAGE_TYPES, type DocumentSession } from '../schemas/documentSession';
import { sendInteractiveMessage } from './interactive-messages';
import { ComponentType, ButtonStyle } from '../schemas/discord-consolidated';
import * as llmWhisperer from '../services/llmWhispererService';

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
        
        if (!activeSession) {
            // No active session, ask if user wants to create a document from these images
            await sendInteractiveMessage(
                channelId,
                "I've received your image(s). Would you like to create a document for processing?",
                [
                    {
                        type: ComponentType.Button,
                        custom_id: `start_doc_${attachments.length}`,
                        label: "Create Document",
                        style: ButtonStyle.Primary
                    }
                ]
            );
            return;
        }
        
        // Process images in order (sort by filename)
        const sortedAttachments = [...attachments].sort((a, b) => 
            a.filename.localeCompare(b.filename)
        );
        
        // Add each image to the session
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
                sessionId: activeSession.sessionId,
                pageNumber: activeSession.receivedPages + index + 1,
                isPartOfMultiPage: true,
                cdnUrlExpiry: extractCdnExpiry(attachment.url)
            };

            await addImageToSession(activeSession, pendingImage);
        }
        
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
        
        // Update session status to PROCESSING
        await adminDb
            .collection('document_sessions')
            .doc(session.sessionId)
            .update({
                status: 'PROCESSING',
                updatedAt: new Date()
            });
        
        await sendInteractiveMessage(
            channelId,
            "Your document is being processed. You will be notified when it's ready.",
            []
        );
        
        // Start processing in the background using LLM Whisperer service
        llmWhisperer.processDocumentSession(session.sessionId)
            .then(result => {
                // Notify user when processing is complete
                sendInteractiveMessage(
                    channelId,
                    `Your document has been processed and is ready for review! Document ID: ${result.documentId}`,
                    [
                        {
                            type: ComponentType.Button,
                            custom_id: `view_doc_${result.documentId}`,
                            label: "View Document",
                            style: ButtonStyle.Primary
                        }
                    ]
                ).catch(err => console.error('Error sending completion message:', err));
            })
            .catch(error => {
                console.error(`Error processing session ${session.sessionId}:`, error);
                // Notify user of failure
                sendInteractiveMessage(
                    channelId,
                    "There was an error processing your document. Please try again.",
                    []
                ).catch(err => console.error('Error sending failure message:', err));
            });
        
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