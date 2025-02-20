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

export const discordConnectionSchema = z.object({
    isConnected: z.boolean(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).nullable()
});

export type DiscordMapping = z.infer<typeof discordMappingSchema>;
export type DiscordConnection = z.infer<typeof discordConnectionSchema>;

/**
 * Discord message attachment schema
 */
export const attachmentSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    filename: z.string(),
    contentType: z.string().optional(),
    size: z.number().positive(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

/**
 * Discord message data schema
 */
export const messageDataSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    author: z.object({
        id: z.string(),
    }),
    attachments: z.array(attachmentSchema),
});

export type MessageData = z.infer<typeof messageDataSchema>;

/**
 * Discord button component schema
 */
export const buttonComponentSchema = z.object({
    type: z.literal(2),
    style: z.number(),
    label: z.string(),
    custom_id: z.string(),
});

/**
 * Discord action row schema
 */
export const actionRowSchema = z.object({
    type: z.literal(1),
    components: z.array(buttonComponentSchema),
});

export type ActionRow = z.infer<typeof actionRowSchema>;