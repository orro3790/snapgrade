import { z } from 'zod';

/**
 * Schema for activity filtering
 */
export const activityFilterSchema = z.object({
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).optional(),
  status: z.enum(['all', 'collecting', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  limit: z.number().int().positive().default(10)
});

/**
 * Schema for activity data
 */
export const activitySchema = z.object({
  filter: activityFilterSchema.optional(),
  sessionId: z.string().optional()
});

export type ActivityFilter = z.infer<typeof activityFilterSchema>;
export type Activity = z.infer<typeof activitySchema>;