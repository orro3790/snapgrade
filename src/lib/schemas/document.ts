// File: src/lib/schemas/document.ts
import { z } from 'zod';

/**
 * Base document schema with common fields
 */
const baseDocumentSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  documentName: z.string(),
  documentBody: z.string(),
  userId: z.string(),
  sourceType: z.enum(['manual', 'llmwhisperer']),
  id: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  
  // Document structure fields
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  
  // Source metadata
  sourceMetadata: z.object({
    rawOcrOutput: z.string().optional()
  }).optional()
});

/**
 * Staged document schema - requires classId and studentId
 */
const stagedDocumentSchema = baseDocumentSchema.extend({
  status: z.literal('staged'),
  classId: z.string({
    required_error: "Class selection is required for staged documents"
  }),
  className: z.string({
    required_error: "Class name is required for staged documents"
  })
});

/**
 * Editing document schema
 */
const editingDocumentSchema = baseDocumentSchema.extend({
  status: z.literal('editing'),
  classId: z.string().optional(),
  className: z.string().optional()
});

/**
 * Completed document schema
 */
const completedDocumentSchema = baseDocumentSchema.extend({
  status: z.literal('completed'),
  classId: z.string().optional(),
  className: z.string().optional()
});

/**
 * Combined document schema using discriminated union
 */
export const documentSchema = z.discriminatedUnion('status', [
  stagedDocumentSchema,
  editingDocumentSchema,
  completedDocumentSchema
]);

/**
 * Response schemas for each document status
 */
const stagedDocumentResponseSchema = stagedDocumentSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const editingDocumentResponseSchema = editingDocumentSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const completedDocumentResponseSchema = completedDocumentSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Combined response schema using discriminated union
 */
export const documentResponseSchema = z.discriminatedUnion('status', [
  stagedDocumentResponseSchema,
  editingDocumentResponseSchema,
  completedDocumentResponseSchema
]);

/**
 * Schema for API errors
 */
export const documentErrorSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  code: z.string().optional(),
  errors: z.array(z.unknown()).optional()
});

export type Document = z.infer<typeof documentSchema>;
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
export type DocumentError = z.infer<typeof documentErrorSchema>;

/**
 * Schema for creating a new staged document
 */
export const createStagedDocumentSchema = z.object({
  studentId: z.string({
    required_error: "Student selection is required"
  }),
  studentName: z.string(),
  classId: z.string({
    required_error: "Class selection is required"
  }),
  className: z.string(),
  documentName: z.string().min(1, "Document title is required"),
  documentBody: z.string().min(1, "Document content is required"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  sourceType: z.enum(['manual', 'llmwhisperer']).default('llmwhisperer'),
  status: z.literal('staged').default('staged')
});

/**
 * Schema for creating a new document (non-staged)
 */
export const createDocumentSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  className: z.string().optional(),
  documentName: z.string().min(1, "Document title is required"),
  documentBody: z.string().min(1, "Document content is required"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional()
});

export type CreateStagedDocument = z.infer<typeof createStagedDocumentSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
