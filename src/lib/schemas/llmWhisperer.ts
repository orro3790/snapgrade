import { z } from 'zod';

/**
 * Schema for LLM Whisperer extraction result
 */
export const whisperExtractionSchema = z.object({
  result_text: z.string(),
}).catchall(z.unknown());

/**
 * Schema for LLM Whisperer result
 */
export const whisperResultSchema = z.object({
  whisper_hash: z.string(),
  extraction: whisperExtractionSchema,
}).catchall(z.unknown());

/**
 * Schema for LLM Whisperer status result
 */
export const whisperStatusSchema = z.object({
  status: z.string(),
}).catchall(z.unknown());

/**
 * Schema for LLM Whisperer client options
 */
export const whisperClientOptionsSchema = z.object({
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  loggingLevel: z.enum(['error', 'warn', 'info', 'debug']).optional(),
});

/**
 * Schema for LLM Whisperer processing options
 */
export const whisperOptionsSchema = z.object({
  filePath: z.string().optional(),
  url: z.string().optional(),
  mode: z.enum(['native_text', 'low_cost', 'high_quality', 'form']).optional(),
  outputMode: z.enum(['layout_preserving', 'text']).optional(),
  waitForCompletion: z.boolean().optional(),
  waitTimeout: z.number().optional(),
  pagesToExtract: z.string().optional(),
  pageSeparator: z.string().optional(),
});

// Export types inferred from schemas
export type WhisperExtraction = z.infer<typeof whisperExtractionSchema>;
export type WhisperResult = z.infer<typeof whisperResultSchema>;
export type WhisperStatus = z.infer<typeof whisperStatusSchema>;
export type WhisperClientOptions = z.infer<typeof whisperClientOptionsSchema>;
export type WhisperOptions = z.infer<typeof whisperOptionsSchema>;