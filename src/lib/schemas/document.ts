// File: src/lib/schemas/document.ts
import { z } from 'zod';

/**
 * Document status enum
 */
export const DocumentStatus = {
  STAGED: 'staged',
  EDITING: 'editing',
  COMPLETED: 'completed'
} as const;

/**
 * Document schema with status as an enum field
 */
export const documentSchema = z.object({
  // Required fields
  id: z.string(),
  userId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  classId: z.string({
    required_error: "Class selection is required"
  }),
  className: z.string({
    required_error: "Class name is required"
  }),
  documentName: z.string(),
  documentBody: z.string(),
  sourceType: z.enum(['manual', 'llmwhisperer']),
  status: z.enum([DocumentStatus.STAGED, DocumentStatus.EDITING, DocumentStatus.COMPLETED]),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Document structure fields
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  
  // Source metadata
  sourceMetadata: z.object({
    rawOcrOutput: z.string().optional(),
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional()
  }).optional()
});

/**
 * Schema for creating a new document - used when receiving documents
 * from external sources or manual upload
 */
export const createDocumentSchema = z.object({
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
  sourceType: z.enum(['manual', 'llmwhisperer']).default('llmwhisperer'),
  
  // Document structure fields
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  
  // Optional source metadata
  sourceMetadata: z.object({
    rawOcrOutput: z.string().optional(),
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional()
  }).optional(),
  
  // These fields will be added automatically by the server
  status: z.literal(DocumentStatus.STAGED).default(DocumentStatus.STAGED),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

/**
 * Schema for updating document status and content
 */
export const updateDocumentSchema = z.object({
  documentBody: z.string().min(1, "Document content is required"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  status: z.enum([DocumentStatus.STAGED, DocumentStatus.EDITING, DocumentStatus.COMPLETED]),
  updatedAt: z.date().default(() => new Date())
});

/**
 * Schema for API errors
 */
export const documentErrorSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  code: z.string().optional(),
  errors: z.array(z.unknown()).optional()
});

// Type exports
export type Document = z.infer<typeof documentSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type DocumentError = z.infer<typeof documentErrorSchema>;
