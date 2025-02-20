import type { MessageData } from '../../schemas/discordInteractions';
import type { ActionRow } from '../../schemas/discordInteractions';
import { DocumentSessionService } from '../../services/documentSessionService';
import { pendingImageSchema } from '../../schemas/pending-image';

/**
 * Handles document-related message processing for the Discord bot
 */
export class DocumentHandler {
    constructor(
        private readonly sendMessage: (
            channelId: string,
            content: string,
            components?: ActionRow[]
        ) => Promise<void>
    ) {}

    /**
     * Handle image attachments in a message
     */
    public async handleImageAttachments(message: MessageData): Promise<void> {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const images = message.attachments.filter(
            attachment => attachment.content_type && validImageTypes.includes(attachment.content_type)
        );

        if (images.length === 0) {
            await this.sendMessage(message.channel_id,
                "Please send a valid image file (JPEG, PNG, WEBP, or GIF)."
            );
            return;
        }

        try {
            // Check for active session
            const session = await DocumentSessionService.getActiveSession(message.author.id);

            if (session) {
                // Handle multi-page document
                await this.handleMultiPageDocument(message, images, session);
            } else {
                // Ask if this is a multi-page document
                await this.promptForPageCount(message.channel_id);
                await this.processImagesIndividually(message, images);
            }
        } catch (error) {
            console.error('Error handling image attachments:', error);
            await this.sendMessage(message.channel_id,
                "Sorry, there was an error processing your images. Please try again later."
            );
        }
    }

    /**
     * Handle images for a multi-page document
     */
    private async handleMultiPageDocument(
        message: MessageData,
        images: MessageData['attachments'],
        session: Awaited<ReturnType<typeof DocumentSessionService.getActiveSession>>
    ): Promise<void> {
        if (!session) return;

        const remainingPages = session.pageCount - session.receivedPages;

        if (images.length > remainingPages) {
            await this.sendMessage(message.channel_id,
                `You sent ${images.length} images, but only ${remainingPages} more ${
                    remainingPages === 1 ? 'page is' : 'pages are'
                } expected for this document. Please send the correct number of pages or cancel the current session.`
            );
            return;
        }

        // Process each image
        for (const image of images) {
            try {
                const pendingImage = pendingImageSchema.parse({
                    discordMessageId: message.id,
                    channelId: message.channel_id,
                    userId: message.author.id,
                    imageUrl: image.url,
                    filename: image.filename,
                    contentType: image.content_type,
                    size: image.size,
                    status: 'PENDING',
                    createdAt: new Date()
                });

                await DocumentSessionService.addImageToSession(session, pendingImage);
            } catch (error) {
                console.error('Error adding image to session:', error);
                await this.sendMessage(message.channel_id,
                    "Sorry, there was an error processing one of your images. Please try again."
                );
                return;
            }
        }

        // Send status update
        if (session.receivedPages + images.length === session.pageCount) {
            await this.sendMessage(message.channel_id,
                "All pages received! Processing your document..."
            );
        } else {
            const remaining = session.pageCount - (session.receivedPages + images.length);
            await this.sendMessage(message.channel_id,
                `Received ${images.length} more ${images.length === 1 ? 'page' : 'pages'}. ` +
                `Please send the remaining ${remaining} ${remaining === 1 ? 'page' : 'pages'}.`
            );
        }
    }

    /**
     * Process images individually (not part of a multi-page document)
     */
    private async processImagesIndividually(
        message: MessageData,
        images: MessageData['attachments']
    ): Promise<void> {
        await this.sendMessage(message.channel_id,
            "Processing each image separately... This may take a moment."
        );

        for (const image of images) {
            try {
                const pendingImage = pendingImageSchema.parse({
                    discordMessageId: message.id,
                    channelId: message.channel_id,
                    userId: message.author.id,
                    imageUrl: image.url,
                    filename: image.filename,
                    contentType: image.content_type,
                    size: image.size,
                    status: 'PENDING',
                    createdAt: new Date()
                });

                // Create a single-page session
                const session = await DocumentSessionService.createSession(message.author.id, 1);
                await DocumentSessionService.addImageToSession(session, pendingImage);
            } catch (error) {
                console.error('Error processing individual image:', error);
                await this.sendMessage(message.channel_id,
                    "Sorry, there was an error processing one of your images. Please try again."
                );
            }
        }
    }

    /**
     * Prompt user for number of pages in document
     */
    private async promptForPageCount(channelId: string): Promise<void> {
        await this.sendMessage(
            channelId,
            "Is this part of a multi-page document? If so, how many pages are there in total?",
            [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: "Single Page",
                            custom_id: "page_count_1"
                        },
                        {
                            type: 2,
                            style: 1,
                            label: "2 Pages",
                            custom_id: "page_count_2"
                        },
                        {
                            type: 2,
                            style: 1,
                            label: "3 Pages",
                            custom_id: "page_count_3"
                        },
                        {
                            type: 2,
                            style: 1,
                            label: "4 Pages",
                            custom_id: "page_count_4"
                        },
                        {
                            type: 2,
                            style: 1,
                            label: "5 Pages",
                            custom_id: "page_count_5"
                        }
                    ]
                }
            ]
        );
    }
}