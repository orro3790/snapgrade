// @ts-expect-error - Missing type definitions for llmwhisperer-client
import { LLMWhispererClientV2 } from 'llmwhisperer-client';
import { adminDb } from '../firebase/admin';
import type { DocumentSession, DocumentSessionMetadata } from '../schemas/documentSession';
import type { PendingImage } from '../schemas/pending-image';
import { DocumentStatus } from '../schemas/document';
import { documentProcessResponseSchema } from '../schemas/documentProcessing';
import {
  type WhisperOptions,
  type WhisperResult,
  type WhisperStatus
} from '../schemas/llmWhisperer';
import * as claude from './claude';
import { processTextWithAnalysis } from './nodeParsingService';

/**
 * Create a shared LLM Whisperer client instance
 */
const createWhispererClient = (): LLMWhispererClientV2 => new LLMWhispererClientV2({
  // apiKey: process.env.LLM_WHISPERER_API_KEY,
  apiKey:"ux559xMlqFczRK6PZVOoC1IM1VBFOxfX3W_fg_s0iB4",
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
    const startTime = Date.now();
    console.log(`[PERF] Starting LLM Whisperer processing for image: ${imageUrl}`);
    
    // Always use high_quality mode which supports both printed and handwritten text
    const mode = 'high_quality';
    
    const result = await whispererClient.whisper({
      url: imageUrl,
      mode: options.mode || mode,
      outputMode: options.outputMode || 'text',
      waitForCompletion: options.waitForCompletion || false,
      waitTimeout: 60, // 1 minute timeout before switching to async
      includeConfidence: true, // Request confidence metadata
      includeOriginalImage: true // Include original image URL in response
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`[PERF] LLM Whisperer processing completed in ${processingTime}ms`);
    
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
    const totalStartTime = Date.now();
    console.log(`[PERF] Starting processing for pending image: ${image.discordMessageId}`);
    
    // Process with LLM Whisperer
    const ocrStartTime = Date.now();
    console.log(`[PERF] Starting OCR processing`);
    const whisperResult = await processImage(
      image.imageUrl,
      {
        outputMode: 'text',
        waitForCompletion: true
      }
    );
    const ocrTime = Date.now() - ocrStartTime;
    console.log(`[PERF] OCR processing completed in ${ocrTime}ms`);
    
    // Extract text from result
    const extractedText = whisperResult.extraction.result_text;
    console.log(`[PERF] Extracted ${extractedText.length} characters of text`);
    
    // Extract confidence metadata for low-confidence words
    const metadataStartTime = Date.now();
    console.log(`[PERF] Starting confidence metadata processing`);
    const confidenceMetadata = whisperResult.confidence_metadata || [];
    const lowConfidenceWords: Array<{text: string, confidence: string, lineIndex: number}> = [];
    
    // Process confidence metadata to identify low-confidence words
    if (Array.isArray(confidenceMetadata)) {
      confidenceMetadata.forEach((line, lineIndex) => {
        if (Array.isArray(line)) {
          line.forEach(wordData => {
            if (wordData.confidence && parseFloat(wordData.confidence) < 0.8) {
              lowConfidenceWords.push({
                text: wordData.text || '',
                confidence: wordData.confidence || '0',
                lineIndex: lineIndex
              });
            }
          });
        }
      });
    }
    
    const metadataTime = Date.now() - metadataStartTime;
    console.log(`[PERF] Found ${lowConfidenceWords.length} low confidence words in ${metadataTime}ms`);
    
    // Analyze structure with Claude and get compressed nodes
    const claudeStartTime = Date.now();
    console.log(`[PERF] Starting Claude structural analysis`);
    // Pass the original image URL and low confidence words to Claude
    const { structuralAnalysis, compressedNodes } = await claude.analyzeStructure(
      extractedText,
      image.imageUrl,
      lowConfidenceWords.length > 0 ? lowConfidenceWords : undefined
    );
    const claudeTime = Date.now() - claudeStartTime;
    console.log(`[PERF] Claude structural analysis completed in ${claudeTime}ms`);
    
    // If Claude didn't provide compressed nodes, generate them ourselves
    const nodesStartTime = Date.now();
    console.log(`[PERF] Starting node processing`);
    const finalCompressedNodes = compressedNodes ||
      processTextWithAnalysis(extractedText, structuralAnalysis).serialized;
    const nodesTime = Date.now() - nodesStartTime;
    console.log(`[PERF] Node processing completed in ${nodesTime}ms`);
    
    // Verify text accuracy with fallback
    const verifyStartTime = Date.now();
    console.log(`[PERF] Starting text verification`);
    let verification;
    try {
      verification = await claude.verifyText(extractedText);
    } catch (error) {
      console.warn('Text verification failed, using fallback:', error);
      // Use a fallback verification object if Claude verification fails
      verification = {
        hasDiscrepancies: false,
        discrepancies: [],
        alternativeText: extractedText
      };
    }
    const verifyTime = Date.now() - verifyStartTime;
    console.log(`[PERF] Text verification completed in ${verifyTime}ms`);
    
    const totalTime = Date.now() - totalStartTime;
    console.log(`[PERF] Total processing time: ${totalTime}ms`);
    console.log(`[PERF] Breakdown - OCR: ${ocrTime}ms (${Math.round(ocrTime/totalTime*100)}%), ` +
                `Metadata: ${metadataTime}ms (${Math.round(metadataTime/totalTime*100)}%), ` +
                `Claude: ${claudeTime}ms (${Math.round(claudeTime/totalTime*100)}%), ` +
                `Nodes: ${nodesTime}ms (${Math.round(nodesTime/totalTime*100)}%), ` +
                `Verify: ${verifyTime}ms (${Math.round(verifyTime/totalTime*100)}%)`);
    
    // Return combined results
    return documentProcessResponseSchema.parse({
      success: true,
      documentId: image.sessionId ?? crypto.randomUUID(),
      text: extractedText,
      alternativeText: verification.alternativeText,
      structuralAnalysis,
      compressedNodes: finalCompressedNodes,
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
 * Calculate estimated time remaining based on processing history
 * @param processingTimes Array of previous processing times in milliseconds
 * @param remainingItems Number of items remaining to process
 * @returns Estimated time remaining in milliseconds
 */
const calculateEstimatedTimeRemaining = (
  processingTimes: number[],
  remainingItems: number
): number => {
  if (processingTimes.length === 0 || remainingItems <= 0) {
    return 0;
  }
  
  // Calculate average processing time
  const sum = processingTimes.reduce((acc, time) => acc + time, 0);
  const average = sum / processingTimes.length;
  
  // Return estimated time for remaining items
  return Math.round(average * remainingItems);
};

/**
 * Process a document session
 * @param sessionId Document session ID
 * @returns Processing status
 */
export const processDocumentSession = async (sessionId: string) => {
  try {
    const totalStartTime = Date.now();
    console.log(`[PERF] Starting document session processing: ${sessionId}`);
    
    // Get session data
    const sessionStartTime = Date.now();
    console.log(`[PERF] Fetching session data`);
    const sessionData = await getSessionData(sessionId);
    const sessionTime = Date.now() - sessionStartTime;
    console.log(`[PERF] Session data fetched in ${sessionTime}ms`);
    
    const processingStartTime = new Date();
    
    // Initialize processing progress in QUEUED stage
    const updateStartTime = Date.now();
    console.log(`[PERF] Updating session status to PROCESSING`);
    await updateSessionStatus(sessionId, 'PROCESSING', {
      processingStartedAt: processingStartTime,
      processingProgress: {
        current: 0,
        total: sessionData.receivedPages,
        stage: 'queued',
        startedAt: processingStartTime,
        pageProcessingTimes: []
      }
    });
    const updateTime = Date.now() - updateStartTime;
    console.log(`[PERF] Session status updated in ${updateTime}ms`);
    
    // Get all pending images for session
    const imagesStartTime = Date.now();
    console.log(`[PERF] Fetching session images`);
    const sessionImages = await getSessionImages(sessionId);
    const imagesTime = Date.now() - imagesStartTime;
    console.log(`[PERF] Fetched ${sessionImages.length} images in ${imagesTime}ms`);
    
    // Process each image
    const batch = adminDb.batch();
    const imageResults = [];
    const pageProcessingTimes: number[] = [];
    
    for (const { ref, data: imageData, index } of sessionImages) {
      try {
        const pageStartTime = Date.now();
        
        // Update progress to OCR_PROCESSING stage
        const estimatedTimeRemaining = calculateEstimatedTimeRemaining(
          pageProcessingTimes,
          sessionImages.length - index
        );
        
        await updateSessionStatus(sessionId, 'PROCESSING', {
          processingProgress: {
            current: index + 1,
            total: sessionImages.length,
            stage: 'ocr_processing',
            startedAt: processingStartTime,
            estimatedTimeRemaining,
            pageProcessingTimes
          }
        });
        
        // Process the image
        const result = await processPendingImage(imageData);
        
        // Record processing time for this page
        const pageProcessingTime = Date.now() - pageStartTime;
        pageProcessingTimes.push(pageProcessingTime);
        
        imageResults.push({
          index,
          imageUrl: imageData.imageUrl,
          result
        });
        
        // Mark image as processed
        batch.update(ref, {
          status: 'COMPLETED',
          processedAt: new Date(),
          processingTimeMs: pageProcessingTime
        });
        
        // Update progress to show completion of this page
        await updateSessionStatus(sessionId, 'PROCESSING', {
          processingProgress: {
            current: index + 1,
            total: sessionImages.length,
            stage: 'ocr_processing',
            startedAt: processingStartTime,
            estimatedTimeRemaining: calculateEstimatedTimeRemaining(
              pageProcessingTimes,
              sessionImages.length - (index + 1)
            ),
            pageProcessingTimes
          }
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
    
    // Update progress to STRUCTURE_ANALYSIS stage
    await updateSessionStatus(sessionId, 'PROCESSING', {
      processingProgress: {
        current: sessionImages.length,
        total: sessionImages.length,
        stage: 'structure_analysis',
        startedAt: processingStartTime,
        estimatedTimeRemaining: 10000, // Estimate 10 seconds for structure analysis
        pageProcessingTimes
      }
    });
    
    // Update progress to DOCUMENT_CREATION stage
    await updateSessionStatus(sessionId, 'PROCESSING', {
      processingProgress: {
        current: sessionImages.length,
        total: sessionImages.length,
        stage: 'document_creation',
        startedAt: processingStartTime,
        estimatedTimeRemaining: 5000, // Estimate 5 seconds for document creation
        pageProcessingTimes
      }
    });
    
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
    
    // Get compressed nodes from the first image result (if available)
    // In the future, we may want to combine nodes from multiple images
    const compressedNodes = imageResults.length > 0 && 'compressedNodes' in imageResults[0].result
      ? imageResults[0].result.compressedNodes
      : undefined;
    
    // Get metadata from session if available
    let studentId = 'Unassigned';
    let studentName = 'Unassigned Student';
    let classId = 'Unassigned';
    let className = 'Unassigned';
    
    // Check if session data contains metadata (added by handleStudentSelection)
    console.log('Session data:', JSON.stringify(sessionData, null, 2));
    
    const sessionMetadata = sessionData.metadata as DocumentSessionMetadata | undefined;
    console.log('Session metadata:', sessionMetadata ? JSON.stringify(sessionMetadata, null, 2) : 'undefined');
    
    // Check if session has metadata with class and student info
    if (sessionMetadata && sessionMetadata.classId && sessionMetadata.studentId) {
        console.log('Found valid metadata in session:', JSON.stringify(sessionMetadata, null, 2));
      
      // Use metadata from session
      classId = sessionMetadata.classId;
      studentId = sessionMetadata.studentId;
      
      // Retrieve class and student names
      try {
        const classDoc = await adminDb.collection('classes').doc(classId).get();
        if (classDoc.exists) {
          className = classDoc.data()?.name || 'Unassigned';
        }
        
        const studentDoc = await adminDb.collection('students').doc(studentId).get();
        if (studentDoc.exists) {
          studentName = studentDoc.data()?.name || 'Unassigned Student';
        }
      } catch (error) {
        console.error('Error retrieving class or student info:', error);
      }
    } else {
      // No metadata or incomplete metadata - ensure Unassigned class/student exist
      console.log('No class/student metadata found in session. Using Unassigned.');
      
      // Use fixed IDs for consistency
      const unassignedClassId = 'Unassigned';
      const unassignedStudentId = 'Unassigned';
      
      try {
        // Check if Unassigned class exists
        const unassignedClassRef = adminDb.collection('classes').doc(unassignedClassId);
        const unassignedClassDoc = await unassignedClassRef.get();
        
        if (!unassignedClassDoc.exists) {
          // Create Unassigned class if it doesn't exist
          await unassignedClassRef.set({
            id: unassignedClassId,
            name: 'Unassigned',
            description: 'Default class for unassigned documents',
            status: 'active',
            students: [unassignedStudentId],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('Created Unassigned class in Firestore');
        }
        
        // Check if Unassigned student exists
        const unassignedStudentRef = adminDb.collection('students').doc(unassignedStudentId);
        const unassignedStudentDoc = await unassignedStudentRef.get();
        
        if (!unassignedStudentDoc.exists) {
          // Create Unassigned student if it doesn't exist
          await unassignedStudentRef.set({
            id: unassignedStudentId,
            name: 'Unassigned Student',
            classId: unassignedClassId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('Created Unassigned student in Firestore');
        }
      } catch (error) {
        console.error('Error ensuring Unassigned class/student exist:', error);
      }
    }
    
    console.log('Using document metadata:', {
      classId,
      className,
      studentId,
      studentName
    });
    
    // Map Discord userId to Firebase UID if possible
    // Discord user IDs are typically numeric with 17-19 digits
    let userId = sessionData.userId;
    let discordId = null;
    
    if (/^\d{17,19}$/.test(userId)) {
      console.log(`Detected Discord ID: ${userId}, attempting to map to Firebase UID`);
      discordId = userId; // Store the original Discord ID
      
      try {
        // Find the mapping from Discord ID to Firebase UID
        const mappingSnapshot = await adminDb
          .collection('discord_mappings')
          .where('discordId', '==', userId)
          .limit(1)
          .get();
          
        if (!mappingSnapshot.empty) {
          // Found a mapping, use the Firebase UID
          const firebaseUid = mappingSnapshot.docs[0].data().firebaseUid;
          console.log(`Successfully mapped Discord ID ${userId} to Firebase UID ${firebaseUid}`);
          userId = firebaseUid;
        } else {
          console.warn(`No Firebase mapping found for Discord user: ${userId}`);
          // Keep the Discord ID as userId so the document still exists
        }
      } catch (error) {
        console.error('Error mapping Discord ID to Firebase UID:', error);
      }
    }
    
    // Create document record
    const docRef = adminDb.collection('documents').doc();
    batch.set(docRef, {
      id: docRef.id,
      sessionId,
      userId: userId, // Now using Firebase UID if available
      discordId: discordId, // Store original Discord ID for reference
      studentId,
      studentName,
      classId,
      className,
      documentName: `Document - ${new Date().toLocaleDateString()}`,
      documentBody: combinedText,
      sourceType: 'llmwhisperer',
      status: DocumentStatus.unedited,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add structural elements
      headings,
      // Add compressed nodes for TextEditor if available
      ...(compressedNodes && { compressedNodes }),
      // Add source metadata
      sourceMetadata: {
        rawOcrOutput: combinedText,
        llmProcessed: true,
        llmProcessedAt: new Date()
      }
    });
    
    // Calculate total processing time
    const totalProcessingTime = Date.now() - processingStartTime.getTime();
    
    // Update session status
    batch.update(adminDb.collection('document_sessions').doc(sessionId), {
      status: 'COMPLETED',
      documentId: docRef.id,
      processingCompletedAt: new Date(),
      processingProgress: {
        current: sessionImages.length,
        total: sessionImages.length,
        stage: 'document_creation',
        startedAt: processingStartTime,
        estimatedTimeRemaining: 0,
        pageProcessingTimes
      },
      totalProcessingTimeMs: totalProcessingTime
    });
    
    const batchStartTime = Date.now();
    console.log(`[PERF] Committing batch updates to Firestore`);
    await batch.commit();
    const batchTime = Date.now() - batchStartTime;
    console.log(`[PERF] Batch updates committed in ${batchTime}ms`);
    
    const totalTime = Date.now() - totalStartTime;
    console.log(`[PERF] Total document session processing time: ${totalTime}ms`);
    console.log(`[PERF] Session processing breakdown:
      - Session data fetch: ${sessionTime}ms (${Math.round(sessionTime/totalTime*100)}%)
      - Status updates: ${updateTime}ms (${Math.round(updateTime/totalTime*100)}%)
      - Image fetching: ${imagesTime}ms (${Math.round(imagesTime/totalTime*100)}%)
      - OCR & Claude processing: ${totalProcessingTime}ms (${Math.round(totalProcessingTime/totalTime*100)}%)
      - Batch commit: ${batchTime}ms (${Math.round(batchTime/totalTime*100)}%)
    `);
    
    return {
      success: true,
      documentId: docRef.id,
      processingTimeMs: totalProcessingTime
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