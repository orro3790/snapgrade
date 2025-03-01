import { z } from 'zod';

/**
 * Schema for managing document upload sessions
 * Tracks multi-page document uploads and their status
 *
 * @property {string} sessionId - Unique identifier for the session
 * @property {string} userId - Discord user ID who initiated the session
 * @property {string} status - Current status of the session
 * @property {number} pageCount - Expected total number of pages
 * @property {number} receivedPages - Number of pages received so far
 * @property {Array} pageOrder - Array of pending image IDs in order
 * @property {Date} createdAt - When the session was created
 * @property {Date} expiresAt - When the session will timeout
 * @property {Date} completedAt - When all pages were received
 * @property {string} error - Error message if session failed
 * @property {number} totalSize - Total size of all files in bytes (for 10 MiB limit)
 * @property {object} metadata - Optional metadata for the session (class and student assignment)
 * @property {object} processingProgress - Detailed progress tracking for processing stage
 */

/**
 * Schema for document session metadata
 */
export const documentSessionMetadataSchema = z.object({
    classId: z.string().optional(),
    studentId: z.string().optional(),
    assignedAt: z.date().optional(),
});

export type DocumentSessionMetadata = z.infer<typeof documentSessionMetadataSchema>;

/**
 * Enum for processing stages
 */
export const ProcessingStageEnum = {
    QUEUED: 'queued',
    OCR_PROCESSING: 'ocr_processing',
    STRUCTURE_ANALYSIS: 'structure_analysis',
    DOCUMENT_CREATION: 'document_creation'
} as const;

/**
 * Schema for processing progress tracking
 */
export const processingProgressSchema = z.object({
    current: z.number(),
    total: z.number(),
    stage: z.enum([
        ProcessingStageEnum.QUEUED,
        ProcessingStageEnum.OCR_PROCESSING,
        ProcessingStageEnum.STRUCTURE_ANALYSIS,
        ProcessingStageEnum.DOCUMENT_CREATION
    ]),
    startedAt: z.date(),
    estimatedTimeRemaining: z.number().optional(),
    pageProcessingTimes: z.array(z.number()).optional() // Track processing times for estimation
});

export type ProcessingProgress = z.infer<typeof processingProgressSchema>;

export const documentSessionSchema = z.object({
    sessionId: z.string(),
    userId: z.string(),
    status: z.enum(['COLLECTING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    pageCount: z.number().min(1).max(10),
    receivedPages: z.number().default(0),
    pageOrder: z.array(z.string()),  // Array of pending image IDs in order
    createdAt: z.date(),
    expiresAt: z.date(),
    completedAt: z.date().optional(),
    error: z.string().optional(),
    totalSize: z.number()  // Track total size for 10 MiB limit
        .max(10 * 1024 * 1024, "Total file size cannot exceed 10 MiB"),
    metadata: documentSessionMetadataSchema.optional(),
    processingProgress: processingProgressSchema.optional(),
    textQuality: z.enum([
        'printed',
        'handwriting'
    ]).optional(),
    processingStartedAt: z.date().optional(),
    processingCompletedAt: z.date().optional(),
    documentId: z.string().optional()
});

export type DocumentSession = z.infer<typeof documentSessionSchema>;

/**
 * Helper type for document session updates
 */
export type DocumentSessionUpdate = Partial<DocumentSession>;

/**
 * Validation for supported image types
 */
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
] as const;

export const isValidImageType = (type: string): boolean => 
    SUPPORTED_IMAGE_TYPES.includes(type as typeof SUPPORTED_IMAGE_TYPES[number]);