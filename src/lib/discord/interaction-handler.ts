import { ButtonStyle, ComponentType, type Interaction, type AuthResult } from '../schemas/discord-consolidated';
import {
    respondToInteraction,
    sendInteractiveMessage
} from './interactive-messages';
import {
    startDocumentSession,
    endDocumentSession,
    extendSessionTimeout
} from './document-session-handler';
import {
    handleClassSelection as metadataHandleClassSelection,
    handleStudentSelection as metadataHandleStudentSelection
} from './metadata-handler';
import { getActiveSession } from '../services/documentSession';
import { adminDb } from '../firebase/admin';
import { ensureDate } from '../utils/dateUtils';

/**
 * Verify user authentication status from Discord ID
 * @param discordId Discord user ID to check
 * @returns Authentication result with status
 */
const verifyUserAuth = async (discordId: string): Promise<AuthResult> => {
    if (!discordId) {
        return {
            authenticated: false,
            error: 'Missing Discord user ID'
        };
    }

    try {
        // Query the discord_mappings collection to find the user
        const mappingSnapshot = await adminDb
            .collection('discord_mappings')
            .where('discordId', '==', discordId)
            .limit(1)
            .get();

        if (mappingSnapshot.empty) {
            return {
                authenticated: false,
                error: 'Discord account not linked to Snapgrade'
            };
        }

        // Get the raw mapping data directly
        const rawData = mappingSnapshot.docs[0].data();
        
        // Extract the status and firebaseUid directly from the raw data
        const status = rawData.status as 'active' | 'inactive' | 'suspended';
        const firebaseUid = rawData.firebaseUid as string;

        // Check if the user's status is active
        if (status !== 'active') {
            return {
                authenticated: false,
                status: status,
                firebaseUid: firebaseUid,
                error: `Account status is ${status}`
            };
        }

        // Update the lastUsed timestamp
        await mappingSnapshot.docs[0].ref.update({
            lastUsed: new Date()
        });

        return {
            authenticated: true,
            status: 'active',
            firebaseUid: firebaseUid
        };
    } catch (error) {
        console.error('Error verifying Discord user auth:', error);
        return {
            authenticated: false,
            error: 'Authentication verification failed'
        };
    }
};

/**
 * Handle Discord interactions (button clicks, slash commands, etc.)
 * @param interaction Discord interaction
 */
export const handleInteraction = async (interaction: Interaction): Promise<void> => {
    try {
        console.log('Handling interaction:', {
            id: interaction.id,
            type: interaction.type,
            data: interaction.data ? {
                custom_id: interaction.data.custom_id,
                component_type: interaction.data.component_type
            } : 'No data'
        });
        
        // Get the user ID from the interaction
        const userId = interaction.member?.user.id || interaction.user?.id;
        
        if (!userId) {
            console.error('Missing user ID in interaction');
            await respondToInteraction(interaction, {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    content: "Sorry, we couldn't identify your Discord account."
                }
            });
            return;
        }
        
        // Verify user authentication before proceeding
        const authResult = await verifyUserAuth(userId);
        
        if (!authResult.authenticated) {
            console.warn(`Unauthorized Discord interaction attempt: ${authResult.error}`, {
                userId,
                interactionId: interaction.id,
                status: authResult.status
            });
            
            let errorMessage = "Sorry, you need to link your Discord account to Snapgrade to use this feature.";
            
            if (authResult.status) {
                if (authResult.status === 'inactive') {
                    errorMessage = "Your Snapgrade account is inactive. Please log in to reactivate your account.";
                } else if (authResult.status === 'suspended') {
                    errorMessage = "Your Snapgrade account has been suspended. Please contact support for assistance.";
                }
            }
            
            await respondToInteraction(interaction, {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    content: errorMessage
                }
            });
            return;
        }
        
        // User is authenticated, proceed with handling the interaction
        console.log(`Authenticated user ${userId} with Firebase UID ${authResult.firebaseUid}`);
        
        // Handle different interaction types
        switch (interaction.type) {
            case 2: // APPLICATION_COMMAND (slash commands)
                console.log('Handling slash command');
                await handleSlashCommand(interaction);
                break;
            case 3: // MESSAGE_COMPONENT (buttons, select menus)
                console.log('Handling message component');
                await handleMessageComponent(interaction);
                break;
            default:
                console.log('Unknown interaction type:', interaction.type);
                await respondToInteraction(interaction, {
                    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                    data: {
                        content: "Sorry, I don't know how to handle this interaction type."
                    }
                });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        // Try to respond with an error message
        try {
            await respondToInteraction(interaction, {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    content: "Sorry, there was an error processing your request."
                }
            });
        } catch (e) {
            console.error('Failed to send error response:', e);
        }
    }
};

