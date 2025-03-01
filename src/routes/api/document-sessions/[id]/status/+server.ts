import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/firebase/admin';
import { ensureDate } from '$lib/utils/dateUtils';

/**
 * Endpoint to check document session processing status
 * GET /api/document-sessions/:id/status
 */
export async function GET({ params, locals }: { params: { id: string }, locals: { user?: { uid: string } } }) {
  try {
    const { id } = params;
    const userId = locals.user?.uid;
    
    if (!userId) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const sessionDoc = await adminDb.collection('document_sessions').doc(id).get();
    
    if (!sessionDoc.exists) {
      return json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = sessionDoc.data();
    
    if (!sessionData) {
      return json({ success: false, error: 'Session data not found' }, { status: 404 });
    }
    
    // Process timestamps using ensureDate
    const timestampFields = ['createdAt', 'updatedAt', 'expiresAt', 'completedAt', 'processingStartedAt', 'processingCompletedAt'];
    timestampFields.forEach(field => {
      if (field in sessionData) {
        sessionData[field] = ensureDate(sessionData[field]);
      }
    });
    
    // Also convert timestamp in processing progress if it exists
    if (sessionData.processingProgress?.startedAt) {
      sessionData.processingProgress.startedAt = ensureDate(sessionData.processingProgress.startedAt);
    }
    
    // Check if the user is allowed to access this session
    // For Discord users we need to check against mappings
    let hasAccess = sessionData.userId === userId;
    
    if (!hasAccess && /^\d{17,19}$/.test(sessionData.userId)) {
      // This is a Discord ID, check if it maps to the current user
      const mappingSnapshot = await adminDb
        .collection('discord_mappings')
        .where('discordId', '==', sessionData.userId)
        .where('firebaseUid', '==', userId)
        .limit(1)
        .get();
      
      hasAccess = !mappingSnapshot.empty;
    }
    
    if (!hasAccess) {
      return json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }
    
    // Calculate human-readable information for the response
    const getStageDescription = (stage: string): string => {
      switch (stage) {
        case 'queued': return 'Preparing for processing';
        case 'ocr_processing': return 'Extracting text from images';
        case 'structure_analysis': return 'Analyzing document structure';
        case 'document_creation': return 'Creating final document';
        default: return 'Processing';
      }
    };
    
    // Format estimated time remaining as human-readable string
    const formatTimeRemaining = (ms: number | undefined): string => {
      if (!ms) return 'Calculating...';
      
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds} seconds`;
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    };
    
    // Add formatted information to progress if available
    if (sessionData.processingProgress) {
      sessionData.processingProgress.stageDescription = getStageDescription(sessionData.processingProgress.stage);
      
      if (sessionData.processingProgress.estimatedTimeRemaining) {
        sessionData.processingProgress.formattedTimeRemaining = 
          formatTimeRemaining(sessionData.processingProgress.estimatedTimeRemaining);
      }
      
      // Calculate progress percentage
      if (sessionData.processingProgress.total > 0) {
        sessionData.processingProgress.percentComplete = 
          Math.round((sessionData.processingProgress.current / sessionData.processingProgress.total) * 100);
      }
    }
    
    return json({
      success: true,
      status: sessionData.status,
      processingProgress: sessionData.processingProgress || null,
      documentId: sessionData.documentId || null,
      error: sessionData.error || null,
      updatedAt: sessionData.updatedAt,
      textQuality: sessionData.textQuality || null,
      receivedPages: sessionData.receivedPages || 0,
      totalPages: sessionData.pageCount
    });
  } catch (err) {
    console.error('Error fetching session status:', err);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
}