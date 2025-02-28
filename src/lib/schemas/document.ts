// File: src/lib/schemas/document.ts
import { z } from 'zod';

/**
 * Document status enum
 */
export enum DocumentStatus {
  unedited = 'unedited',
  edited = 'edited',
  completed = 'completed'
}

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
  status: z.enum([DocumentStatus.unedited, DocumentStatus.edited, DocumentStatus.completed]),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Document structure fields
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  
  // Compressed nodes for TextEditor
  compressedNodes: z.string().optional(), // JSON string of compressed nodes
  
  // Source metadata
  sourceMetadata: z.object({
    rawOcrOutput: z.string().optional(),
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional(),
    llmProcessed: z.boolean().default(false), // Whether the document has been processed by the LLM upon first load
    llmProcessedAt: z.date().optional(), // When the document was processed by the LLM
  }).optional()
});

/**
 * Schema for creating a new document - used when receiving documents
 * from external sources or manual upload
 */
export const createDocumentSchema = z.object({
  studentId: z.string({
    required_error: "Student selection is required"
  }).default('Unassigned'),
  studentName: z.string().default('Unassigned Student'),
  classId: z.string({
    required_error: "Class selection is required"
  }).default('Unassigned'),
  className: z.string().default('Unassigned'),
  documentName: z.string().min(1, "Document title is required").default(() => `Untitled - ${new Date().toLocaleDateString()}`),
  documentBody: z.string().min(1, "Document content is required"),
  sourceType: z.enum(['manual', 'llmwhisperer']).default('llmwhisperer'),
  
  // Document structure fields
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headings: z.array(z.string()).optional(),
  
  // Compressed nodes for TextEditor
  compressedNodes: z.string().optional(), // JSON string of compressed nodes
  
  // Optional source metadata
  sourceMetadata: z.object({
    rawOcrOutput: z.string().optional(),
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional()
  }).optional(),
  
  // These fields will be added automatically by the server
  status: z.literal(DocumentStatus.unedited).default(DocumentStatus.unedited),
  createdAt: z.date().default(() => new Date()),
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

/**
 * Schema for document updates - used when updating class/student assignment
 */
export const documentUpdateSchema = z.object({
  documentId: z.string({
    required_error: "Document ID is required"
  }),
  classId: z.string({
    required_error: "Class selection is required"
  }),
  className: z.string({
    required_error: "Class name is required"
  }),
  studentId: z.string({
    required_error: "Student selection is required"
  }),
  studentName: z.string({
    required_error: "Student name is required"
  })
});

// Type exports
export type Document = z.infer<typeof documentSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type DocumentError = z.infer<typeof documentErrorSchema>;
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;
