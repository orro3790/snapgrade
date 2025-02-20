import { verifyDiscordUser, getAuthStatusMessage } from './auth';
import { type MessageData, type Attachment, type ActionRow } from '../schemas/discord';
import { processSession } from '../services/documentProcessing';
import { createSession, addImageToSession } from '../services/documentSession';
import { type PendingImage, extractCdnExpiry } from '../schemas/pending-image';
import { SUPPORTED_IMAGE_TYPES } from '../schemas/documentSession';

/**
 * Handle an incoming message from Discord
 * @param message The message data from Discord
 */
export const handleIncomingMessage = async (message: MessageData): Promise<void> => {
    try {
        // Ignore messages from bots
        if ('bot' in message.author && message.author.bot) return;

        // Verify user authentication
        const authResult = await verifyDiscordUser(message.author.id);
        
        // Handle unauthenticated or inactive users
        const statusMessage = getAuthStatusMessage(authResult);
        if (statusMessage) {
            await sendDirectMessage(message.channelId, statusMessage);
            return;
        }

        // Process attachments if present
        if (message.attachments.length > 0) {
            await handleAttachments(message.attachments, message.author.id, message.channelId);
        }
    } catch (error) {
        console.error('Error handling incoming message:', {
            messageId: message.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        await sendDirectMessage(
            message.channelId,
            'Sorry, there was an error processing your message. Please try again later.'
        );
    }
};

/**
 * Handle image attachments from a message
 * @param attachments Array of attachments from the message
 * @param userId The Discord user's ID
 * @param channelId The channel ID for status messages
 */
export const handleAttachments = async (
    attachments: Attachment[],
    userId: string,
    channelId: string
): Promise<void> => {
    try {
        // Filter for supported image attachments
        const imageAttachments = attachments.filter(
            att => att.contentType && SUPPORTED_IMAGE_TYPES.includes(
                att.contentType as typeof SUPPORTED_IMAGE_TYPES[number]
            )
        );

        if (imageAttachments.length === 0) {
            await sendDirectMessage(
                channelId,
                'Please send supported image files only (JPEG, PNG, WebP, or GIF).'
            );
            return;
        }

        // Create a new document session
        const session = await createSession(userId, imageAttachments.length);
        await sendDirectMessage(
            channelId,
            `Processing ${imageAttachments.length} image${imageAttachments.length > 1 ? 's' : ''}...`
        );

        // Process each image
        for (const [index, attachment] of imageAttachments.entries()) {
            try {
                const pendingImage: PendingImage = {
                    discordMessageId: attachment.id,
                    channelId,
                    userId,
                    imageUrl: attachment.url,
                    filename: attachment.filename,
                    contentType: attachment.contentType as typeof SUPPORTED_IMAGE_TYPES[number],
                    size: attachment.size,
                    status: 'PENDING',
                    createdAt: new Date(),
                    sessionId: session.sessionId,
                    pageNumber: index + 1,
                    isPartOfMultiPage: true,
                    cdnUrlExpiry: extractCdnExpiry(attachment.url)
                };

                await addImageToSession(session, pendingImage);
            } catch (error) {
                console.error('Error processing image:', {
                    attachmentId: attachment.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                
                await sendDirectMessage(
                    channelId,
                    `Error processing image ${index + 1}. Please try again.`
                );
                return;
            }
        }

        // Start processing the session
        await processSession(session.sessionId);
        
        await sendDirectMessage(
            channelId,
            'Your document is being processed. You will be notified when it\'s ready.'
        );
    } catch (error) {
        console.error('Error handling attachments:', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        await sendDirectMessage(
            channelId,
            'Sorry, there was an error processing your images. Please try again later.'
        );
    }
};

/**
 * Send a direct message to a Discord channel
 * @param channelId The channel ID to send the message to
 * @param content The message content
 * @param components Optional message components (buttons, etc)
 */
export const sendDirectMessage = async (
    channelId: string,
    content: string,
    components?: ActionRow[]
): Promise<void> => {
    try {
        const body: { content: string; components?: ActionRow[] } = { content };
        if (components) {
            body.components = components;
        }

        const response = await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error sending direct message:', {
            channelId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
};