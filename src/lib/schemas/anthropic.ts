import { z } from 'zod';

/**
 * Schema for Anthropic message role
 */
export const anthropicRoleSchema = z.enum(['user', 'assistant']);

/**
 * Schema for Anthropic message
 */
export const anthropicMessageSchema = z.object({
    role: anthropicRoleSchema,
    content: z.string()
});

/**
 * Schema for Anthropic content block
 */
export const anthropicContentBlockSchema = z.object({
    text: z.string()
});

/**
 * Schema for Anthropic API response
 */
export const anthropicResponseSchema = z.object({
    content: z.array(anthropicContentBlockSchema)
});

export type AnthropicMessage = z.infer<typeof anthropicMessageSchema>;
export type AnthropicResponse = z.infer<typeof anthropicResponseSchema>;