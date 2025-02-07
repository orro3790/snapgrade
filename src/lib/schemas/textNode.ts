import { z } from 'zod';

export const nodeTypeEnum = z.enum([
    'normal',
    'correction',
    'addition',
    'deletion',
    'empty'
]);

export const nodeMetadataSchema = z.object({
    position: z.number(),
    lineNumber: z.number(),
    isPunctuation: z.boolean(),
    isWhitespace: z.boolean(),
    startIndex: z.number(),
    endIndex: z.number()
});

export const correctionDataSchema = z.object({
    originalText: z.string(),
    correctedText: z.string(),
    pattern: z.string(),
    explanation: z.string().optional(),
    teacherNotes: z.string().optional()
});

export const nodeSchema = z.object({
    id: z.string(),
    text: z.string(),
    type: nodeTypeEnum,
    correctionData: correctionDataSchema.optional(),
    metadata: nodeMetadataSchema,
    hasNextCorrection: z.boolean().optional(),
    mispunctuation: z.boolean().optional()
});

export type Node = z.infer<typeof nodeSchema>;
export type NodeType = z.infer<typeof nodeTypeEnum>;
export type NodeMetadata = z.infer<typeof nodeMetadataSchema>;
export type CorrectionData = z.infer<typeof correctionDataSchema>;
