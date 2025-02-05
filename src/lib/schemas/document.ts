// File: src/lib/schemas/document.ts
import { z } from 'zod';

/**
 * Document schema supporting both web and Telegram sources
 * @property {string} studentName - Student's email address
 * @property {string} className - Name of the class
 * @property {string} documentName - Name/title of the document
 * @property {string} documentBody - Main content of the document
 * @property {string} userId - ID of the user who created/owns the document
 * @property {'staged' | 'editing' | 'completed'} status - Current status of the document
 * @property {'telegram' | 'manual'} sourceType - How the document was created
 * @property {string} [id] - Firestore document ID
 * @property {string} createdAt - ISO datetime string of creation
 * @property {string} updatedAt - ISO datetime string of last update
 */
export const documentSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  className: z.string().optional(),
  documentName: z.string(),
  documentBody: z.string(),
  userId: z.string(),
  status: z.enum(['staged', 'editing', 'completed']),
  sourceType: z.enum(['telegram', 'manual']),
  id: z.string(),
  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
  sourceMetadata: z.object({
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional(),
  }).optional()
});

/**
 * Schema for API responses, extends document schema with required fields
 */
export const documentResponseSchema = documentSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
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

export type Document = z.infer<typeof documentSchema>;
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
export type DocumentError = z.infer<typeof documentErrorSchema>;

export const createDocumentSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  className: z.string().optional(),
  documentName: z.string().min(1, "Document title is required"),
  documentBody: z.string().min(1, "Document content is required")
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;
