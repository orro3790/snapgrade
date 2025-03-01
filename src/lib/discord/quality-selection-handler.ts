import { type Interaction } from '../schemas/discord-consolidated';
import { respondToInteraction } from './interactive-messages';
import { showMetadataDialog } from './metadata-handler';
import { adminDb } from '../firebase/admin';

/**
 * Handle text quality selection
 * @param interaction Discord interaction
 * @param sessionId Document session ID
 * @param textQuality Selected text quality
 */
export const handleTextQualitySelection = async (
  interaction: Interaction,
  sessionId: string,
  textQuality: string
): Promise<void> => {
  try {
    // Get user ID safely
    const userId = interaction.member?.user.id || interaction.user?.id;
    
    if (!userId) {
      console.error('Missing user ID in interaction');
      throw new Error('User ID not found in interaction');
    }
    
    // Update session with text quality
    await adminDb
      .collection('document_sessions')
      .doc(sessionId)
      .update({
        textQuality,
        updatedAt: new Date()
      });
    
    // Update session status to PROCESSING
    await adminDb
      .collection('document_sessions')
      .doc(sessionId)
      .update({
        status: 'PROCESSING',
        updatedAt: new Date()
      });
    
    // Update the interaction to show processing will begin
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: `Text quality set to: ${textQuality.replace('_', ' ')}. Document processing will begin now...`,
        components: [] // Remove components
      }
    });
    
    // Show metadata dialog for document organization
    await showMetadataDialog(interaction.channel_id, userId, sessionId);
  } catch (error) {
    console.error('Error handling text quality selection:', error);
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "An error occurred. Please try again.",
        components: [] // Remove buttons
      }
    });
  }
};