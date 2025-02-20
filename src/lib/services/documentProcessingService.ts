import { adminDb } from '../discord/firebase';
import { DocumentSessionService } from './documentSessionService';
import { type PendingImage } from '../schemas/pending-image';
import { type DocumentSession } from '../schemas/documentSession';
import { 
    documentProcessRequestSchema,
    documentProcessResponseSchema,
    type DocumentProcessResponse,
    type StructuralAnalysis,
    type TextVerification
} from '../schemas/documentProcessing';

/**
 * Service for handling document OCR and text analysis
 */
export class DocumentProcessingService {
    private static readonly LLM_WHISPERER_ENDPOINT = process.env.LLM_WHISPERER_ENDPOINT;
    private static readonly CLAUDE_ENDPOINT = process.env.CLAUDE_ENDPOINT;

    /**
     * Process a document session's images
     */
    public static async processSession(sessionId: string): Promise<void> {
        const sessionRef = adminDb.collection('document_sessions').doc(sessionId);
        const imagesRef = adminDb.collection('pending_images').where('sessionId', '==', sessionId);

        // Get session and images
        const [sessionDoc, imagesSnapshot] = await Promise.all([
            sessionRef.get(),
            imagesRef.get()
        ]);

        if (!sessionDoc.exists) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const session = sessionDoc.data() as DocumentSession;
        if (session.status !== 'PROCESSING') {
            throw new Error(`Session ${sessionId} is not in PROCESSING state`);
        }

        const images = imagesSnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data() as PendingImage
        }));

        // Sort images by page number
        images.sort((a, b) => {
            const pageA = a.pageNumber ?? Number.MAX_SAFE_INTEGER;
            const pageB = b.pageNumber ?? Number.MAX_SAFE_INTEGER;
            return pageA - pageB;
        });

        try {
            // Process each image
            const results: DocumentProcessResponse[] = [];
            for (const image of images) {
                const result = await this.processImage(image, session.userId);
                results.push(result);
            }

            // Combine results
            const combinedResult = this.combineResults(results);

            // Store result
            await sessionRef.update({
                status: 'COMPLETED',
                result: combinedResult,
                completedAt: new Date()
            });

            // Clean up pending images
            const batch = adminDb.batch();
            for (const image of images) {
                batch.delete(adminDb.collection('pending_images').doc(image.docId));
            }
            await batch.commit();
        } catch (error) {
            console.error('Error processing document session:', error);
            await sessionRef.update({
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Process a single image
     */
    private static async processImage(
        image: PendingImage & { docId: string },
        userId: string
    ): Promise<DocumentProcessResponse> {
        // Check if CDN URL has expired
        if (!image.sessionId) {
            throw new Error('Image is not part of a session');
        }

        if (await DocumentSessionService.checkSessionUrlExpiry(image.sessionId)) {
            throw new Error('Image URL has expired');
        }

        // Download image and convert to base64
        const imageResponse = await fetch(image.imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        // Get bot token for LLM Whisperer
        const botTokenDoc = await adminDb
            .collection('bot_tokens')
            .where('userId', '==', userId)
            .where('expiresAt', '>', new Date())
            .orderBy('expiresAt', 'desc')
            .limit(1)
            .get();

        if (botTokenDoc.empty) {
            throw new Error('No valid bot token found');
        }

        const botToken = botTokenDoc.docs[0].data().token;

        if (!this.LLM_WHISPERER_ENDPOINT || !this.CLAUDE_ENDPOINT) {
            throw new Error('Missing required environment variables');
        }

        // Prepare request for LLM Whisperer
        const request = documentProcessRequestSchema.parse({
            image: base64Image,
            text: '', // Will be populated by LLM Whisperer
            uid: userId,
            botToken
        });

        // Call LLM Whisperer for OCR
        const ocrResponse = await fetch(this.LLM_WHISPERER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`
            },
            body: JSON.stringify(request)
        });

        if (!ocrResponse.ok) {
            throw new Error(`OCR failed: ${await ocrResponse.text()}`);
        }

        const ocrResult = await ocrResponse.json();

        // Call Claude for structural analysis
        const structuralAnalysis = await this.analyzeStructure(ocrResult.text);

        // Call Claude for text verification
        const textVerification = await this.verifyText(ocrResult.text);

        // Combine results
        return documentProcessResponseSchema.parse({
            success: true,
            documentId: image.docId,
            text: ocrResult.text,
            alternativeText: textVerification.alternativeText,
            structuralAnalysis,
            status: 'ready_for_correction'
        });
    }

    /**
     * Analyze text structure using Claude
     */
    private static async analyzeStructure(text: string): Promise<StructuralAnalysis> {
        if (!this.CLAUDE_ENDPOINT) {
            throw new Error('Missing CLAUDE_ENDPOINT environment variable');
        }

        const response = await fetch(this.CLAUDE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Analyze the structure of this text and identify titles, subtitles, headings, and paragraph starts. Return the results as a JSON array where each element has a "position" (character index) and "type" (one of: "title", "subtitle", "heading", "paragraphStart").

Text to analyze:
${text}`,
                model: 'claude-2',
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`Structure analysis failed: ${await response.text()}`);
        }

        const result = await response.json();
        return result.structuralAnalysis;
    }

    /**
     * Verify text accuracy using Claude
     */
    private static async verifyText(text: string): Promise<TextVerification> {
        if (!this.CLAUDE_ENDPOINT) {
            throw new Error('Missing CLAUDE_ENDPOINT environment variable');
        }

        const response = await fetch(this.CLAUDE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Review this text for potential OCR errors or discrepancies. If you find any issues, provide an alternative version and explain the discrepancies. Format your response as JSON with "hasDiscrepancies" (boolean), optional "alternativeText" (string), and optional "discrepancies" array (each with "original", "suggested", and "explanation" fields).

Text to verify:
${text}`,
                model: 'claude-2',
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`Text verification failed: ${await response.text()}`);
        }

        const result = await response.json();
        return result.verification;
    }

    /**
     * Combine results from multiple pages
     */
    private static combineResults(results: DocumentProcessResponse[]): DocumentProcessResponse {
        // Sort by document ID (which should correspond to page order)
        results.sort((a, b) => a.documentId.localeCompare(b.documentId));

        // Combine text content
        const combinedText = results.map(r => r.text).join('\n\n');
        const combinedAltText = results.every(r => r.alternativeText)
            ? results.map(r => r.alternativeText!).join('\n\n')
            : undefined;

        // Adjust structural analysis positions
        let textOffset = 0;
        const combinedAnalysis: StructuralAnalysis = [];

        for (const result of results) {
            // Add newlines between pages
            if (textOffset > 0) textOffset += 2;

            // Adjust positions for this page's structural elements
            for (const element of result.structuralAnalysis) {
                combinedAnalysis.push({
                    ...element,
                    position: element.position + textOffset
                });
            }

            // Update offset
            textOffset += result.text.length;
        }

        return documentProcessResponseSchema.parse({
            success: true,
            documentId: results[0].documentId, // Use first page's ID as base
            text: combinedText,
            alternativeText: combinedAltText,
            structuralAnalysis: combinedAnalysis,
            status: 'ready_for_correction'
        });
    }
}