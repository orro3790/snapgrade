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
    const startTime = Date.now();
    console.log(`[PERF] Starting document session processing: ${sessionId}`);
    
    try {
        // Use the LLM Whisperer service to process the session
        await llmWhisperer.processDocumentSession(sessionId);
        
        const totalTime = Date.now() - startTime;
        console.log(`[PERF] Document session processing completed in ${totalTime}ms`);
    } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error(`[PERF] Error processing session ${sessionId} after ${errorTime}ms:`, error);
        
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
    const startTime = Date.now();
    console.log(`[PERF] Starting single image processing for user ${userId}: ${image.discordMessageId}`);
    
    // Validate URL hasn't expired
    const urlCheckStartTime = Date.now();
    console.log(`[PERF] Checking if URL has expired`);
    if (await checkSessionUrlExpiry(image.sessionId ?? '')) {
        throw new Error('Image URL has expired');
    }
    const urlCheckTime = Date.now() - urlCheckStartTime;
    console.log(`[PERF] URL expiry check completed in ${urlCheckTime}ms`);

    try {
        // Use the LLM Whisperer service to process the image
        const result = await llmWhisperer.processPendingImage(image);
        
        const totalTime = Date.now() - startTime;
        console.log(`[PERF] Single image processing completed in ${totalTime}ms`);
        
        return result;
    } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error(`[PERF] Error processing image for user ${userId} after ${errorTime}ms:`, error);
        throw error;
    }
};