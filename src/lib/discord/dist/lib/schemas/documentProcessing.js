import { z } from 'zod';
/**
 * Schema for validating document processing requests
 */
export const documentProcessRequestSchema = z.object({
    image: z.string()
        .min(1, "Image data is required")
        .refine((val) => {
        try {
            // Validate it's a valid base64 string
            return Buffer.from(val, 'base64').toString('base64') === val;
        }
        catch {
            return false;
        }
    }, "Invalid base64 image data"),
    text: z.string()
        .min(1, "Text content is required")
        .max(50000, "Text content too large"), // Adjust limit as needed
    uid: z.string()
        .min(1, "Firebase user ID is required"),
    botToken: z.string()
        .min(32, "Bot token must be at least 32 characters")
        .max(128, "Bot token too long")
});
/**
 * Document status enum - tracks the main processing stages
 */
export const documentStatusEnum = z.enum([
    'processing', // Initial state during analysis
    'ready_for_correction', // Analysis complete, ready for user corrections
    'completed' // Final corrections applied
]);
/**
 * Schema for Claude's structural analysis response
 */
export const structuralAnalysisSchema = z.array(z.object({
    position: z.number(),
    type: z.enum(["title", "subtitle", "heading", "paragraphStart"])
}));
/**
 * Schema for Claude's text verification response
 */
export const textVerificationSchema = z.object({
    hasDiscrepancies: z.boolean(),
    alternativeText: z.string().optional(), // Only included if hasDiscrepancies is true
    discrepancies: z.array(z.object({
        original: z.string(),
        suggested: z.string(),
        explanation: z.string()
    })).optional()
});
/**
 * Schema for document processing response
 */
export const documentProcessResponseSchema = z.object({
    success: z.boolean(),
    documentId: z.string(),
    text: z.string(), // Original LLMWhisperer text
    alternativeText: z.string().optional(), // Claude's version (if different)
    structuralAnalysis: structuralAnalysisSchema,
    status: documentStatusEnum
});
/**
 * Schema for bot token generation
 */
export const botTokenSchema = z.object({
    token: z.string().min(32),
    createdAt: z.date(),
    lastUsed: z.date().optional(),
    expiresAt: z.date().optional()
});