/**
 * Handle message component interactions (buttons, select menus)
 * @param interaction Discord interaction
 */
const handleMessageComponent = async (interaction: Interaction): Promise<void> => {
    if (!interaction.data?.custom_id) {
        console.log('Interaction missing custom_id');
        await respondToInteraction(interaction, {
            type: 4,
            data: {
                content: "Invalid interaction data."
            }
        });
        return;
    }

    const customId = interaction.data.custom_id;
    const userId = interaction.member?.user.id || interaction.user?.id;
    const channelId = interaction.channel_id;

    console.log('Processing message component:', {
        customId,
        userId,
        channelId,
        interactionId: interaction.id,
        token: interaction.token.substring(0, 5) + '...' // Log part of token for debugging
    });

    if (!userId || !channelId) {
        console.error('Missing user ID or channel ID in interaction');
        return;
    }
    
    // Handle button clicks
    if (customId.startsWith('start_doc_')) {
        console.log('Handling start_doc button');
        
        // Check if this is using the new format with temp session ID
        if (customId.startsWith('start_doc_temp_')) {
            // This is a new format with temp session ID (format: start_doc_temp_userId_timestamp)
            console.log('Detected temp session format for start_doc');
            const tempSessionId = customId.substring(10); // Remove "start_doc_" prefix
            await handleStartDocument(interaction, userId, channelId, 1, tempSessionId);
        } else {
            // Legacy format with just page count
            const pages = parseInt(customId.split('_')[2]) || 1;
            console.log(`Starting document with ${pages} pages (legacy format)`);
            await handleStartDocument(interaction, userId, channelId, pages);
        }
    } else if (customId === 'end_upload') {
        await handleEndUpload(interaction, userId, channelId);
    } else if (customId === 'continue_upload') {
        await handleContinueUpload(interaction);
    } else if (customId.startsWith('class_select_')) {
        // Extract session ID from custom_id
        const sessionId = customId.split('_')[2];
        await handleClassSelection(interaction, sessionId);
    } else if (customId.startsWith('student_select_')) {
        // Extract session ID and class ID from custom_id
        const parts = customId.split('_');
        const sessionId = parts[2];
        const classId = parts[3];
        await handleStudentSelection(interaction, sessionId, classId);
    } else if (customId.startsWith('skip_metadata_')) {
        // We don't need the session ID for skip metadata operation
        await handleSkipMetadata(interaction);
    } else if (customId.startsWith('view_doc_')) {
        // Extract document ID from custom_id
        const documentId = customId.substring(9); // Remove "view_doc_" prefix
        await handleViewDocument(interaction, documentId);
    } else if (customId.startsWith('confirm_process_')) {
        // Extract session ID from custom_id
        const sessionId = customId.split('_')[2];
        // Skip text quality selection and show metadata dialog directly
        const { showMetadataDialog } = await import('./metadata-handler');
        await showMetadataDialog(interaction.channel_id, userId, sessionId);
    } else if (customId.startsWith('cancel_process_')) {
        // Extract session ID from custom_id
        const sessionId = customId.split('_')[2];
        await handleCancelProcess(interaction, sessionId);
    } else if (customId.startsWith('confirm_final_process_')) {
        // Extract session ID from custom_id
        const sessionId = customId.split('_')[3];
        await handleFinalConfirmProcess(interaction, sessionId);
    // Removed text_quality handling as we no longer ask for text quality
    } else {
        await respondToInteraction(interaction, {
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: {
                content: "Unknown button action."
            }
        });
    }
};

