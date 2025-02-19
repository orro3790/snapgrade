// File: src/lib/schemas/student.ts
import { z } from 'zod';
/**
 * Student schema
 * @property {string} name - student name
 * @property {string} description - student description
 * @property {string} classId - class id
 * @property {object} metadata - student metadata including id, createdAt, updatedAt
 * @property {string} [photoUrl] - Optional URL to student photo
 */
export const studentSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    classId: z.string(),
    notes: z.array(z.string()),
    photoUrl: z.string().optional(),
    status: z.enum(['active', 'archived']).default('active'),
    id: z.string(),
    metadata: z.object({
        createdAt: z.date(),
        updatedAt: z.date(),
    }),
});
