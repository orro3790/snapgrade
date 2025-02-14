import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';
import { documentSchema, DocumentStatus, type Document } from '$lib/schemas/document';
import { z } from 'zod';

// Define strict request body schema
const createDocumentRequestSchema = z.object({
  documentBody: z.string().min(1, "Document content is required"),
  image: z.object({
    base64: z.string(),
    mimeType: z.string()
  }),
  sourceMetadata: z.object({
    rawOcrOutput: z.string().optional(),
    telegramMessageId: z.string().optional(),
    telegramChatId: z.string().optional(),
    telegramFileId: z.string().optional(),
    llmProcessed: z.boolean().default(false),
    llmProcessedAt: z.date().optional()
  }).optional().default({
    llmProcessed: false
  })
}).required();

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const { documentBody, sourceMetadata } = createDocumentRequestSchema.parse(rawBody);

    // Generate document ID
    const docRef = adminDb.collection('documents').doc();
    const now = new Date();

    // Create document data with all required fields
    const documentData: Document = {
      id: docRef.id,
      userId: locals.uid as string,
      studentId: 'Unassigned',
      studentName: 'Unassigned Student',
      classId: 'Unassigned',
      className: 'Unassigned',
      documentName: `Untitled - ${now.toLocaleDateString()}`,
      documentBody,
      sourceType: 'llmwhisperer',
      status: DocumentStatus.EDITING,
      createdAt: now,
      updatedAt: now,
      sourceMetadata
    };

    // Validate complete document data
    const validatedDocument = documentSchema.parse(documentData);

    // Create document in Firestore using generated ID
    await docRef.set(validatedDocument);

    return json({
      status: 'success',
      data: validatedDocument
    });

  } catch (error) {
    console.error('Error creating document:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return json({
        status: 'error',
        error: {
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          errors: error.errors
        }
      }, { status: 400 });
    }

    // Handle other errors
    return json({
      status: 'error',
      error: {
        message: 'Failed to create document',
        code: 'INTERNAL_ERROR'
      }
    }, { status: 500 });
  }
};