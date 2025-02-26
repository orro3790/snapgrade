import { adminDb } from '../firebase/admin';
import {
    type DocumentProcessResponse,
    documentProcessResponseSchema
} from '../schemas/documentProcessing';
import { type PendingImage } from '../schemas/pending-image';
import { checkSessionUrlExpiry } from './documentSession';
import * as claude from './claude';

/**
 * Process a document session
 * @param sessionId ID of session to process
 * @throws Error if session not found or processing fails
 */
export const processSession = async (sessionId: string): Promise<void> => {
    // Get session and validate it exists
    const sessionRef = adminDb.collection('document_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
        throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = sessionDoc.data();
    if (!sessionData) {
        throw new Error(`Session ${sessionId} data is empty`);
    }

    // Get all pending images for session
    const imagesSnapshot = await adminDb
        .collection('pending_images')
        .where('sessionId', '==', sessionId)
        .orderBy('pageNumber')
        .get();

    if (imagesSnapshot.empty) {
        throw new Error(`No images found for session ${sessionId}`);
    }

    // Process each image
    const batch = adminDb.batch();
    const results: DocumentProcessResponse[] = [];

    for (const doc of imagesSnapshot.docs) {
        const image = doc.data() as PendingImage;
        try {
            const result = await processImage(image, sessionData.userId);
            results.push(result);
            
            // Delete processed image
            batch.delete(doc.ref);
        } catch (error) {
            console.error('Error processing image:', error);
            batch.update(sessionRef, {
                status: 'FAILED',
                error: `Failed to process page ${image.pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            return;
        }
    }

    // Combine results
    const combinedText = results.map(r => r.text).join('\n\n');
    const combinedAnalysis = results.flatMap(r => r.structuralAnalysis);

    // Create final document
    const documentRef = adminDb.collection('documents').doc();
    batch.set(documentRef, {
        sessionId,
        userId: sessionData.userId,
        text: combinedText,
        structuralAnalysis: combinedAnalysis,
        status: 'ready_for_correction',
        createdAt: new Date()
    });

    // Update session status
    batch.update(sessionRef, {
        status: 'COMPLETED',
        documentId: documentRef.id
    });

    await batch.commit();
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

    // Convert image URL to base64
    const imageResponse = await fetch(image.imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Get bot token
    const tokenSnapshot = await adminDb
        .collection('bot_tokens')
        .where('userId', '==', userId)
        .where('expiresAt', '>', new Date())
        .limit(1)
        .get();

    if (tokenSnapshot.empty) {
        throw new Error('No valid bot token found');
    }

    const tokenData = tokenSnapshot.docs[0].data();
    if (!tokenData?.token) {
        throw new Error('Invalid bot token data');
    }

    // Call LLM Whisperer for OCR
    const llmWhispererResponse = await fetch('https://api.llmwhisperer.com/v1/ocr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LLM_WHISPERER_API_KEY}`
        },
        body: JSON.stringify({
            image: base64Image,
            botToken: tokenData.token
        })
    });

    if (!llmWhispererResponse.ok) {
        throw new Error(`LLM Whisperer error: ${llmWhispererResponse.statusText}`);
    }

    const { text } = await llmWhispererResponse.json();

    // Analyze structure with Claude
    const structuralAnalysis = await claude.analyzeStructure(text);

    // Verify text accuracy
    const verification = await claude.verifyText(text);

    // Return combined results
    const response = documentProcessResponseSchema.parse({
        success: true,
        documentId: image.sessionId ?? crypto.randomUUID(),
        text,
        alternativeText: verification.alternativeText,
        structuralAnalysis,
        status: 'processing'
    });

    return response;
};