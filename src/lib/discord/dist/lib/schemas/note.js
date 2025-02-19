// File: src/lib/schemas/note.ts
import { z } from 'zod';
/**
 * Note schema
 * @property {string} name - note name
 * @property {string} body - note body
 * @property {string} studentId - student id
 * @property {string} classId - class id
 * @property {object} metadata - note metadata including id, createdAt, updatedAt
 */
export const noteSchema = z.object({
    name: z.string(),
    body: z.string().optional(),
    studentId: z.string(),
    classId: z.string(),
    id: z.string(),
    metadata: z.object({
        createdAt: z.date(),
        updatedAt: z.date(),
    }),
    photoUrl: z.string().optional(),
});
