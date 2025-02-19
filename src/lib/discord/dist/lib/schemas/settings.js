// File: src/lib/schemas/settings.ts
import { z } from 'zod';
export const settingsSchema = z.object({
    theme: z.enum(['dark', 'light']),
    userId: z.string(),
});
