// @ts-expect-error - Missing type definitions for llmwhisperer-client
import { LLMWhispererClientV2 } from 'llmwhisperer-client';
import { adminDb } from '../firebase/admin';
import type { DocumentSession } from '../schemas/documentSession';
import type { PendingImage } from '../schemas/pending-image';
import { DocumentStatus } from '../schemas/document';
import { documentProcessResponseSchema } from '../schemas/documentProcessing';
import {
  type WhisperOptions,
  type WhisperResult,
  type WhisperStatus
} from '../schemas/llmWhisperer';
import * as claude from './claude';

/**
 * Create a shared LLM Whisperer client instance
 */
const createWhispererClient = (): LLMWhispererClientV2 => new LLMWhispererClientV2({
  apiKey: process.env.LLM_WHISPERER_API_KEY,
  loggingLevel: 'info'
});

// Shared client instance
const whispererClient = createWhispererClient();

/**
 * Process a single image URL
 * @param imageUrl URL of the image to process
 * @param options Processing options
 * @returns Processing result or whisper hash for async processing
 */
export const processImage = async (
  imageUrl: string,
  options: Partial<WhisperOptions> = {}
): Promise<WhisperResult> => {
  try {
    console.log(`Processing image with LLM Whisperer: ${imageUrl}`);
    
    const result = await whispererClient.whisper({
      url: imageUrl,
      mode: options.mode || 'high_quality',
      outputMode: options.outputMode || 'layout_preserving',
      waitForCompletion: options.waitForCompletion || false,
      waitTimeout: 60 // 1 minute timeout before switching to async
    });
    
    return result as WhisperResult;
  } catch (error) {
    console.error('Error processing image with LLM Whisperer:', error);
    throw error;
  }
};

/**
 * Process a pending image from Firestore
 * @param image PendingImage object from Firestore
 * @returns Processed text and analysis
 */
export const processPendingImage = async (image: PendingImage) => {
  try {
    // Process with LLM Whisperer
    const whisperResult = await processImage(image.imageUrl, {
      mode: 'high_quality',
      outputMode: 'layout_preserving',
      waitForCompletion: true
    });
    
    // Extract text from result
    const extractedText = whisperResult.extraction.result_text;
    
    // Analyze structure with Claude
    const structuralAnalysis = await claude.analyzeStructure(extractedText);
    
    // Verify text accuracy
    const verification = await claude.verifyText(extractedText);
    
    // Return combined results
    return documentProcessResponseSchema.parse({
      success: true,
      documentId: image.sessionId ?? crypto.randomUUID(),
      text: extractedText,
      alternativeText: verification.alternativeText,
      structuralAnalysis,
      status: 'processing'
    });
  } catch (error) {
    console.error('Error processing pending image:', error);
    throw error;
  }
};

/**
 * Convert Firestore timestamps to JavaScript Date objects
 * @param data Object containing Firestore timestamps
 * @returns Object with converted Date objects
 */
const convertFirestoreTimestamps = <T extends Record<string, unknown>>(data: T): T => {
  const convertedData = { ...data } as T;
  
  // Convert common timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'expiresAt', 'completedAt', 'processedAt'];
  
  timestampFields.forEach(field => {
    const value = data[field as keyof T];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      (convertedData as Record<string, unknown>)[field] = value.toDate();
    }
  });
  
  return convertedData;
};

/**
 * Get session data from Firestore
 * @param sessionId Document session ID
 * @returns Session data
 */
