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
 * Schema for Discord Messages
 */
export const messageDataSchema = z.object({
    id: z.string(),
    channel_id: z.string(),
    author: z.object({
        id: z.string(),
        username: z.string(),
        discriminator: z.string(),
        bot: z.boolean().optional()
    }),
    content: z.string(),
    attachments: z.array(messageAttachmentSchema)
});

/**
 * Schema for Discord Interactions
 */
export const interactionSchema = z.object({
    channel_id: z.string(),
    user: z.object({
        id: z.string()
    })
});

// Export types
export type SelectOption = z.infer<typeof selectOptionSchema>;
export type ButtonComponent = z.infer<typeof buttonComponentSchema>;
export type SelectMenuComponent = z.infer<typeof selectMenuComponentSchema>;
export type ActionRow = z.infer<typeof actionRowSchema>;
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;
export type MessageData = z.infer<typeof messageDataSchema>;
export type Interaction = z.infer<typeof interactionSchema>;