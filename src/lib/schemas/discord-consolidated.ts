import { z } from 'zod';

/**
 * Discord Message Component Types
 */
export const ComponentType = {
    ActionRow: 1,
    Button: 2,
    SelectMenu: 3,
    TextInput: 4,
} as const;

/**
 * Discord Button Styles
 */
export const ButtonStyle = {
    Primary: 1,
    Secondary: 2,
    Success: 3,
    Danger: 4,
    Link: 5,
} as const;

// ==========================================
// Gateway and API Response Schemas
// ==========================================

/**
 * Raw Discord API response schemas
 */
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

/**
 * Gateway payload schemas
 */
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

// ==========================================
// Internal Message Schemas
// ==========================================

/**
 * Discord attachment schema
 */
export const discordAttachmentSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    filename: z.string(),
    contentType: z.string().optional(),
    size: z.number()
});

/**
 * Discord message schema
 */
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

/**
 * Message data schema
 */
export const messageDataSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    author: z.object({
        id: z.string()
    }),
    attachments: z.array(discordAttachmentSchema)
});

// ==========================================
// Interaction Schemas
// ==========================================

/**
 * Schema for Discord Select Menu Options
 */
export const selectOptionSchema = z.object({
    label: z.string(),
    value: z.string(),
    description: z.string().optional(),
    emoji: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        animated: z.boolean().optional()
    }).optional(),
    default: z.boolean().optional()
});

/**
 * Schema for Discord Message Components
 */
export const buttonComponentSchema = z.object({
    type: z.literal(ComponentType.Button),
    custom_id: z.string(),
    label: z.string(),
    style: z.number().min(1).max(5)
});

export const selectMenuComponentSchema = z.object({
    type: z.literal(ComponentType.SelectMenu),
    custom_id: z.string(),
    options: z.array(selectOptionSchema),
    placeholder: z.string().optional(),
    min_values: z.number().min(0).max(25).optional(),
    max_values: z.number().min(1).max(25).optional(),
    disabled: z.boolean().optional()
});

export const actionRowSchema = z.object({
    type: z.literal(ComponentType.ActionRow),
    components: z.array(z.union([buttonComponentSchema, selectMenuComponentSchema]))
});

/**
 * Schema for Discord Message Attachments
 */
export const messageAttachmentSchema = z.object({
    id: z.string(),
    filename: z.string(),
    size: z.number(),
    url: z.string().url(),
    proxy_url: z.string().url(),
    content_type: z.string().optional()
});

/**
 * Schema for Discord Interaction Data
 */
export const interactionDataSchema = z.object({
    custom_id: z.string().optional(),
    component_type: z.number().optional(),
    values: z.array(z.string()).optional(),
}).passthrough(); // Allow additional properties

/**
 * Schema for Discord User
 */
export const userSchema = z.object({
    id: z.string(),
    username: z.string().optional(),
    discriminator: z.string().optional(),
    avatar: z.string().optional(),
});

/**
 * Schema for Discord Member
 */
export const memberSchema = z.object({
    user: userSchema,
    roles: z.array(z.string()).optional(),
    joined_at: z.string().optional(),
    nick: z.string().optional(),
}).passthrough(); // Allow additional properties

/**
 * Schema for Discord Interactions
 */
export const interactionSchema = z.object({
    id: z.string(),
    application_id: z.string(),
    type: z.number(),
    data: interactionDataSchema.optional(),
    guild_id: z.string().optional(),
    channel_id: z.string(),
    member: memberSchema.optional(),
    user: userSchema.optional(),
    token: z.string(),
    version: z.number(),
    message: messageDataSchema.optional(),
});

// ==========================================
// Firebase Integration Schemas
// ==========================================

/**
 * Discord mapping schema for Firebase
 */
export const discordMappingSchema = z.object({
    discordId: z.string(),
    firebaseUid: z.string(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    createdAt: z.date(),
    lastUsed: z.date(),
    username: z.string().optional()
});

/**
 * Auth result schema
 */
export const authResultSchema = z.object({
    authenticated: z.boolean(),
    status: discordMappingSchema.shape.status.optional(),
    firebaseUid: z.string().optional(),
    error: z.string().optional()
});

/**
 * Pending image schema
 */
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

// ==========================================
// Bot Status Schemas
// ==========================================

/**
 * Bot status schema
 */
export const botStatusSchema = z.enum([
    'disconnected',
    'connecting',
    'connected',
    'error'
]);

/**
 * Status state schema
 */
export const statusStateSchema = z.object({
    status: botStatusSchema,
    lastError: z.instanceof(Error).nullable(),
    lastUpdate: z.date()
});

// ==========================================
// Transform Functions
// ==========================================

/**
 * Transform Discord attachment from raw format
 */
export const transformDiscordAttachment = (raw: z.infer<typeof rawDiscordAttachmentSchema>): z.infer<typeof discordAttachmentSchema> => ({
    id: raw.id,
    url: raw.url,
    filename: raw.filename,
    contentType: raw.content_type,
    size: raw.size
});

/**
 * Transform Discord message from raw format
 */
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

// ==========================================
// Exported Types
// ==========================================

// Discord API types
export type DiscordAuthor = z.infer<typeof discordMessageSchema>['author'];
export type DiscordAttachment = z.infer<typeof discordAttachmentSchema>;
export type DiscordMessage = z.infer<typeof discordMessageSchema>;
export type GatewayPayload = z.infer<typeof gatewayPayloadSchema>;
export type ReadyEvent = z.infer<typeof readyEventSchema>;
export type MessageCreateEvent = z.infer<typeof messageCreateEventSchema>;

// Component types
export type ButtonComponent = z.infer<typeof buttonComponentSchema>;
export type SelectMenuComponent = z.infer<typeof selectMenuComponentSchema>;
export type ActionRow = z.infer<typeof actionRowSchema>;
export type SelectOption = z.infer<typeof selectOptionSchema>;

// Message types
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;
export type MessageData = z.infer<typeof messageDataSchema>;

// Interaction types
export type Interaction = z.infer<typeof interactionSchema>;

// Status types
export type BotStatus = z.infer<typeof botStatusSchema>;
export type StatusState = z.infer<typeof statusStateSchema>;

// Firebase integration types
export type Attachment = z.infer<typeof discordAttachmentSchema>;
export type DiscordMapping = z.infer<typeof discordMappingSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;
export type PendingImage = z.infer<typeof pendingImageSchema>;