import { z } from 'zod';
import { SUPPORTED_IMAGE_TYPES } from './documentSession';

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
 * @property {string} sessionId - ID of the document session this image belongs to
 * @property {number} pageNumber - Page number in the document
 * @property {boolean} isPartOfMultiPage - Whether this image is part of a multi-page document
 * @property {string} cdnUrlExpiry - Hex timestamp when the CDN URL expires
 */
export const pendingImageSchema = z.object({
    discordMessageId: z.string(),
    channelId: z.string(),
    userId: z.string(),
    imageUrl: z.string()
        .url()
        .refine(url => url.startsWith('https://cdn.discordapp.com/'), 
            'Must be a Discord CDN URL'),
    filename: z.string()
        .refine(name => /^[\w\-. ]+$/.test(name), 
            'Filename must be alphanumeric with dashes, dots, and spaces'),
    contentType: z.enum(SUPPORTED_IMAGE_TYPES),
    size: z.number()
        .positive()
        .max(10 * 1024 * 1024, "Individual file size cannot exceed 10 MiB"),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
    createdAt: z.date(),
    processedAt: z.date().optional(),
    error: z.string().optional(),
    // Multi-page document fields
    sessionId: z.string().optional(),
    pageNumber: z.number().min(1).optional(),
    isPartOfMultiPage: z.boolean().default(false),
    // CDN URL expiry tracking
    cdnUrlExpiry: z.string()
        .regex(/^[0-9a-f]+$/, 'Must be a hex timestamp')
        .optional()
});

export type PendingImage = z.infer<typeof pendingImageSchema>;

/**
 * Helper type for pending image updates
 */
export type PendingImageUpdate = Partial<PendingImage>;

/**
 * Extract CDN URL expiry from Discord URL
 * @param url Discord CDN URL
 * @returns Hex timestamp or undefined if not found
 */
export const extractCdnExpiry = (url: string): string | undefined => {
    const match = url.match(/[?&]ex=([0-9a-f]+)/);
    return match?.[1];
};

/**
 * Check if a CDN URL has expired
 * @param expiryHex Hex timestamp from Discord CDN URL
 * @returns boolean indicating if URL has expired
 */
export const isCdnUrlExpired = (expiryHex: string): boolean => {
    const expiryTimestamp = parseInt(expiryHex, 16) * 1000; // Convert to milliseconds
    return Date.now() >= expiryTimestamp;
};