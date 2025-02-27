import { adminDb } from '../firebase/admin';
import { type DocumentProcessResponse } from '../schemas/documentProcessing';
import { type PendingImage } from '../schemas/pending-image';
import { checkSessionUrlExpiry } from './documentSession';
import * as llmWhisperer from './llmWhispererService';

/**
 * Process a document session
 * @param sessionId ID of session to process
 * @throws Error if session not found or processing fails
 */
export const processSession = async (sessionId: string): Promise<void> => {
    try {
        // Use the LLM Whisperer service to process the session
        await llmWhisperer.processDocumentSession(sessionId);
    } catch (error) {
        console.error(`Error processing session ${sessionId}:`, error);
        
        // Update session with error status if needed
        const sessionRef = adminDb.collection('document_sessions').doc(sessionId);
        await sessionRef.update({
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
            processingCompletedAt: new Date()
        });
        
        throw error;
    }
};

/**
 * Process a single image
 * @param image Image to process
 * @param userId User's ID
 * @returns Processing results
 * @throws Error if processing fails
 */
export const processImage = async (
    image: PendingImage,
    userId: string
): Promise<DocumentProcessResponse> => {
    // Validate URL hasn't expired
    if (await checkSessionUrlExpiry(image.sessionId ?? '')) {
        throw new Error('Image URL has expired');
    }

    try {
        // Use the LLM Whisperer service to process the image
        return await llmWhisperer.processPendingImage(image);
    } catch (error) {
        console.error(`Error processing image for user ${userId}:`, error);
        throw error;
    }
};