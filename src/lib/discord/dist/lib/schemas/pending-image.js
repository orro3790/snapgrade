import { z } from 'zod';
/**
 * Schema for pending image processing requests
 * @property {string} discordMessageId - The Discord message ID containing the image
 * @property {string} channelId - The Discord channel ID where the image was sent
 * @property {string} userId - The Discord user ID who sent the image
 * @property {string} imageUrl - The URL of the image from Discord's CDN
 * @property {string} filename - Original filename of the image
 * @property {string} contentType - MIME type of the image
 * @property {number} size - Size of the image in bytes
 * @property {string} status - Current processing status
 * @property {Date} createdAt - When the request was created
 * @property {Date} processedAt - When the request was processed (if completed)
 * @property {string} error - Error message if processing failed
 */
export const pendingImageSchema = z.object({
    discordMessageId: z.string(),
    channelId: z.string(),
    userId: z.string(),
    imageUrl: z.string().url(),
    filename: z.string(),
    contentType: z.string(),
    size: z.number(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
    createdAt: z.date(),
    processedAt: z.date().optional(),
    error: z.string().optional()
});
