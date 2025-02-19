// File: src/lib/schemas/class.ts
import { z } from 'zod';
/**
 * Class schema
 * @property {string} name - class name
 * @property {string} description - class description
 * @property {string} students - array of student ids
 * @property {object} metadata - class metadata including id, createdAt, updatedAt
 * @property {string} [photoUrl] - Optional URL to class photo
 */
export const classSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    students: z.array(z.string()),
    photoUrl: z.string().optional(),
    id: z.string(),
    status: z.enum(['active', 'archived']).default('active'),
    metadata: z.object({
        createdAt: z.date(),
        updatedAt: z.date(),
    }),
});
