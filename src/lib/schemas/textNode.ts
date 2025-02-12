import { z } from 'zod';

export const nodeTypeEnum = z.enum([
    'normal',
    'correction',
    'addition',
    'deletion',
    'empty',
    'spacer'
]);

export const spacerSubtypeEnum = z.enum([
    'newline',
    'tab',
    'doubletab',
    'list',
    'nestedlist'
]);

export const nodeMetadataSchema = z.object({
    position: z.number(),
    isPunctuation: z.boolean(),
    isWhitespace: z.boolean(),
    startIndex: z.number(),
    endIndex: z.number()
});

export const correctionDataSchema = z.object({
    correctedText: z.string(),
    pattern: z.string(),
    explanation: z.string().optional(),
    teacherNotes: z.string().optional(),
    relatedCorrections: z.array(z.string()).optional()
});

export const nodeSchema = z.object({
    id: z.string(),
    text: z.string(),
    type: nodeTypeEnum,
    correctionData: correctionDataSchema.optional(),
    spacerData: z.object({
        subtype: spacerSubtypeEnum
    }).optional(),
    metadata: nodeMetadataSchema
});

export type Node = z.infer<typeof nodeSchema>;
export type NodeType = z.infer<typeof nodeTypeEnum>;
export type SpacerSubtype = z.infer<typeof spacerSubtypeEnum>;
export type NodeMetadata = z.infer<typeof nodeMetadataSchema>;
export type CorrectionData = z.infer<typeof correctionDataSchema>;

// Compressed format for serialization
export type CompressedNode = {
    i: string;  // id
    t: NodeType;  // type
    x?: string; // text
    s?: SpacerSubtype; // spacer subtype
    c?: {       // correction data
        f: string;  // fixed text
        p: string;  // pattern
        e?: string; // explanation
    };
};