/**
 * Handle slash commands
 * @param interaction Discord interaction
 */
const handleSlashCommand = async (interaction: Interaction): Promise<void> => {
    if (!interaction.data) {
        await respondToInteraction(interaction, {
            type: 4,
            data: {
                content: "Invalid command data."
            }
        });
        return;
    }

    const commandName = interaction.data.name;
    const userId = interaction.member?.user.id || interaction.user?.id;
    const channelId = interaction.channel_id;

    if (!userId || !channelId) {
        console.error('Missing user ID or channel ID in interaction');
        return;
    }

    // Handle different commands
    switch (commandName) {
        case 'start-upload': {
            // Get pages option if provided
            const options = interaction.data?.options as Array<{ name: string; value: number }> || [];
            const pagesOption = options.find(o => o.name === 'pages');
            const pages = pagesOption ? pagesOption.value : 1;
            
            await handleStartDocument(interaction, userId, channelId, pages);
            break;
        }
        case 'end-upload':
            await handleEndUpload(interaction, userId, channelId);
            break;
        case 'status':
            await handleStatus(interaction);
            break;
        case 'help':
            await handleHelp(interaction);
            break;
        default:
            await respondToInteraction(interaction, {
                type: 4,
                data: {
                    content: "Unknown command."
                }
            });
    }
};

/**
 * Handle start document button/command
 */
const handleStartDocument = async (
    interaction: Interaction,
    userId: string,
    channelId: string,
    pages: number,
    tempSessionId?: string
): Promise<void> => {
    try {
        console.log('Starting document session with params:', {
            interactionId: interaction.id,
            userId,
            channelId,
            pages,
            tempSessionId
        });
        
        // First, acknowledge the interaction immediately to prevent timeout
        // Use type 5 (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE) to show a loading state
        console.log('Acknowledging interaction with deferred response');
        await respondToInteraction(interaction, {
            type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
        
        console.log('Interaction acknowledged, creating document session');
        // Then create the session (this can take longer than 3 seconds)
        const session = await startDocumentSession(channelId, userId, pages);
        
        // If we have a temporary session ID, associate those images with the new session
        if (tempSessionId) {
            console.log(`Associating orphaned images from temp session ${tempSessionId}`);
            const batch = adminDb.batch();
            
            // Get all pending images with the temporary session ID
            const pendingImagesSnapshot = await adminDb
                .collection('pending_images')
                .where('sessionId', '==', tempSessionId)
                .where('userId', '==', userId)
                .where('isOrphaned', '==', true)
                .get();
            
            if (!pendingImagesSnapshot.empty) {
                console.log(`Found ${pendingImagesSnapshot.size} orphaned images to associate`);
                const imageRefs: string[] = [];
                
                // Update each image with the new session ID
                pendingImagesSnapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        sessionId: session.sessionId,
                        isOrphaned: false
                    });
                    imageRefs.push(doc.id);
                });
                
                // Update the session with the image references
                batch.update(adminDb.collection('document_sessions').doc(session.sessionId), {
                    receivedPages: pendingImagesSnapshot.size,
                    pageOrder: imageRefs,
                    updatedAt: new Date()
                });
                
                await batch.commit();
                console.log('Successfully associated orphaned images with new session');
            } else {
                console.log('No orphaned images found for temp session');
            }
        }
        
        console.log('Document session setup complete, sending followup message');
        // Now send a followup message with buttons for next actions
        await sendInteractiveMessage(
            channelId,
            `Document created successfully! You can now:\n• Upload more images if you have additional pages\n• Process the document when you're ready`,
            [
                {
                    type: ComponentType.Button,
                    custom_id: "end_upload",
                    label: "Process Document",
                    style: ButtonStyle.Success
                },
                {
                    type: ComponentType.Button,
                    custom_id: "continue_upload",
                    label: "I'll Add More Images",
                    style: ButtonStyle.Secondary
                }
            ]
        );
        console.log('Followup message sent successfully');
    } catch (error) {
        console.error('Error starting document:', error);
        try {
            await respondToInteraction(interaction, {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    content: "Failed to start document session. Please try again."
                }
            });
        } catch (err) {
            console.error('Failed to send error response:', err);
            // Try to send a direct message as fallback
            try {
                await sendInteractiveMessage(
                    channelId,
                    "Failed to start document session. Please try again.",
                    []
                );
            } catch (msgErr) {
                console.error('Failed to send fallback message:', msgErr);
            }
        }
    }
};

