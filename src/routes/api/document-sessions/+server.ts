import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/firebase/admin';
import { ensureDate } from '$lib/utils/dateUtils';

/**
 * Endpoint to fetch all document sessions for a user
 * GET /api/document-sessions
 */
export async function GET({ locals }: { locals: { user?: { uid: string } } }) {
  try {
    const userId = locals.user?.uid;
    
    if (!userId) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find Discord mapping if it exists
    let discordId: string | null = null;
    
    try {
      const mappingSnapshot = await adminDb
        .collection('discord_mappings')
        .where('firebaseUid', '==', userId)
        .limit(1)
        .get();
        
      if (!mappingSnapshot.empty) {
        discordId = mappingSnapshot.docs[0].data().discordId;
      }
    } catch (err) {
      console.error('Error fetching Discord mapping:', err);
    }
    
    // Query sessions by either Firebase UID or Discord ID
    const userQueries = [userId];
    if (discordId) userQueries.push(discordId);
    
    // Use Firestore's in query to find sessions for either ID
    const sessionsSnapshot = await adminDb
      .collection('document_sessions')
      .where('userId', 'in', userQueries)
      .orderBy('createdAt', 'desc')
      .limit(50) // Reasonable limit for recent documents
      .get();
    
    const sessions = [];
    
    // Process each session
    for (const doc of sessionsSnapshot.docs) {
      const sessionData = doc.data();
      
      // Convert timestamps to dates
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
      
      // Add human-readable info
      if (sessionData.processingProgress) {
        const stage = sessionData.processingProgress.stage;
        
        // Add stage description
        sessionData.processingProgress.stageDescription = (() => {
          switch (stage) {
            case 'queued': return 'Preparing for processing';
            case 'ocr_processing': return 'Extracting text from images';
            case 'structure_analysis': return 'Analyzing document structure';
            case 'document_creation': return 'Creating final document';
            default: return 'Processing';
          }
        })();
        
        // Calculate progress percentage
        if (sessionData.processingProgress.total > 0) {
          sessionData.processingProgress.percentComplete = 
            Math.round((sessionData.processingProgress.current / sessionData.processingProgress.total) * 100);
        }
        
        // Format time
        if (sessionData.processingProgress.estimatedTimeRemaining) {
          const ms = sessionData.processingProgress.estimatedTimeRemaining;
          const seconds = Math.floor(ms / 1000);
          
          sessionData.processingProgress.formattedTimeRemaining = seconds < 60
            ? `${seconds} seconds`
            : `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
        }
      }
      
      // Add to result array
      sessions.push({
        id: doc.id,
        ...sessionData
      });
    }
    
    return json({
      success: true,
      sessions
    });
  } catch (err) {
    console.error('Error fetching document sessions:', err);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
}