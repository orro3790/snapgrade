import Anthropic from '@anthropic-ai/sdk';
import type { StructuralAnalysis, TextVerification } from '../schemas/documentProcessing';
import { structuralAnalysisSchema, textVerificationSchema } from '../schemas/documentProcessing';
import { anthropicResponseSchema, type AnthropicToolUse } from '../schemas/anthropic';
import type { CompressedNode } from '../schemas/textNode';

// Initialize client with API key
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Maximum chunk size for text processing (approximately 4000 tokens)
const MAX_CHUNK_SIZE = 4000;

/**
 * Analyzes document structure using Claude with tool use
 * @param text Raw text to analyze
 * @returns Structured analysis of the document
 * @throws Error if Claude API call fails or response parsing fails
 */
export const analyzeStructure = async (text: string): Promise<{
    structuralAnalysis: StructuralAnalysis;
    compressedNodes?: string;
}> => {
    try {
        const response = await client.messages.create({
            model: "claude-3-7-sonnet-20250219", // Upgraded to Claude 3.7 Sonnet
            max_tokens: 20000, // Increased token limit
            system: "You are a document structure analyzer that identifies structural elements in text and generates compressed TextNodes for the editor. Be precise and thorough in your analysis. NEVER truncate your response, even for large documents. If the document is too large, focus on providing accurate structural analysis for the content you can process. IMPORTANT: Do not create spacer nodes for regular whitespace between words or for line breaks within the same paragraph - only create spacer nodes for specific formatting purposes.",
            messages: [{
                role: "user",
                content: `Analyze this text and identify its structural elements. Also generate compressed TextNodes for the editor:

${text}

For the compressed nodes, create a JSON array where each node uses the compact format:
{
  "i": "unique-id", // id
  "t": "normal", // type (normal, spacer, correction)
  "x": "word", // text (optional for spacers)
  "s": "lineBreak", // spacer subtype (optional)
  "r": "title", // structural role (optional)
  "m": { // metadata
    "p": 0, // position
    "w": false, // isWhitespace
    "u": false, // isPunctuation
    "s": 0, // startIndex
    "e": 0 // endIndex
  }
}

IMPORTANT PUNCTUATION HANDLING:
1. Create separate text nodes for these punctuation marks:
   - Periods (.)
   - Commas (,)
   - Exclamation marks (!)
   - Question marks (?)
   - Colons (:)
   - Semicolons (;)
2. For these punctuation nodes:
   - Set "t": "normal" (type normal)
   - Set "m": { "u": true } (isPunctuation: true)
   - Each punctuation mark should be its own separate node
3. Do NOT create separate nodes for:
   - Apostrophes within words (e.g., "don't" is one node)
   - Hyphens within words (e.g., "well-known" is one node)
   - Any other punctuation that's part of a word

Example of correct punctuation handling:
- For the text "Hello, world!" create three nodes:
  1. { "x": "Hello", "t": "normal", "m": { "u": false, ... } }
  2. { "x": ",", "t": "normal", "m": { "u": true, ... } }
  3. { "x": "world", "t": "normal", "m": { "u": false, ... } }
  4. { "x": "!", "t": "normal", "m": { "u": true, ... } }

IMPORTANT SPACER RULES: DO NOT create spacer nodes for:
1. Regular whitespace between words
2. Line breaks within the same paragraph
3. Large gaps between words mid-sentence

Only create spacer nodes for:
1. Line breaks (with subtype "lineBreak") - forces content to the next line by filling the entire row width
2. Indentation (with subtype "indent") - creates indentation at the start of text

IMPORTANT: For EVERY paragraph, including the very first paragraph in the document:
1. Create a line_break spacer node (with subtype "lineBreak")
2. Followed by an indent spacer node (with subtype "indent")

This means even the first paragraph should have these two spacer nodes before its content begins.

Example of correct paragraph handling:
- For a document starting with "This is paragraph one."
  The nodes should be in this order:
  1. { "t": "spacer", "s": "lineBreak", "m": { ... } }  // First line break
  2. { "t": "spacer", "s": "indent", "m": { ... } } // First indentation
  3. { "x": "This", "t": "normal", "m": { ... } }
  4. { "x": "is", "t": "normal", "m": { ... } }
  ...

Regular spaces between words should be handled by CSS spacing in the UI, not as separate nodes.

It is CRITICAL that you return the complete compressed nodes array without truncation. If the document is too large, use the most efficient compression possible.`
            }],
            tools: [{
                name: "document_structure_analyzer",
                description: "Analyzes the structural elements of text and generates compressed TextNodes",
                input_schema: {
                    type: "object",
                    properties: {
                        elements: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: {
                                        type: "string",
                                        enum: ["title", "subtitle", "heading", "paragraph"],
                                        description: "The type of structural element"
                                    },
                                    position: {
                                        type: "number",
                                        description: "Character index where the element starts"
                                    }
                                },
                                required: ["type", "position"]
                            }
                        },
                        compressedNodes: {
                            type: "string",
                            description: "JSON string of compressed TextNodes for the editor"
                        }
                    },
                    required: ["elements"]
                }
            }],
            tool_choice: {
                type: "tool",
                name: "document_structure_analyzer"
            }
        });

        // Validate response format
        const validatedResponse = anthropicResponseSchema.parse(response);
        
        // Extract the tool use response
        const toolUse = validatedResponse.content.find(item =>
            'type' in item && item.type === 'tool_use'
        ) as AnthropicToolUse | undefined;
        
        if (!toolUse || !('input' in toolUse) || !('elements' in toolUse.input)) {
            // Fallback to text parsing if tool use response is not found
            const textContent = validatedResponse.content.find(item =>
                'type' in item && item.type === 'text' && 'text' in item
            );
            
            if (textContent && 'text' in textContent) {
                try {
                    // Try to extract JSON from text response
                    const jsonMatch = textContent.text.match(/\[\s*{[\s\S]*}\s*\]/);
                    if (jsonMatch) {
                        const parsedResponse = JSON.parse(jsonMatch[0]);
                        return {
                            structuralAnalysis: structuralAnalysisSchema.parse(parsedResponse)
                        };
                    }
                } catch (parseError) {
                    console.error('Failed to parse text as JSON:', parseError);
                }
            }
            
            throw new Error('No valid tool use response received from Claude');
        }

        // Extract the structural analysis and compressed nodes
        const structuralAnalysis = structuralAnalysisSchema.parse(toolUse.input.elements);
        const compressedNodes = toolUse.input.compressedNodes as string | undefined;
        
        return {
            structuralAnalysis,
            compressedNodes
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Structure analysis failed: ${error.message}`);
        }
        throw new Error('Structure analysis failed with unknown error');
    }
};

/**
 * Splits text into manageable chunks for processing
 * @param text Text to split
 * @param maxChunkSize Maximum size of each chunk
 * @returns Array of text chunks
 */
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    
    // Try to split at paragraph boundaries
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed the chunk size
        if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

/**
 * Adjusts node positions based on chunk offset
 * @param nodes Array of compressed nodes
 * @param offset Position offset to add
 * @returns Adjusted nodes
 */
function adjustNodePositions(nodes: CompressedNode[], offset: number): CompressedNode[] {
    return nodes.map(node => ({
        ...node,
        m: {
            ...node.m,
            p: node.m.p + offset,
            s: node.m.s + offset,
            e: node.m.e + offset
        }
    }));
}

/**
 * Adjusts structural element positions based on chunk offset
 * @param elements Array of structural elements
 * @param offset Position offset to add
 * @returns Adjusted elements
 */
function adjustElementPositions(elements: StructuralAnalysis, offset: number): StructuralAnalysis {
    return elements.map(element => ({
        ...element,
        position: element.position + offset
    }));
}

/**
 * Analyzes document structure in chunks for large documents
 * @param text Text to analyze
 * @returns Structural analysis and compressed nodes
 */
export const analyzeStructureInChunks = async (text: string): Promise<{
    structuralAnalysis: StructuralAnalysis;
    compressedNodes?: string;
}> => {
    // For small texts, use the regular method
    if (text.length <= MAX_CHUNK_SIZE) {
        return analyzeStructure(text);
    }
    
    // Split text into manageable chunks
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    
    let allNodes: CompressedNode[] = [];
    let structuralElements: StructuralAnalysis = [];
    let position = 0;
    
    // Process each chunk
    for (const chunk of chunks) {
        const result = await analyzeStructure(chunk);
        
        // Parse nodes and adjust positions
        const chunkNodes = JSON.parse(result.compressedNodes || '[]') as CompressedNode[];
        const adjustedNodes = adjustNodePositions(chunkNodes, position);
        
        // Adjust structural elements positions
        const adjustedElements = adjustElementPositions(
            result.structuralAnalysis,
            position
        );
        
        // Accumulate results
        allNodes = [...allNodes, ...adjustedNodes];
        structuralElements = [...structuralElements, ...adjustedElements];
        
        // Update position for next chunk
        position += chunk.length;
    }
    
    // Combine results
    return {
        structuralAnalysis: structuralElements,
        compressedNodes: JSON.stringify(allNodes)
    };
};

/**
 * Verifies text accuracy and suggests improvements using Claude with tool use
 * @param text Text to verify
 * @returns Verification results with corrections
 * @throws Error if Claude API call fails or response parsing fails
 */
export const verifyText = async (text: string): Promise<TextVerification> => {
    try {
        const response = await client.messages.create({
            model: "claude-3-7-sonnet-20250219", // Upgraded to Claude 3.7 Sonnet
            max_tokens: 4096, // Increased token limit
            system: "You are a text verification assistant that identifies discrepancies and suggests improvements. Be thorough and precise in your analysis. NEVER truncate your response.",
            messages: [{
                role: "user",
                content: `Review this text for accuracy and suggest improvements:

${text}`
            }],
            tools: [{
                name: "text_verification",
                description: "Verifies text accuracy and suggests improvements",
                input_schema: {
                    type: "object",
                    properties: {
                        hasDiscrepancies: {
                            type: "boolean",
                            description: "Whether the text has discrepancies"
                        },
                        alternativeText: {
                            type: "string",
                            description: "Corrected version of the full text (optional)"
                        },
                        discrepancies: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    original: {
                                        type: "string",
                                        description: "The original text"
                                    },
                                    suggested: {
                                        type: "string",
                                        description: "The suggested correction"
                                    },
                                    explanation: {
                                        type: "string",
                                        description: "Why this change is suggested"
                                    }
                                },
                                required: ["original", "suggested", "explanation"]
                            }
                        }
                    },
                    required: ["hasDiscrepancies"]
                }
            }],
            tool_choice: {
                type: "tool",
                name: "text_verification"
            }
        });

        // Validate response format
        const validatedResponse = anthropicResponseSchema.parse(response);
        
        // Extract the tool use response
        const toolUse = validatedResponse.content.find(item =>
            'type' in item && item.type === 'tool_use'
        ) as AnthropicToolUse | undefined;
        
        if (!toolUse || !('input' in toolUse)) {
            // Fallback to text parsing if tool use response is not found
            const textContent = validatedResponse.content.find(item =>
                'type' in item && item.type === 'text' && 'text' in item
            );
            
            if (textContent && 'text' in textContent) {
                try {
                    // Try to extract JSON from text response
                    const jsonMatch = textContent.text.match(/\{\s*"[\s\S]*"\s*:[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsedResponse = JSON.parse(jsonMatch[0]);
                        return textVerificationSchema.parse(parsedResponse);
                    }
                } catch (parseError) {
                    console.error('Failed to parse text as JSON:', parseError);
                }
            }
            
            throw new Error('No valid tool use response received from Claude');
        }

        // Transform the response if needed
        const result = { ...toolUse.input };
        
        // Handle case where discrepancies is a string instead of an array
        if (result.discrepancies && typeof result.discrepancies === 'string') {
            try {
                // Try to parse it as JSON if it's a stringified array
                result.discrepancies = JSON.parse(result.discrepancies);
            } catch {
                // If parsing fails, convert to an empty array
                console.warn('Failed to parse discrepancies as JSON, using empty array instead');
                result.discrepancies = [];
            }
        }
        
        // Validate the transformed response against our schema
        return textVerificationSchema.parse(result);
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
/**
 * Verifies text accuracy in chunks for large documents
 * @param text Text to verify
 * @returns Verification results with corrections
 */
export const verifyTextInChunks = async (text: string): Promise<TextVerification> => {
    // For small texts, use the regular method
    if (text.length <= MAX_CHUNK_SIZE) {
        return verifyText(text);
    }
    
    // Split text into manageable chunks
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    
    // Initialize result
    const result: TextVerification = {
        hasDiscrepancies: false,
        discrepancies: []
    };
    
    // Process each chunk
    for (const chunk of chunks) {
        const chunkResult = await verifyText(chunk);
        
        // Combine results
        if (chunkResult.hasDiscrepancies) {
            result.hasDiscrepancies = true;
            
            if (chunkResult.discrepancies && chunkResult.discrepancies.length > 0) {
                result.discrepancies = [
                    ...(result.discrepancies || []),
                    ...chunkResult.discrepancies
                ];
            }
        }
    }
    
    return result;
};

// Export retry-wrapped versions of the functions
export const analyzeStructureWithRetry = (text: string) =>
    withRetry(() => text.length > MAX_CHUNK_SIZE ?
        analyzeStructureInChunks(text) :
        analyzeStructure(text));

export const verifyTextWithRetry = (text: string) =>
    withRetry(() => text.length > MAX_CHUNK_SIZE ?
        verifyTextInChunks(text) :
        verifyText(text));