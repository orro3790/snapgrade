import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeStructure, verifyText } from '../../../lib/services/claude';
import {
    structuralAnalysisSchema,
    textVerificationSchema,
    type StructuralAnalysis,
    type TextVerification
} from '../../../lib/schemas/documentProcessing';
import {
    anthropicMessageSchema,
    anthropicResponseSchema,
    type AnthropicMessage,
    type AnthropicResponse
} from '../../../lib/schemas/anthropic';

// Mock Anthropic client
const mockAnthropicCreate = vi.fn().mockImplementation(async ({ messages }: { messages: AnthropicMessage[] }): Promise<AnthropicResponse> => {
    const message = messages[0];
    // Validate message format
    anthropicMessageSchema.parse(message);

    if (message.content.includes('Analyze this text')) {
        const structuralAnalysis: StructuralAnalysis = [
            { position: 0, type: "title" },
            { position: 45, type: "paragraphStart" }
        ];
        
        const response = {
            content: [{
                text: JSON.stringify(structuralAnalysis)
            }]
        };
        
        // Validate response format
        return anthropicResponseSchema.parse(response);
    }
    
    if (message.content.includes('Review this text')) {
        const verification: TextVerification = {
            hasDiscrepancies: true,
            alternativeText: "corrected text",
            discrepancies: [{
                original: "teh",
                suggested: "the",
                explanation: "Common misspelling"
            }]
        };
        
        const response = {
            content: [{
                text: JSON.stringify(verification)
            }]
        };
        
        // Validate response format
        return anthropicResponseSchema.parse(response);
    }
    
    throw new Error('Unexpected message content');
});

vi.mock('@anthropic-ai/sdk', () => ({
    default: class MockAnthropic {
        public messages = {
            create: mockAnthropicCreate
        };
    }
}));

describe('Claude Service', () => {
    const sampleText = 'This is a test document.\n\nIt has multiple paragraphs.';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('analyzeStructure', () => {
        it('should analyze document structure correctly', async () => {
            const result = await analyzeStructure(sampleText);

            // Verify the result matches our schema
            const validatedResult = structuralAnalysisSchema.parse(result);
            expect(validatedResult).toEqual([
                { position: 0, type: "title" },
                { position: 45, type: "paragraphStart" }
            ]);
        });

        it('should handle empty text', async () => {
            await expect(analyzeStructure('')).resolves.toBeDefined();
        });

        it('should handle very long text', async () => {
            const longText = 'a'.repeat(10000);
            await expect(analyzeStructure(longText)).resolves.toBeDefined();
        });

        it('should handle special characters', async () => {
            const specialText = '🚀 Special characters & symbols!';
            await expect(analyzeStructure(specialText)).resolves.toBeDefined();
        });
    });

    describe('verifyText', () => {
        it('should verify text correctly', async () => {
            const result = await verifyText(sampleText);

            // Verify the result matches our schema
            const validatedResult = textVerificationSchema.parse(result);
            expect(validatedResult).toEqual({
                hasDiscrepancies: true,
                alternativeText: "corrected text",
                discrepancies: [{
                    original: "teh",
                    suggested: "the",
                    explanation: "Common misspelling"
                }]
            });
        });

        it('should handle empty text', async () => {
            await expect(verifyText('')).resolves.toBeDefined();
        });

        it('should handle very long text', async () => {
            const longText = 'a'.repeat(10000);
            await expect(verifyText(longText)).resolves.toBeDefined();
        });

        it('should handle special characters', async () => {
            const specialText = '🚀 Special characters & symbols!';
            await expect(verifyText(specialText)).resolves.toBeDefined();
        });
    });

    describe('Error handling', () => {
        it('should handle API errors gracefully', async () => {
            // Mock API error
            mockAnthropicCreate.mockRejectedValueOnce(new Error('API Error'));
            
            await expect(analyzeStructure(sampleText))
                .rejects
                .toThrow('Structure analysis failed: API Error');
        });

        it('should handle invalid JSON responses', async () => {
            // Mock invalid JSON response
            const invalidResponse = anthropicResponseSchema.parse({
                content: [{
                    text: JSON.stringify({
                        hasDiscrepancies: false,
                        // Missing required fields to trigger schema validation error
                        discrepancies: [{ invalid: 'response' }]
                    })
                }]
            });
            mockAnthropicCreate.mockResolvedValueOnce(invalidResponse);

            await expect(verifyText(sampleText))
                .rejects
                .toThrow();
        });
    });
});