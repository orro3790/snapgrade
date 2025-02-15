// File: src/lib/schemas/user.ts
import { z } from 'zod';

/**
 * User schema with support for Discord integration and class management
 * @property {string} name - User's email address
 * @property {string} id - Unique user identifier
 * @property {string[]} classes - Array of class IDs that the user teaches
 * @property {object} metadata - User metadata including account status and Discord info
 * @property {string} [photoUrl] - Optional URL to user's profile photo
 */
export const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  id: z.string(),
  classes: z.array(z.string()).default([]),
  metadata: z.object({
    accountStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  }),
  photoUrl: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
