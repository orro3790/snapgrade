// File: src/lib/schemas/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().email(),
  id: z.string(),
  metadata: z.object({
    accountStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  }),
  photoUrl: z.string().optional(),
});


export type User = z.infer<typeof userSchema>;
