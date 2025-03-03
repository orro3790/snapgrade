import Anthropic from '@anthropic-ai/sdk';
import type { StructuralAnalysis, TextVerification } from '../schemas/documentProcessing';
import { structuralAnalysisSchema, textVerificationSchema } from '../schemas/documentProcessing';
import { type AnthropicToolUse } from '../schemas/anthropic';
import type { CompressedNode } from '../schemas/textNode';
import type { ContentBlockParam, ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { isCdnUrlExpired } from '../schemas/pending-image';
import fetch from 'node-fetch';

/**
 * Fetch an image from a URL and convert it to base64
 * @param imageUrl URL of the image to fetch
 * @returns Promise resolving to base64 encoded image data and media type
 * @throws Error if the image cannot be fetched or converted
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{
    data: string,
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
}> {
    try {
        const startTime = Date.now();
        console.log(`[PERF] Starting image fetch from URL: ${imageUrl}`);
        
        // Check if the URL has expired
        const expiryMatch = imageUrl.match(/[?&]ex=([0-9a-f]+)/);
        if (expiryMatch) {
            const expiryHex = expiryMatch[1];
            if (isCdnUrlExpired(expiryHex)) {
                throw new Error(`Image URL has expired: ${imageUrl}`);
            }
        }

        // Fetch the image
        const fetchStartTime = Date.now();
        console.log(`[PERF] Sending fetch request for image`);
        const response = await fetch(imageUrl);
        const fetchTime = Date.now() - fetchStartTime;
        console.log(`[PERF] Fetch request completed in ${fetchTime}ms`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        // Get the content type
        let contentType = response.headers.get('content-type') || 'image/jpeg';
        
        // Validate and convert content type to one of the allowed types
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType)) {
            // Default to image/jpeg for unsupported types
            console.warn(`Unsupported image type: ${contentType}, defaulting to image/jpeg`);
            contentType = 'image/jpeg';
        }
        
        // Convert to buffer and then to base64
        const encodeStartTime = Date.now();
        console.log(`[PERF] Starting image encoding to base64`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const encodeTime = Date.now() - encodeStartTime;
        console.log(`[PERF] Image encoding completed in ${encodeTime}ms (${buffer.length} bytes)`);
        
        const totalTime = Date.now() - startTime;
        console.log(`[PERF] Total image fetch and encode time: ${totalTime}ms`);

        return {
            data: base64Data,
            mediaType: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
        };
    } catch (error) {
        console.error('Error fetching image:', error);
        throw new Error(`Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Initialize client with API key
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_ANALYSIS_API_KEY
});

// Maximum chunk size for text processing (approximately 8000 tokens)
const MAX_CHUNK_SIZE = 8000;

/**
 * Get standard text processing instructions
 * @returns Instructions for Claude for text processing
 */
/**
 * Get standard text processing instructions including line break handling
 * @returns Instructions for Claude for text processing
 */
function getTextProcessingInstructions(): string {
  return `
    Focus on ACCURATE EXTRACTION ONLY, preserving all spelling, grammar, and punctuation exactly as written.
    The text may include unusual letter forms, inconsistent spacing, and many errors.
    Do not attempt to correct or standardize anything - preserve all errors exactly as written.
    If you're uncertain about any text, reference the original image to verify.
  `;
}

/**
 * Get line break handling instructions
 * @returns Standardized instructions for handling line breaks
 */
function getLineBreakInstructions(): string {
  return `
    IMPORTANT: Do not preserve line breaks that occur due to page width constraints or line spacing in the text (ex: double spacing).
    Only insert line breaks when there is a new paragraph in the content (not including the first paragraph).
  `;
}

/**
 * Prepares request content for Claude API with optimized prompts
 * Consolidated request preparation function per Phase 2.1 of optimization plan
 *
 * @param text Raw text to analyze
 * @param options Optional parameters including image data and low confidence words
 * @returns Prepared request content (string or ContentBlockParam[])
 */
function prepareRequestContent(
  text: string,
  options: {
    imageData?: { base64: string, mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" },
    lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>,
    includeImageGuidance?: boolean
  } = {}
): string | ContentBlockParam[] {
  const { imageData, lowConfidenceWords = [], includeImageGuidance = true } = options;
  
  // Format low confidence words if provided
  let lowConfidenceWordsText = '';
  if (lowConfidenceWords && lowConfidenceWords.length > 0) {
    lowConfidenceWordsText = `\nThe OCR system had lower confidence in the following words:
${lowConfidenceWords.map(w => `"${w.text}" (confidence: ${w.confidence}, line: ${w.lineIndex + 1})`).join('\n')}

Please pay special attention to these words and verify them against the image if needed.`;
  }
  
  // Optimized instructions - more concise while preserving critical formatting requirements
  const createBaseInstructions = (withImageGuidance = false) => {
    let instructions = `Analyze this text and identify its structural elements. Generate compressed TextNodes:

${text}
${lowConfidenceWordsText}`;

    // Add image guidance if needed
    if (withImageGuidance && imageData) {
      instructions += `\nPlease also reference the provided image to identify formatting or corrections not captured in the text:
- Text that was erased but not fully removed
- Words inserted between lines
- Words that were crossed out
- Special formatting like underlines, highlights, margin notes`;
    }

    // Add node format instructions - kept the same for consistency
    // Add line break instructions before node format details
    instructions += `\n
${getLineBreakInstructions()}

Use this compact JSON format for nodes:
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

PUNCTUATION RULES:
- Separate nodes for: periods, commas, exclamation/question marks, colons, semicolons
- For punctuation nodes: "t": "normal", "m": { "u": true }
- Keep apostrophes and hyphens with their words

SPACER RULES:
- First paragraph: indent spacer node only
- Subsequent paragraphs: lineBreak spacer followed by indent spacer
- No spacer nodes for regular whitespace or line breaks within paragraphs

Return the COMPLETE compressed nodes array without truncation.`;

    return instructions;
  };

  // Prepare content based on whether we have image data
  const finalContent = createBaseInstructions(includeImageGuidance);
  
  // If we have image data, return content blocks with image
  if (imageData) {
    const imageBlock: ImageBlockParam = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: imageData.mediaType,
        data: imageData.base64
      }
    };
    
    const textBlock: TextBlockParam = {
      type: 'text',
      text: finalContent
    };
    
    return [imageBlock, textBlock];
  }
  
  // Otherwise, return just the text content
  return finalContent;
}

