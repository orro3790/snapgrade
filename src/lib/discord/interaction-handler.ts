import { type Interaction } from '../schemas/discord-consolidated';
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
    showMetadataDialog,
    handleClassSelection as metadataHandleClassSelection,
    handleStudentSelection as metadataHandleStudentSelection
} from './metadata-handler';
import { getActiveSession } from '../services/documentSession';
import { adminDb } from '../firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Safely convert a Firestore timestamp or any date-like value to a JavaScript Date
 * @param dateValue The value to convert (could be Date, Firestore Timestamp, string, number)
 * @returns A JavaScript Date object
 */
function ensureDate(dateValue: Date | Timestamp | unknown): Date {
    // If it's null or undefined, return current date
    if (dateValue == null) {
        return new Date();
    }
    
    // If it's already a Date, return it
    if (dateValue instanceof Date) {
        return dateValue;
    }
    
    // If it's a Firestore Timestamp
    if (dateValue instanceof Timestamp) {
        return dateValue.toDate();
    }
    
    // Otherwise try to create a Date from it
    return new Date(String(dateValue));
}

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
        // Extract number of pages from custom_id
        const pages = parseInt(customId.split('_')[2]) || 1;
        console.log(`Starting document with ${pages} pages`);
        await handleStartDocument(interaction, userId, channelId, pages);
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
    pages: number
): Promise<void> => {
    try {
        console.log('Starting document session with params:', {
            interactionId: interaction.id,
            userId,
            channelId,
            pages
        });
        
        // First, acknowledge the interaction immediately to prevent timeout
        // Use type 5 (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE) to show a loading state
        console.log('Acknowledging interaction with deferred response');
        await respondToInteraction(interaction, {
            type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
        
        console.log('Interaction acknowledged, creating document session');
        // Then create the session (this can take longer than 3 seconds)
        await startDocumentSession(channelId, userId, pages);
        
        console.log('Document session created, sending followup message');
        // Now send a followup message (we've already acknowledged the interaction)
        await sendInteractiveMessage(
            channelId,
            `Started a new document session expecting ${pages} page(s). Please send the remaining images.`,
            []
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
        
        // If session was successfully ended and processing started
        if (sessionId) {
            // Send a followup message
            await sendInteractiveMessage(
                channelId,
                "Your document is being processed. You will be notified when it's ready.",
                []
            );
            
            // Show metadata dialog for document organization
            await showMetadataDialog(channelId, userId, sessionId);
        } else {
            // Session couldn't be ended (might be expired or not found)
            console.warn('Failed to end document session for user:', userId);
            
            // This message is already sent by endDocumentSession, so we don't need to send it again
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
            
            // Send a message with the updated status
            await sendInteractiveMessage(
                interaction.channel_id,
                `Please send more images when you're ready. Your session will remain active for 10 more minutes. (${activeSession.receivedPages} pages received so far)`,
                []
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
    // We don't need the sessionId for this operation
    await respondToInteraction(interaction, {
        type: 7, // UPDATE_MESSAGE
        data: {
            content: "Document processing has started. You can organize it later in the Document Bay.",
            components: [] // Remove buttons
        }
    });
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
**Snapgrade Bot Commands**

**/start-upload [pages]** - Start a new upload session
  - Optional: Specify number of pages expected

**/end-upload** - End current upload session and process document

**/status** - Check your account and upload status

**/help** - Show this help message

**How to Use**:
1. Start an upload session with \`/start-upload\`
2. Send your images to the bot
3. End the session with \`/end-upload\`
4. View and edit your document at https://snapgrade.app/documents
`;

    await respondToInteraction(interaction, {
        type: 4,
        data: {
            content: helpText
        }
    });
};