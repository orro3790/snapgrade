import { z } from 'zod';
// Remove the manual NodeSchemaType definition and directly export the schema
const nodeSchema = z.lazy(() => z.object({
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
    'newline',
    'indent',
]);
// Used to determine essay structures
export const structuralRole = z.enum([
    'title',
    'subtitle',
    'heading',
    'paragraphStart',
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
