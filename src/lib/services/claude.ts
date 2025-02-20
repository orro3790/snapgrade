import Anthropic from '@anthropic-ai/sdk';
import type { StructuralAnalysis, TextVerification } from '../schemas/documentProcessing';
import { structuralAnalysisSchema, textVerificationSchema } from '../schemas/documentProcessing';
import { anthropicMessageSchema, anthropicResponseSchema } from '../schemas/anthropic';

// Initialize client with environment variable
const client = new Anthropic();

/**
 * Analyzes document structure using Claude
 * @param text Raw text to analyze
 * @returns Structured analysis of the document
 * @throws Error if Claude API call fails or response parsing fails
 */
export const analyzeStructure = async (text: string): Promise<StructuralAnalysis> => {
    try {
        // Validate request message format
        const message = anthropicMessageSchema.parse({
            role: "user",
            content: `Analyze this text and identify its structural elements. For each element, provide its position (character index) and type (title, subtitle, heading, or paragraphStart).

Text to analyze:
${text}

Return the analysis as a JSON array where each object has:
- position: number (character index where the element starts)
- type: string (one of: "title", "subtitle", "heading", "paragraphStart")

Example response:
[
    {"position": 0, "type": "title"},
    {"position": 45, "type": "paragraphStart"},
    {"position": 120, "type": "heading"}
]`
        });

        const response = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [message]
        });

        // Validate response format
        const validatedResponse = anthropicResponseSchema.parse(response);
        const content = validatedResponse.content[0];

        // Parse and validate the structural analysis
        const parsedResponse = JSON.parse(content.text);
        return structuralAnalysisSchema.parse(parsedResponse);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Structure analysis failed: ${error.message}`);
        }
        throw new Error('Structure analysis failed with unknown error');
    }
};

/**
 * Verifies text accuracy and suggests improvements
 * @param text Text to verify
 * @returns Verification results with corrections
 * @throws Error if Claude API call fails or response parsing fails
 */
export const verifyText = async (text: string): Promise<TextVerification> => {
    try {
        // Validate request message format
        const message = anthropicMessageSchema.parse({
            role: "user",
            content: `Review this text for accuracy and suggest improvements. Look for potential OCR errors, grammatical issues, or other discrepancies.

Text to review:
${text}

Return the analysis as a JSON object with:
- hasDiscrepancies: boolean
- alternativeText: string (optional, only if significant changes needed)
- discrepancies: array of objects with:
  - original: string (the original text)
  - suggested: string (the suggested correction)
  - explanation: string (why this change is suggested)

Example response:
{
    "hasDiscrepancies": true,
    "alternativeText": "corrected version of full text",
    "discrepancies": [
        {
            "original": "teh",
            "suggested": "the",
            "explanation": "Corrected common misspelling"
        }
    ]
}`
        });

        const response = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [message]
        });

        // Validate response format
        const validatedResponse = anthropicResponseSchema.parse(response);
        const content = validatedResponse.content[0];

        // Parse and validate the text verification
        const parsedResponse = JSON.parse(content.text);
        return textVerificationSchema.parse(parsedResponse);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Text verification failed: ${error.message}`);
        }
        throw new Error('Text verification failed with unknown error');
    }
};

/**
 * Retries an async function with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param baseDelay Base delay in milliseconds
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (attempt === maxAttempts) break;
            
            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

// Export retry-wrapped versions of the functions
export const analyzeStructureWithRetry = (text: string) => 
    withRetry(() => analyzeStructure(text));

export const verifyTextWithRetry = (text: string) =>
    withRetry(() => verifyText(text));