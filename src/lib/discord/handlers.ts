import { type MessageData, type Attachment, type ActionRow } from '../schemas/discord';
import { processSession } from '../services/documentProcessing';
import { createSession, addImageToSession } from '../services/documentSession';
import { type PendingImage, extractCdnExpiry } from '../schemas/pending-image';
import { SUPPORTED_IMAGE_TYPES } from '../schemas/documentSession';

/**
 * Handle an incoming message from Discord
 */
export const handleIncomingMessage = async (message: MessageData): Promise<void> => {
    try {
        console.log('[Message Received]', {
            id: message.id,
            channelId: message.channelId,
            authorId: message.author.id,
            attachments: message.attachments.map(a => ({
                id: a.id,
                filename: a.filename,
                contentType: a.contentType
            }))
        });

        // Ignore messages from bots
        if ('bot' in message.author && message.author.bot) {
            console.log('Ignoring bot message');
            return;
        }

        // Process attachments if present
        if (message.attachments.length > 0) {
            console.log('Processing attachments:', message.attachments.length);
            await handleAttachments(message.attachments, message.author.id, message.channelId);
        }
    } catch (error) {
        console.error('Error handling incoming message:', formatError(error));
        await sendDirectMessage(
            message.channelId,
            'Sorry, there was an error processing your message. Please try again later.'
        );
    }
};

/**
 * Handle image attachments from a message
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

        console.log('Filtered attachments:', {
            total: attachments.length,
            supported: imageAttachments.length,
            types: attachments.map(a => a.contentType)
        });

        if (imageAttachments.length === 0) {
            await sendDirectMessage(
                channelId,
                'Please send supported image files only (JPEG, PNG, WebP, or GIF).'
            );
            return;
        }

        // Create a new document session
        console.log('Creating session for user:', userId);
        const session = await createSession(userId, imageAttachments.length);
        console.log('Session created:', session.sessionId);
        
        await sendDirectMessage(
            channelId,
            `Processing ${imageAttachments.length} image${imageAttachments.length > 1 ? 's' : ''}...`
        );

        // Process each image
        for (const [index, attachment] of imageAttachments.entries()) {
            try {
                console.log('Processing image:', {
                    index,
                    id: attachment.id,
                    filename: attachment.filename
                });

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
                console.log('Image added to session:', {
                    sessionId: session.sessionId,
                    imageId: attachment.id
                });
            } catch (error) {
                console.error('Error processing image:', formatError(error));
                await sendDirectMessage(
                    channelId,
                    `Error processing image ${index + 1}. Please try again.`
                );
                return;
            }
        }

        // Start processing the session
        console.log('Starting session processing:', session.sessionId);
        await processSession(session.sessionId);
        
        await sendDirectMessage(
            channelId,
            'Your document is being processed. You will be notified when it\'s ready.'
        );
    } catch (error) {
        console.error('Error handling attachments:', formatError(error));
        await sendDirectMessage(
            channelId,
            'Sorry, there was an error processing your images. Please try again later.'
        );
    }
};

/**
 * Send a direct message to a Discord channel
 */
export const sendDirectMessage = async (
    channelId: string,
    content: string,
    components?: ActionRow[]
): Promise<void> => {
    try {
        console.log('Sending message:', {
            channelId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });

        const body: { content: string; components?: ActionRow[] } = { content };
        if (components) {
            body.components = components;
        }

        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
        }

        const response = await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }

        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending direct message:', formatError(error));
        throw error;
    }
};

/**
 * Format error details for logging
 */
const formatError = (error: unknown) => {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }
    return { error };
};