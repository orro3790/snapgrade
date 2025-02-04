// File: src/lib/schemas/document.ts
import { z } from 'zod';

export const documentSchema = z.object({
  studentName: z.string().email(),
  className: z.string(),
  documentName: z.string(),
  documentBody: z.string(),
  userId: z.string(),
  status: z.enum(['staged', 'editing', 'completed']),
  sourceType: z.enum(['telegram', 'manual']),
});


export type Document = z.infer<typeof documentSchema>;
