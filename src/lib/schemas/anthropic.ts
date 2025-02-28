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
 * Schema for Anthropic tool use
 */
export const anthropicToolUseSchema = z.object({
    type: z.literal('tool_use'),
    id: z.string(),
    name: z.string(),
    input: z.record(z.any())
});

/**
 * Schema for Anthropic content block
 */
export const anthropicContentBlockSchema = z.union([
    z.object({
        type: z.literal('text'),
        text: z.string()
    }),
    anthropicToolUseSchema
]);

/**
 * Schema for Anthropic API response
 */
export const anthropicResponseSchema = z.object({
    content: z.array(anthropicContentBlockSchema)
});

export type AnthropicMessage = z.infer<typeof anthropicMessageSchema>;
export type AnthropicResponse = z.infer<typeof anthropicResponseSchema>;
export type AnthropicToolUse = z.infer<typeof anthropicToolUseSchema>;