import { z } from 'zod';

// Remove the manual NodeSchemaType definition and directly export the schema
const nodeSchema: z.ZodType<{
    id: string;
    text: string;
    type: z.infer<typeof nodeTypeEnum>;
    correctionData?: z.infer<typeof correctionDataSchema>;
    structuralRole?: z.infer<typeof structuralRole>;
    spacerData?: {
        subtype: z.infer<typeof spacerSubtypeEnum>;
    };
    metadata: z.infer<typeof nodeMetadataSchema>;
}> = z.lazy(() => z.object({
    id: z.string(),
    text: z.string(),
    type: nodeTypeEnum,
    correctionData: correctionDataSchema.optional(),
    structuralRole: structuralRole.optional(),
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

// Used to determine the type of space needed
export const spacerSubtypeEnum = z.enum([
    'lineBreak',       // Forces content to next line (fills entire row width)
    'indent',          // Creates indentation at start of text
    'alignment'        // Used for text alignment (flexible width)
]);

// Used to determine essay structures
export const structuralRole = z.enum([
    'title',
    'subtitle',
    'heading',
    'paragraph',
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
export type StructuralRole = z.infer<typeof structuralRole>;
export type NodeMetadata = z.infer<typeof nodeMetadataSchema>;
export type CorrectionData = z.infer<typeof correctionDataSchema>;

// Compressed format for serialization
export type CompressedNode = {
    i: string;  // id
    t: NodeType;  // type
    x?: string; // text
    s?: SpacerSubtype; // spacer subtype
    r?: StructuralRole; // structural role
    c?: {       // correction data
        f: string;  // fixed text (correctedText)
        p: string;  // pattern
        e?: string; // explanation
        n?: string; // teacherNotes
        r?: string[]; // relatedCorrections
    };
    m: {        // metadata
        p: number;   // position
        w: boolean;  // isWhitespace
        u: boolean;  // isPunctuation
        s: number;   // startIndex
        e: number;   // endIndex
        g?: CompressedNode[]; // groupedNodes
    };
};