/**
 * Analyzes document structure using Claude with tool use
 * @param text Raw text to analyze
 * @param imageUrl Optional URL of the original image
 * @param lowConfidenceWords Optional array of words with low OCR confidence
 * @returns Structured analysis of the document
 * @throws Error if Claude API call fails or response parsing fails
 */
export const analyzeStructure = async (
  text: string,
  imageUrl?: string,
  lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> => {
    try {
        const totalStartTime = Date.now();
        console.log(`[PERF] Starting Claude structure analysis: ${text.length} chars of text${imageUrl ? ', with image' : ', without image'}${lowConfidenceWords?.length ? `, ${lowConfidenceWords.length} low confidence words` : ''}`);
        
        // Get text processing instructions
        const textProcessingInstructions = getTextProcessingInstructions();
        
        // Prepare the request content
        let requestContent: string | ContentBlockParam[];
        
        if (imageUrl) {
            try {
                // Fetch and convert the image to base64
                const { data: base64Data, mediaType } = await fetchImageAsBase64(imageUrl);
                
                // Use the consolidated function to prepare request content
                requestContent = prepareRequestContent(text, {
                    imageData: {
                        base64: base64Data,
                        mediaType
                    },
                    lowConfidenceWords
                });
            } catch (error) {
                console.warn(`Failed to include image in Claude request: ${error instanceof Error ? error.message : 'Unknown error'}`);
                console.warn('Proceeding with text-only analysis');
                
                // Use the consolidated function for text-only content
                requestContent = prepareRequestContent(text, { lowConfidenceWords });
            }
        } else {
            // Without an image, use simple text content
            requestContent = prepareRequestContent(text, { lowConfidenceWords });
        }

        // Create Claude API request
        const apiStartTime = Date.now();
        console.log(`[PERF] Sending request to Claude API`);
        const response = await client.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 20000,
            system: `Document structure analyzer: Identify structural elements (titles, paragraphs, etc.) and generate compressed TextNodes.
            
The text is from ESL student work (printed/handwritten). Preserve EXACT spelling, grammar, punctuation, letter forms, and spacing - even if incorrect. DO NOT correct or standardize anything.

${getLineBreakInstructions()}

${textProcessingInstructions}

If provided with an image, use it only to verify uncertain text or identify formatting not captured in the OCR.`,
            messages: [{
                role: "user",
                content: requestContent
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
        const apiTime = Date.now() - apiStartTime;
        console.log(`[PERF] Claude API response received in ${apiTime}ms`);

        // Optimized response parsing
        const parseStartTime = Date.now();
        console.log(`[PERF] Parsing Claude response`);
        
        // Fast validation path - only validate what's needed
        if (!response || !response.content || !Array.isArray(response.content)) {
            throw new Error('Invalid response format from Claude: missing or invalid content array');
        }
        
        // Use type assertion for faster processing since we've validated the critical structure
        const validatedResponse = response;
        
        // Direct extraction with type checking for performance
        const toolUse = validatedResponse.content.find(
            item => item && typeof item === 'object' && 'type' in item && item.type === 'tool_use'
        ) as AnthropicToolUse | undefined;
        
        // Fast path for successful tool use response
        if (toolUse && 'input' in toolUse && toolUse.input && 'elements' in toolUse.input) {
            try {
                // Extract and validate the critical parts using schema
                const structuralAnalysis = structuralAnalysisSchema.parse(toolUse.input.elements);
                const compressedNodes = toolUse.input.compressedNodes as string | undefined;
                
                const parseTime = Date.now() - parseStartTime;
                console.log(`[PERF] Claude response parsed in ${parseTime}ms`);
                
                return {
                    structuralAnalysis,
                    compressedNodes
                };
            } catch (error) {
                const validationError = error as Error;
                console.error('Schema validation failed:', validationError);
                throw new Error(`Failed to validate Claude response: ${validationError.message}`);
            }
        }
        
        // Fallback logic with better error handling
        console.warn('[PERF] Tool use response not found, attempting fallback parsing');
        
        // Try to extract from text content
        const textContent = validatedResponse.content.find(
            item => item && typeof item === 'object' && 'type' in item && item.type === 'text' && 'text' in item
        );
        
        if (textContent && 'text' in textContent && typeof textContent.text === 'string') {
            try {
                // Improved JSON extraction with better regex pattern
                const jsonMatch = textContent.text.match(/\[\s*\{\s*"(?:type|position)[\s\S]*\}\s*\]/);
                if (jsonMatch) {
                    const parsedResponse = JSON.parse(jsonMatch[0]);
                    const validatedAnalysis = structuralAnalysisSchema.parse(parsedResponse);
                    
                    console.log(`[PERF] Successfully extracted JSON from text response as fallback`);
                    const fallbackParseTime = Date.now() - parseStartTime;
                    console.log(`[PERF] Claude response parsed in ${fallbackParseTime}ms (fallback method)`);
                    
                    return {
                        structuralAnalysis: validatedAnalysis,
                        compressedNodes: undefined
                    };
                }
            } catch (parseError) {
                console.error('Failed to parse text as JSON:', parseError);
                // Continue to next fallback option
            }
        }
        
        // Log performance before throwing error
        const parseTime = Date.now() - parseStartTime;
        const totalTime = Date.now() - totalStartTime;
        
        console.log(`[PERF] Total Claude structure analysis time: ${totalTime}ms`);
        console.log(`[PERF] Breakdown - API call: ${apiTime}ms (${Math.round(apiTime/totalTime*100)}%), ` +
                    `Response parsing: ${parseTime}ms (${Math.round(parseTime/totalTime*100)}%)`);
        
        console.error(`[PERF] All parsing methods failed for Claude response after ${parseTime}ms`);
        throw new Error('No valid response data received from Claude: could not extract structured data');
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
 * Main document analysis function - provides unified interface for all document analysis
 *
 * @param text Text to analyze
 * @param options Analysis options
 * @returns Structured analysis and compressed nodes
 */
/**
 * Analyzes document structure, optimized to minimize chunking
 * According to Phase 1.2 of the performance optimization plan, we try direct processing
 * for all documents first, only falling back to chunking when necessary.
 *
 * @param text Text to analyze
 * @param options Analysis options
 * @returns Structured analysis and compressed nodes
 */
export async function analyzeDocument(
    text: string,
    options: {
        imageUrl?: string,
        lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>,
        maxAttempts?: number,
        baseDelay?: number
    } = {}
): Promise<{
    structuralAnalysis: StructuralAnalysis;
    compressedNodes?: string;
}> {
    const {
        imageUrl,
        lowConfidenceWords,
        maxAttempts = 3,
        baseDelay = 1000
    } = options;
    
    // Strategy pattern: Always try direct processing first, only use chunking as fallback
    const processingStrategy = async (): Promise<{
        structuralAnalysis: StructuralAnalysis;
        compressedNodes?: string;
    }> => {
        try {
            // Empty text check
            if (!text || text.trim().length === 0) {
                console.warn('[PERF] Empty text provided for analysis');
                return { structuralAnalysis: [], compressedNodes: '[]' };
            }
            
            // Try direct processing for all documents first, regardless of size
            console.log(`[PERF] Attempting direct processing for ${text.length} chars of text`);
            return await analyzeStructure(text, imageUrl, lowConfidenceWords);
            
        } catch (error) {
            // If the error suggests token limit issues, fall back to chunking
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes('token limit') ||
                errorMsg.includes('context length') ||
                errorMsg.includes('too many tokens'))
            {
                console.log(`[PERF] Direct processing failed due to token limits, falling back to chunking: ${errorMsg}`);
                return await processInChunks(text, imageUrl, lowConfidenceWords);
            }
            
            // For other errors, propagate them
            throw error;
        }
    };
    
    // Apply retry pattern with the chosen strategy
    return withRetry(processingStrategy, maxAttempts, baseDelay);
}

/**
 * Process document in chunks for large documents
 * @private Internal helper function used by analyzeDocument
 */
async function processInChunks(
    text: string,
    imageUrl?: string,
    lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>
): Promise<{
    structuralAnalysis: StructuralAnalysis;
    compressedNodes?: string;
}> {
    const totalStartTime = Date.now();
    console.log(`[PERF] Starting chunked structure analysis: ${text.length} chars of text`);
    
    // Split text into manageable chunks
    const splitStartTime = Date.now();
    console.log(`[PERF] Splitting text into chunks`);
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    const splitTime = Date.now() - splitStartTime;
    console.log(`[PERF] Text split into ${chunks.length} chunks in ${splitTime}ms`);
    
    let allNodes: CompressedNode[] = [];
    let structuralElements: StructuralAnalysis = [];
    let position = 0;
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Only pass the image URL for the first chunk
        // Filter low confidence words that belong to this chunk
        const chunkLowConfidenceWords = i === 0 && imageUrl
            ? lowConfidenceWords
            : lowConfidenceWords?.filter(
                word => word.lineIndex >= position && word.lineIndex < position + chunk.length
              );
        
        const result = await analyzeStructure(
            chunk,
            i === 0 ? imageUrl : undefined,
            chunkLowConfidenceWords
        );
        
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
    const combineStartTime = Date.now();
    console.log(`[PERF] Combining chunk results`);
    const result = {
        structuralAnalysis: structuralElements,
        compressedNodes: JSON.stringify(allNodes)
    };
    const combineTime = Date.now() - combineStartTime;
    console.log(`[PERF] Results combined in ${combineTime}ms`);
    
    const totalTime = Date.now() - totalStartTime;
    console.log(`[PERF] Total chunked structure analysis time: ${totalTime}ms`);
    console.log(`[PERF] Chunked analysis breakdown - Splitting: ${splitTime}ms (${Math.round(splitTime/totalTime*100)}%), ` +
                `Chunk processing: ${totalTime - splitTime - combineTime}ms (${Math.round((totalTime - splitTime - combineTime)/totalTime*100)}%), ` +
                `Combining: ${combineTime}ms (${Math.round(combineTime/totalTime*100)}%)`);
    
    return result;
}

/**
 * Unified function for text verification with built-in chunking and retry
 * Optimized implementation with performance benchmarking
 *
 * @param text Text to verify
 * @param options Verification options including benchmarking settings
 * @returns Verification results with corrections
 */
export async function verifyDocument(
    text: string,
    options: {
        maxAttempts?: number,
        baseDelay?: number,
        benchmarkMode?: boolean
    } = {}
): Promise<TextVerification> {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        benchmarkMode = false
    } = options;
    
    const totalStartTime = Date.now();
    const docLength = text?.length || 0;
    
    // Track verification metrics for benchmarking
    const metrics = {
        attempts: 0,
        totalTime: 0,
        usedChunking: false
    };
    
    if (benchmarkMode) {
        console.log(`[PERF][BENCHMARK] Starting verification benchmark for ${docLength} chars of text`);
    }
    
    const verificationStrategy = async (): Promise<TextVerification> => {
        metrics.attempts++;
        
        // Empty text check - fast path for empty input
        if (!text || text.trim().length === 0) {
            console.warn('[PERF] Empty text provided for verification');
            return { hasDiscrepancies: false, discrepancies: [] };
        }
        
        // Adaptive strategy based on text size
        const strategyStartTime = Date.now();
        
        try {
            // Use direct verification for standard-sized documents
            if (text.length <= MAX_CHUNK_SIZE) {
                const result = await verifyText(text);
                return result;
            }
            
            // Use chunking for large documents
            metrics.usedChunking = true;
            const result = await verifyTextInChunks(text);
            return result;
        } finally {
            metrics.totalTime = Date.now() - strategyStartTime;
        }
    };
    
    try {
        // Apply retry pattern
        const result = await withRetry(verificationStrategy, maxAttempts, baseDelay);
        
        // Record final metrics if in benchmark mode
        if (benchmarkMode) {
            const totalVerificationTime = Date.now() - totalStartTime;
            console.log(`[PERF][BENCHMARK] Verification metrics for ${docLength} chars:`);
            console.log(`[PERF][BENCHMARK] - Total time: ${totalVerificationTime}ms`);
            console.log(`[PERF][BENCHMARK] - Attempts: ${metrics.attempts}`);
            console.log(`[PERF][BENCHMARK] - Used chunking: ${metrics.usedChunking}`);
            console.log(`[PERF][BENCHMARK] - Found discrepancies: ${result.hasDiscrepancies}`);
            console.log(`[PERF][BENCHMARK] - Discrepancy count: ${result.discrepancies?.length || 0}`);
        }
        
        return result;
    } catch (error) {
        // Log performance data even on failure
        if (benchmarkMode) {
            const totalVerificationTime = Date.now() - totalStartTime;
            console.log(`[PERF][BENCHMARK] Verification failed after ${totalVerificationTime}ms`);
            console.log(`[PERF][BENCHMARK] - Attempts: ${metrics.attempts}`);
        }
        
        throw error;
    }
}

/**
 * Verifies text accuracy and suggests improvements using Claude with tool use
 * @private Internal function used by verifyDocument
 */
/**
 * Verifies text accuracy and suggests improvements using Claude with tool use
 *
 * @private Internal function used by verifyDocument
 * @param text Text to verify
 * @returns TextVerification object with analysis results
 */
async function verifyText(text: string): Promise<TextVerification> {
    const totalStartTime = Date.now();
    console.log(`[PERF] Starting text verification with Claude: ${text.length} chars of text`);
    
    try {
        // API call phase
        const apiStartTime = Date.now();
        console.log(`[PERF] Sending verification request to Claude API`);
        
        const response = await client.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 4096,
            system: `You are a text verification assistant that identifies discrepancies and suggests improvements. Be thorough and precise in your analysis. NEVER truncate your response.

${getLineBreakInstructions()}`,
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
        
        const apiTime = Date.now() - apiStartTime;
        console.log(`[PERF] Claude API verification response received in ${apiTime}ms`);

        // Response parsing phase - optimized with multiple fallback strategies
        const parseStartTime = Date.now();
        console.log(`[PERF] Parsing verification response`);
        
        // Strategy 1: Fast-path validation (only check critical structure)
        if (!response?.content?.length) {
            throw new Error('Invalid response format from Claude: empty or missing content');
        }
        
        let result: TextVerification | null = null;
        
        // Strategy 2: Direct tool use extraction (optimal path)
        try {
            const toolUse = response.content.find(
                item => item?.type === 'tool_use'
            ) as AnthropicToolUse | undefined;
            
            if (toolUse?.input) {
                // Handle case where discrepancies is a string instead of an array
                const toolInput = { ...toolUse.input };
                
                if (toolInput.discrepancies && typeof toolInput.discrepancies === 'string') {
                    try {
                        toolInput.discrepancies = JSON.parse(toolInput.discrepancies);
                    } catch (parseError) {
                        console.warn('[PERF] Failed to parse string discrepancies as JSON', parseError);
                        toolInput.discrepancies = [];
                    }
                }
                
                // Normalize hasDiscrepancies field if missing
                if (toolInput.discrepancies?.length > 0 && toolInput.hasDiscrepancies === undefined) {
                    toolInput.hasDiscrepancies = true;
                }
                
                // Validate with schema
                const validationResult = textVerificationSchema.safeParse(toolInput);
                if (validationResult.success) {
                    result = validationResult.data;
                    console.log(`[PERF] Successfully parsed tool use response (primary strategy)`);
                } else {
                    console.warn('[PERF] Tool input validation failed:', validationResult.error);
                }
            }
        } catch (toolError) {
            console.warn('[PERF] Error parsing tool use response:', toolError);
            // Continue to fallback strategies
        }
        
        // Strategy 3: Text content JSON extraction
        if (!result) {
            try {
                // Find text content with proper type checking
                const textItem = response.content.find(
                    item => item && typeof item === 'object' && 'type' in item && item.type === 'text'
                );
                
                if (textItem && 'text' in textItem && typeof textItem.text === 'string') {
                    const textContent = textItem.text;
                    // Try multiple regex patterns for more robust extraction
                    const patterns = [
                        /\{\s*"(?:hasDiscrepancies|discrepancies|alternativeText)[\s\S]*?\}/g,
                        /\[\s*\{\s*"(?:original|suggested|explanation)[\s\S]*?\}\s*\]/g
                    ];
                    
                    for (const pattern of patterns) {
                        const matches = [...textContent.matchAll(pattern)];
                        
                        for (const match of matches) {
                            try {
                                const parsedJson = JSON.parse(match[0]);
                                
                                // Handle array of discrepancies directly
                                if (Array.isArray(parsedJson) && parsedJson.length > 0 &&
                                   'original' in parsedJson[0] && 'suggested' in parsedJson[0]) {
                                    result = {
                                        hasDiscrepancies: true,
                                        discrepancies: parsedJson
                                    };
                                    console.log(`[PERF] Successfully extracted discrepancies array directly`);
                                    break;
                                }
                                
                                // Handle complete verification object
                                const validationResult = textVerificationSchema.safeParse(parsedJson);
                                if (validationResult.success) {
                                    result = validationResult.data;
                                    console.log(`[PERF] Successfully extracted verification JSON (fallback strategy)`);
                                    break;
                                }
                            } catch {
                                // Continue trying other matches (parameter omitted since it's not used)
                            }
                        }
                        
                        if (result) break;
                    }
                }
            } catch (textError) {
                console.warn('[PERF] Error parsing text content:', textError);
            }
        }
        
        // Strategy 4: Default safe result if all else fails
        if (!result) {
            console.warn('[PERF] All parsing strategies failed, returning default "no discrepancies" response');
            result = {
                hasDiscrepancies: false,
                discrepancies: []
            };
        }
        
        // Performance logging
        const parseTime = Date.now() - parseStartTime;
        const totalTime = Date.now() - totalStartTime;
        
        console.log(`[PERF] Verification response parsed in ${parseTime}ms`);
        console.log(`[PERF] Total text verification time: ${totalTime}ms`);
        console.log(`[PERF] Verification breakdown - API call: ${apiTime}ms (${Math.round(apiTime/totalTime*100)}%), ` +
                   `Response parsing: ${parseTime}ms (${Math.round(parseTime/totalTime*100)}%)`);
        
        return result;
    } catch (error) {
        // Enhanced error handling with specific error types
        const totalTime = Date.now() - totalStartTime;
        
        if (error instanceof SyntaxError) {
            console.error(`[PERF] JSON parsing error during verification (${totalTime}ms):`, error);
            throw new Error(`Text verification JSON parsing failed: ${error.message}`);
        } else if (error instanceof TypeError) {
            console.error(`[PERF] Type error during verification (${totalTime}ms):`, error);
            throw new Error(`Text verification type error: ${error.message}`);
        } else if (error instanceof Error) {
            console.error(`[PERF] Error during verification (${totalTime}ms):`, error);
            throw new Error(`Text verification failed: ${error.message}`);
        }
        
        console.error(`[PERF] Unknown error during verification (${totalTime}ms):`, error);
        throw new Error('Text verification failed with unknown error');
    }
}

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
 * Optimized implementation with parallel processing for better performance
 *
 * @param text Text to verify
 * @returns Verification results with corrections
 */
export const verifyTextInChunks = async (text: string): Promise<TextVerification> => {
    const totalStartTime = Date.now();
    console.log(`[PERF] Starting chunked text verification: ${text.length} chars of text`);
    
    // For small texts, use the regular method
    if (text.length <= MAX_CHUNK_SIZE) {
        return verifyText(text);
    }
    
    // Split text into manageable chunks
    const splitStartTime = Date.now();
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    const splitTime = Date.now() - splitStartTime;
    
    console.log(`[PERF] Text split into ${chunks.length} verification chunks in ${splitTime}ms`);
    
    // Initialize result
    const result: TextVerification = {
        hasDiscrepancies: false,
        discrepancies: []
    };
    
    // Process chunks in batches for controlled parallelism
    // This prevents overwhelming the API with too many simultaneous requests
    const BATCH_SIZE = 3; // Process 3 chunks at a time
    const chunkStartTime = Date.now();
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        console.log(`[PERF] Processing verification batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(chunks.length/BATCH_SIZE)}`);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(chunk => verifyText(chunk))
        );
        
        // Merge batch results into main result
        for (const chunkResult of batchResults) {
            if (chunkResult.hasDiscrepancies) {
                result.hasDiscrepancies = true;
                
                if (chunkResult.discrepancies && chunkResult.discrepancies.length > 0) {
                    // Use efficient array concatenation with proper null checks
                    if (!result.discrepancies) result.discrepancies = [];
                    result.discrepancies.push(...chunkResult.discrepancies);
                }
            }
        }
    }
    
    const chunkTime = Date.now() - chunkStartTime;
    const totalTime = Date.now() - totalStartTime;
    
    console.log(`[PERF] Chunked verification complete: ${result.discrepancies?.length || 0} discrepancies found`);
    console.log(`[PERF] Total chunked verification time: ${totalTime}ms`);
    console.log(`[PERF] Chunked verification breakdown - Splitting: ${splitTime}ms (${Math.round(splitTime/totalTime*100)}%), ` +
                `Chunk processing: ${chunkTime}ms (${Math.round(chunkTime/totalTime*100)}%)`);
    
    return result;
};
// Phase 2.2: Simplified function structure
// No backward compatibility wrappers needed as the app is in development
// analyzeDocument and verifyDocument are the main API functions now