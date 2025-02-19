import { z } from 'zod';
/**
 * Schema for mapping Discord IDs to Firebase UIDs
 * @property {string} discordId - The user's Discord ID
 * @property {string} firebaseUid - The user's Firebase UID
 * @property {Date} createdAt - When the mapping was created
 * @property {Date} lastUsed - Last time this mapping was used
 * @property {string} status - Current status of the mapping
 */
export const discordMappingSchema = z.object({
    discordId: z.string(),
    firebaseUid: z.string(),
    createdAt: z.date(),
    lastUsed: z.date(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});
