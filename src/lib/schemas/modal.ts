// src/lib/schemas/modal.ts
import { z } from 'zod';

/**
 * Schema for modal confirmation state
 */
export const modalConfirmationSchema = z.object({
    isVisible: z.boolean(),
    message: z.string().optional(),
    data: z.record(z.unknown()).optional()
});

/**
 * Schema for modal types with their associated states
 */
export const modalStateSchema = z.object({
    type: z.enum([
        'login',
        'keyboard',
        'upload',
        'classManager',
        'stagingArea',
        'documentLoad'
    ]),
    confirmation: modalConfirmationSchema.optional(),
    data: z.record(z.unknown()).optional()
});

// Type exports
export type ModalConfirmation = z.infer<typeof modalConfirmationSchema>;
export type ModalState = z.infer<typeof modalStateSchema> | null;