/**
 * Handle end upload button/command
 */
const handleEndUpload = async (
    interaction: Interaction,
    userId: string,
    channelId: string
): Promise<void> => {
    try {
        // First, acknowledge the interaction immediately to prevent timeout
        await respondToInteraction(interaction, {
            type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
        
        // End the session and start processing
        const sessionId = await endDocumentSession(channelId, userId);
        
        // If session was successfully ended
        if (sessionId) {
            // Show metadata dialog directly without asking for text quality
            // Import the showMetadataDialog function since we removed it earlier
            const { showMetadataDialog } = await import('./metadata-handler');
            await showMetadataDialog(channelId, userId, sessionId);
        } else {
            // Session couldn't be ended (might be expired or not found)
            console.warn('Failed to end document session for user:', userId);
            // Message already sent by endDocumentSession
        }
    } catch (error) {
        console.error('Error ending upload:', error);
        
        // Try to send an error message
        try {
            await sendInteractiveMessage(
                channelId,
                "Failed to process document. Please try again or contact support if the issue persists.",
                []
            );
        } catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
};

/**
 * Handle continue upload button
 */
const handleContinueUpload = async (interaction: Interaction): Promise<void> => {
    try {
        const userId = interaction.member?.user.id || interaction.user?.id;
        if (!userId) {
            console.error('Missing user ID in interaction');
            return;
        }

        // First, acknowledge the interaction immediately
        await respondToInteraction(interaction, {
            type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
        
        // Get the active session
        const activeSession = await getActiveSession(userId);
        
        if (activeSession) {
            // Extend the session timeout
            await extendSessionTimeout(activeSession.sessionId);
            
            // Send a message with the updated status and buttons
            await sendInteractiveMessage(
                interaction.channel_id,
                `Your session has been extended! You have 10 more minutes to upload additional images.\n\nCurrent status: ${activeSession.receivedPages} page(s) received so far.`,
                [
                    {
                        type: ComponentType.Button,
                        custom_id: "end_upload",
                        label: "Process Document Now",
                        style: ButtonStyle.Success
                    }
                ]
            );
        } else {
            // No active session found
            await sendInteractiveMessage(
                interaction.channel_id,
                "Your session has expired. Please start a new document session.",
                []
            );
        }
    } catch (error) {
        console.error('Error handling continue upload:', error);
        
        // Send error message
        try {
            await sendInteractiveMessage(
                interaction.channel_id,
                "There was an error extending your session. Please try again.",
                []
            );
        } catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
};

/**
 * Handle class selection
 */
const handleClassSelection = async (interaction: Interaction, sessionId: string): Promise<void> => {
    // Use the implementation from metadata-handler.ts
    await metadataHandleClassSelection(interaction, sessionId);
};

/**
 * Handle student selection
 */
const handleStudentSelection = async (interaction: Interaction, sessionId: string, classId: string): Promise<void> => {
    // Use the implementation from metadata-handler.ts
    await metadataHandleStudentSelection(interaction, sessionId, classId);
};

/**
 * Handle skip metadata button
 */
const handleSkipMetadata = async (interaction: Interaction): Promise<void> => {
    try {
        // Extract session ID from the custom_id (format: skip_metadata_{sessionId})
        const customId = interaction.data?.custom_id || '';
        const sessionId = customId.split('_')[2];
        
        console.log(`User ${interaction.member?.user.id} skipped metadata for session ${sessionId}`);
        
        if (!sessionId) {
            console.error('No session ID found in skip metadata button');
            await respondToInteraction(interaction, {
                type: 7, // UPDATE_MESSAGE
                data: {
                    content: "Error processing document. Session ID not found.",
                    components: [] // Remove buttons
                }
            });
            return;
        }
        
        // Show final confirmation dialog
        await respondToInteraction(interaction, {
            type: 7, // UPDATE_MESSAGE
            data: {
                content: "You've chosen to skip document organization. Ready to process the document?",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                custom_id: `confirm_final_process_${sessionId}`,
                                label: "Yes, Process Document",
                                style: ButtonStyle.Success
                            },
                            {
                                type: ComponentType.Button,
                                custom_id: `cancel_process_${sessionId}`,
                                label: "Cancel",
                                style: ButtonStyle.Danger
                            }
                        ]
                    }
                ]
            }
        });
    } catch (error) {
        console.error('Error handling skip metadata:', error);
        await respondToInteraction(interaction, {
            type: 7, // UPDATE_MESSAGE
            data: {
                content: "An error occurred. Please try again.",
                components: [] // Remove buttons
            }
        });
    }
};

/**
 * Handle view document button
 * @param interaction Discord interaction
 * @param documentId ID of the document to view
 */
const handleViewDocument = async (interaction: Interaction, documentId: string): Promise<void> => {
    try {
        console.log(`Handling view document button for document: ${documentId}`);
        
        // Get the application URL from environment
        const appUrl = process.env.APP_URL || 'https://snapgrade.app';
        const documentUrl = `${appUrl}/documents/${documentId}`;
        
        // Acknowledge the interaction
        await respondToInteraction(interaction, {
            type: 7, // UPDATE_MESSAGE
            data: {
                content: `You can view and edit your document at: ${documentUrl}\n\nIf the link doesn't work, please log in to ${appUrl} and find the document in your Document Bay.`,
                components: [] // Remove buttons
            }
        });
        
        console.log(`Sent document view link for document: ${documentId}`);
    } catch (error) {
        console.error('Error handling view document button:', error);
        
        try {
            await respondToInteraction(interaction, {
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: {
                    content: "Failed to generate document link. Please go to https://snapgrade.app and find the document in your Document Bay."
                }
            });
        } catch (e) {
            console.error('Failed to send error response:', e);
        }
    }
};

/**
 * Handle status command
 */
const handleStatus = async (interaction: Interaction): Promise<void> => {
    try {
        const userId = interaction.member?.user.id || interaction.user?.id;
        
        if (!userId) {
            console.error('Missing user ID in interaction');
            await respondToInteraction(interaction, {
                type: 4,
                data: {
                    content: "Failed to retrieve your status. Please try again."
                }
            });
            return;
        }
        
        // First, acknowledge the interaction to prevent timeout
        await respondToInteraction(interaction, {
            type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
        
        // Get active session
        const activeSession = await getActiveSession(userId);
        
        // Get recent sessions (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentSessionsSnapshot = await adminDb
            .collection('document_sessions')
            .where('userId', '==', userId)
            .where('createdAt', '>=', oneWeekAgo)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
            
        const recentSessions = recentSessionsSnapshot.docs.map(doc => doc.data());
        
        // Count sessions by status
        const statusCounts = {
            COLLECTING: 0,
            PROCESSING: 0,
            COMPLETED: 0,
            FAILED: 0
        };
        
        recentSessions.forEach(session => {
            if (session.status in statusCounts) {
                statusCounts[session.status as keyof typeof statusCounts]++;
            }
        });
        
        // Format status message
        let statusMessage = "**Your Document Status**\n\n";
        
        if (activeSession) {
            // Use our utility function to safely convert to a Date
            const expiryTime = ensureDate(activeSession.expiresAt);
                
            const timeRemaining = Math.max(0, Math.floor((expiryTime.getTime() - Date.now()) / 60000));
            
            statusMessage += `**Active Session:**\n`;
            statusMessage += `- Pages received: ${activeSession.receivedPages}\n`;
            statusMessage += `- Expected pages: ${activeSession.pageCount}\n`;
            statusMessage += `- Time remaining: ${timeRemaining} minutes\n\n`;
        } else {
            statusMessage += `**No active session**\n\n`;
        }
        
        statusMessage += `**Recent Documents (Last 7 Days):**\n`;
        statusMessage += `- Completed: ${statusCounts.COMPLETED}\n`;
        statusMessage += `- Processing: ${statusCounts.PROCESSING}\n`;
        statusMessage += `- Failed: ${statusCounts.FAILED}\n\n`;
        
        statusMessage += `You can view and manage all your documents at https://snapgrade.app/documents`;
        
        // Send the status message
        await sendInteractiveMessage(
            interaction.channel_id,
            statusMessage,
            []
        );
    } catch (error) {
        console.error('Error handling status command:', error);
        
        // Try to send an error message
        try {
            await sendInteractiveMessage(
                interaction.channel_id,
                "Failed to retrieve your status. Please try again or contact support if the issue persists.",
                []
            );
        } catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
};

/**
 * Handle help command
 */
const handleHelp = async (interaction: Interaction): Promise<void> => {
    const helpText = `
**Snapgrade Bot - Document Processing**

**How to Use**:
1. Send your image(s) to the bot
2. Click the "Create Document" button
3. Upload more images if needed or click "Process Document" when ready
4. Assign the document to a class and student (optional)
5. View and edit your document at https://snapgrade.app/documents

**Available Commands**:
- **/status** - Check your account and document status
- **/help** - Show this help message

**Need assistance?** Contact support at support@snapgrade.app
`;

    await respondToInteraction(interaction, {
        type: 4,
        data: {
            content: helpText
        }
    });
};

// Removed handleConfirmProcess function as we no longer ask for text quality

/**
 * Handle final confirmation to process document
 * @param interaction Discord interaction
 * @param sessionId Document session ID
 */
const handleFinalConfirmProcess = async (
  interaction: Interaction,
  sessionId: string
): Promise<void> => {
  try {
    // Update session status to PROCESSING
    await adminDb
      .collection('document_sessions')
      .doc(sessionId)
      .update({
        status: 'PROCESSING',
        processingProgress: {
          current: 0,
          total: 1,
          stage: 'queued',
          startedAt: new Date()
        },
        updatedAt: new Date()
      });
    
    // Update the interaction to show processing has started
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "Document processing has started. This may take several minutes depending on the number of pages.",
        components: [] // Remove buttons
      }
    });
    
    // Start processing in the background using LLM Whisperer service
    const llmWhisperer = await import('../services/llmWhispererService');
    llmWhisperer.processDocumentSession(sessionId)
      .then(result => {
        // Notify user when processing is complete
        sendInteractiveMessage(
          interaction.channel_id,
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
        console.error(`Error processing session ${sessionId}:`, error);
        // Notify user of failure
        sendInteractiveMessage(
          interaction.channel_id,
          "There was an error processing your document. Please try again.",
          []
        ).catch(err => console.error('Error sending failure message:', err));
      });
  } catch (error) {
    console.error('Error handling final confirmation:', error);
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "An error occurred while starting processing. Please try again.",
        components: [] // Remove buttons
      }
    });
  }
};

/**
 * Handle cancellation of document processing
 * @param interaction Discord interaction
 * @param sessionId Document session ID
 */
const handleCancelProcess = async (
  interaction: Interaction,
  sessionId: string
): Promise<void> => {
  try {
    // Get user ID safely (needed for future operations)
    const userId = interaction.member?.user.id || interaction.user?.id;
    
    if (!userId) {
      console.error('Missing user ID in interaction');
      throw new Error('User ID not found in interaction');
    }
    
    // Update session status to CANCELLED
    await adminDb
      .collection('document_sessions')
      .doc(sessionId)
      .update({
        status: 'CANCELLED',
        updatedAt: new Date()
      });
    
    // Update the interaction to show cancellation
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "Document processing has been cancelled. Your images are still saved and you can process them later.",
        components: [] // Remove buttons
      }
    });
  } catch (error) {
    console.error('Error cancelling process:', error);
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "An error occurred while cancelling. Please try again.",
        components: [] // Remove buttons
      }
    });
  }
};