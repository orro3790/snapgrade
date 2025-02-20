import { z } from 'zod';

// Raw Discord API response schemas
export const rawDiscordAttachmentSchema = z.object({
    id: z.string(),
    url: z.string(),
    filename: z.string(),
    content_type: z.string().optional(),
    size: z.number()
});

export const rawDiscordAuthorSchema = z.object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    bot: z.boolean().optional()
});

export const rawDiscordMessageSchema = z.object({
    id: z.string(),
    channel_id: z.string(),
    author: rawDiscordAuthorSchema,
    content: z.string(),
    attachments: z.array(rawDiscordAttachmentSchema)
});

// Discord mapping schema for Firebase
export const discordMappingSchema = z.object({
    discordId: z.string(),
    firebaseUid: z.string(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    createdAt: z.date(),
    lastUsed: z.date(),
    username: z.string().optional()
});

// Auth result schema
export const authResultSchema = z.object({
    authenticated: z.boolean(),
    status: discordMappingSchema.shape.status.optional(),
    firebaseUid: z.string().optional(),
    error: z.string().optional()
});

// Pending image schema
export const pendingImageSchema = z.object({
    discordMessageId: z.string(),
    channelId: z.string(),
    userId: z.string(),
    imageUrl: z.string(),
    filename: z.string(),
    contentType: z.string(),
    size: z.number(),
    status: z.literal('PENDING'),
    createdAt: z.date()
});

// Gateway payload schemas
export const gatewayPayloadSchema = z.object({
    op: z.number(),
    d: z.unknown(),
    s: z.number().nullable().optional(),
    t: z.string().nullable().optional()
});

export const readyEventSchema = z.object({
    session_id: z.string(),
    resume_gateway_url: z.string()
});

export const messageCreateEventSchema = z.object({
    id: z.string(),
    channel_id: z.string(),
    author: z.object({
        id: z.string(),
        bot: z.boolean().optional()
    }),
    content: z.string(),
    attachments: z.array(z.object({
        id: z.string(),
        url: z.string(),
        filename: z.string(),
        content_type: z.string().optional(),
        size: z.number()
    }))
});

// Internal message schemas
export const discordAttachmentSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    filename: z.string(),
    contentType: z.string().optional(),
    size: z.number()
});

export const discordMessageSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    author: z.object({
        id: z.string(),
        username: z.string(),
        discriminator: z.string(),
        bot: z.boolean().optional()
    }),
    content: z.string(),
    attachments: z.array(discordAttachmentSchema)
});

// Message component schemas
export const buttonStyleSchema = z.enum(['primary', 'secondary', 'success', 'danger', 'link']);

export const buttonComponentSchema = z.object({
    type: z.literal(2),
    style: buttonStyleSchema,
    label: z.string(),
    customId: z.string().optional(),
    url: z.string().url().optional(),
    disabled: z.boolean().optional()
});

export const actionRowSchema = z.object({
    type: z.literal(1),
    components: z.array(buttonComponentSchema)
});

// Internal message format schema
export const messageDataSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    author: z.object({
        id: z.string()
    }),
    attachments: z.array(discordAttachmentSchema)
});

// Bot status schemas
export const botStatusSchema = z.enum([
    'disconnected',
    'connecting',
    'connected',
    'error'
]);

export const statusStateSchema = z.object({
    status: botStatusSchema,
    lastError: z.instanceof(Error).nullable(),
    lastUpdate: z.date()
});

// Transform functions
export const transformDiscordAttachment = (raw: z.infer<typeof rawDiscordAttachmentSchema>): z.infer<typeof discordAttachmentSchema> => ({
    id: raw.id,
    url: raw.url,
    filename: raw.filename,
    contentType: raw.content_type,
    size: raw.size
});

export const transformDiscordMessage = (raw: z.infer<typeof rawDiscordMessageSchema>): z.infer<typeof discordMessageSchema> => ({
    id: raw.id,
    channelId: raw.channel_id,
    author: {
        id: raw.author.id,
        username: raw.author.username,
        discriminator: raw.author.discriminator,
        bot: raw.author.bot
    },
    content: raw.content,
    attachments: raw.attachments.map(transformDiscordAttachment)
});

// Inferred types
export type DiscordAuthor = z.infer<typeof discordMessageSchema>['author'];
export type DiscordAttachment = z.infer<typeof discordAttachmentSchema>;
export type DiscordMessage = z.infer<typeof discordMessageSchema>;
export type ButtonStyle = z.infer<typeof buttonStyleSchema>;
export type ButtonComponent = z.infer<typeof buttonComponentSchema>;
export type ActionRow = z.infer<typeof actionRowSchema>;
export type MessageData = z.infer<typeof messageDataSchema>;
export type BotStatus = z.infer<typeof botStatusSchema>;
export type StatusState = z.infer<typeof statusStateSchema>;
export type Attachment = z.infer<typeof discordAttachmentSchema>;
export type DiscordMapping = z.infer<typeof discordMappingSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;
export type PendingImage = z.infer<typeof pendingImageSchema>;
export type GatewayPayload = z.infer<typeof gatewayPayloadSchema>;
export type ReadyEvent = z.infer<typeof readyEventSchema>;
export type MessageCreateEvent = z.infer<typeof messageCreateEventSchema>;