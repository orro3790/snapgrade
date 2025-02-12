import { z } from 'zod';

// Forward declaration to handle circular reference
type NodeSchemaType = z.ZodType<{
    id: string;
    text: string;
    type: z.infer<typeof nodeTypeEnum>;
    correctionData?: z.infer<typeof correctionDataSchema>;
    spacerData?: { subtype: z.infer<typeof spacerSubtypeEnum> };
    metadata: z.infer<typeof nodeMetadataSchema>;
}>;
const nodeSchema: NodeSchemaType = z.lazy(() => z.object({
    id: z.string(),
    text: z.string(),
    type: nodeTypeEnum,
    correctionData: correctionDataSchema.optional(),
    spacerData: z.object({
        subtype: spacerSubtypeEnum
    }).optional(),
    metadata: nodeMetadataSchema
}));

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

export const nodeMetadataSchema = z.lazy(() => z.object({
    position: z.number(),
    isPunctuation: z.boolean(),
    isWhitespace: z.boolean(),
    startIndex: z.number(),
    endIndex: z.number(),
    groupedNodes: z.array(z.lazy(() => nodeSchema)).optional()
}));

export const correctionDataSchema = z.object({
    correctedText: z.string(),
    pattern: z.string(),
    explanation: z.string().optional(),
    teacherNotes: z.string().optional(),
    relatedCorrections: z.array(z.string()).optional()
});

export { nodeSchema };

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