const getSessionData = async (sessionId: string): Promise<DocumentSession> => {
  const sessionRef = adminDb.collection('document_sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();
  
  if (!sessionDoc.exists) {
    throw new Error(`Document session ${sessionId} not found`);
  }
  
  const rawData = sessionDoc.data();
  if (!rawData) {
    throw new Error(`Document session ${sessionId} data is empty`);
  }
  
  return convertFirestoreTimestamps(rawData) as DocumentSession;
};

/**
 * Get pending images for a session
 * @param sessionId Document session ID
 * @returns Array of pending images
 */
const getSessionImages = async (sessionId: string) => {
  const imagesSnapshot = await adminDb
    .collection('pending_images')
    .where('sessionId', '==', sessionId)
    .orderBy('pageNumber')
    .get();
  
  if (imagesSnapshot.empty) {
    throw new Error(`No images found for session ${sessionId}`);
  }
  
  return imagesSnapshot.docs.map((doc, index) => ({
    ref: doc.ref,
    data: convertFirestoreTimestamps(doc.data()) as PendingImage,
    index
  }));
};

/**
 * Update session status
 * @param sessionId Document session ID
 * @param status New status
 * @param additionalData Additional data to update
 */
const updateSessionStatus = async (
  sessionId: string,
  status: string,
  additionalData: Record<string, unknown> = {}
) => {
  const sessionRef = adminDb.collection('document_sessions').doc(sessionId);
  await sessionRef.update({
    status,
    updatedAt: new Date(),
    ...additionalData
  });
};

/**
 * Process a document session
 * @param sessionId Document session ID
 * @returns Processing status
 */
export const processDocumentSession = async (sessionId: string) => {
  try {
    console.log(`Processing document session: ${sessionId}`);
    
    // Get session data
    const sessionData = await getSessionData(sessionId);
    
    // Update session status to processing
    await updateSessionStatus(sessionId, 'PROCESSING', {
      processingStartedAt: new Date()
    });
    
    // Get all pending images for session
    const sessionImages = await getSessionImages(sessionId);
    
    // Process each image
    const batch = adminDb.batch();
    const imageResults = [];
    
    for (const { ref, data: imageData, index } of sessionImages) {
      try {
        // Update progress
        await updateSessionStatus(sessionId, 'PROCESSING', {
          processingProgress: {
            current: index + 1,
            total: sessionImages.length
          }
        });
        
        // Process the image
        const result = await processPendingImage(imageData);
        
        imageResults.push({
          index,
          imageUrl: imageData.imageUrl,
          result
        });
        
        // Mark image as processed
        batch.update(ref, {
          status: 'COMPLETED',
          processedAt: new Date()
        });
      } catch (error) {
        console.error(`Error processing image ${index + 1}/${sessionImages.length}:`, error);
        
        // Mark image as failed
        batch.update(ref, {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          processedAt: new Date()
        });
        
        // Update session with error
        await updateSessionStatus(sessionId, 'FAILED', {
          error: `Failed to process page ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          processingCompletedAt: new Date()
        });
        
        throw error;
      }
    }
    
    // Combine results
    const combinedText = imageResults
      .sort((a, b) => a.index - b.index)
      .map(r => r.result.text)
      .join('\n\n<<< PAGE BREAK >>>\n\n');
    
    // Get structural analysis from all images
    const structuralElements = imageResults.flatMap(r => r.result.structuralAnalysis);
    
    // Extract headings from structural analysis
    const headings = structuralElements
      .filter(el => el.type === 'heading')
      .map(el => el.position.toString());
    
    // Create document record
    const docRef = adminDb.collection('documents').doc();
    batch.set(docRef, {
      id: docRef.id,
      sessionId,
      userId: sessionData.userId,
      studentId: 'Unassigned',
      studentName: 'Unassigned Student',
      classId: 'Unassigned',
      className: 'Unassigned',
      documentName: `Document - ${new Date().toLocaleDateString()}`,
      documentBody: combinedText,
      sourceType: 'llmwhisperer',
      status: DocumentStatus.unedited,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add structural elements
      headings,
      // Add source metadata
      sourceMetadata: {
        rawOcrOutput: combinedText,
        llmProcessed: true,
        llmProcessedAt: new Date()
      }
    });
    
    // Update session status
    batch.update(adminDb.collection('document_sessions').doc(sessionId), {
      status: 'COMPLETED',
      documentId: docRef.id,
      processingCompletedAt: new Date()
    });
    
    await batch.commit();
    
    return {
      success: true,
      documentId: docRef.id
    };
  } catch (error) {
    console.error('Error processing document session:', error);
    throw error;
  }
};

/**
 * Check status of an async processing job
 * @param whisperHash Hash returned from async processing
 * @returns Current status
 */
export const checkProcessingStatus = async (whisperHash: string): Promise<WhisperStatus> => {
  try {
    return await whispererClient.whisperStatus(whisperHash) as WhisperStatus;
  } catch (error) {
    console.error('Error checking processing status:', error);
    throw error;
  }
};

/**
 * Retrieve results of an async processing job
 * @param whisperHash Hash returned from async processing
 * @returns Processing results
 */
export const retrieveProcessingResults = async (whisperHash: string): Promise<WhisperResult> => {
  try {
    return await whispererClient.whisperRetrieve(whisperHash) as WhisperResult;
  } catch (error) {
    console.error('Error retrieving processing results:', error);
    throw error;
  }
};