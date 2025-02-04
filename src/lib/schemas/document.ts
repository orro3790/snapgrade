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
  studentName: z.string().email(),
  className: z.string(),
  documentName: z.string(),
  documentBody: z.string(),
  userId: z.string(),
  status: z.enum(['staged', 'editing', 'completed']),
  sourceType: z.enum(['telegram', 'manual']),
  id: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  sourceMetadata: z.object({
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional(),
    processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional()
  }).optional()
});

/**
 * Schema for API responses, extends document schema with required fields
 */
export const documentResponseSchema = documentSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
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
