import { z } from 'zod';
export const discordMappingSchema = z.object({
    discordId: z.string(),
    firebaseUid: z.string(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    createdAt: z.date(),
    lastUsed: z.date()
});
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
