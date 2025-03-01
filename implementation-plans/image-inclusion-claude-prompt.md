# Image Inclusion with Claude Prompt Implementation Plan

## Overview

This document outlines the implementation plan for including the original image along with the prompt to Claude to improve formatting accuracy. This enhancement will significantly improve the accuracy of document processing by allowing Claude to analyze both the text and the visual layout.

## Current Implementation

Currently, the document processing pipeline works as follows:

1. User uploads image(s) in Discord
2. LLM Whisperer processes images with OCR to extract text
3. The extracted text is sent to Claude for structural analysis
4. Claude analyzes the text structure without seeing the original image
5. The document is created in Firestore

## Proposed Changes

We will modify the pipeline to:

1. Pass the original image URL to Claude along with the extracted text
2. Include confidence metadata from LLM Whisperer to highlight uncertain words
3. Incorporate text quality information (printed vs. handwriting) in the Claude prompt
4. Update the Claude prompt to better utilize the image for verification

## Implementation Details

### 1. Modify `claude.ts` to Accept Additional Parameters

Update the `analyzeStructure` function to accept additional parameters:

```typescript
/**
 * Analyzes document structure using Claude with tool use
 * @param text Raw text to analyze
 * @param imageUrl Optional URL of the original image
 * @param lowConfidenceWords Optional array of words with low OCR confidence
 * @param textQuality Optional quality of the text (printed or handwriting)
 * @returns Structured analysis of the document
 * @throws Error if Claude API call fails or response parsing fails
 */
export const analyzeStructure = async (
  text: string,
  imageUrl?: string,
  lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>,
  textQuality?: string
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> => {
  try {
    // Get text quality instructions
    const textQualityInstructions = getTextQualityInstructions(textQuality);
    
    // Prepare message content with text and optional image
    const messageContent = [];
    
    // Add image if provided
    if (imageUrl) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'url',
          url: imageUrl
        }
      });
    }
    
    // Format low confidence words if provided
    let lowConfidenceWordsText = '';
    if (lowConfidenceWords && lowConfidenceWords.length > 0) {
      lowConfidenceWordsText = `\nThe OCR system had lower confidence in the following words:
${lowConfidenceWords.map(w => `"${w.text}" (confidence: ${w.confidence}, line: ${w.lineIndex + 1})`).join('\n')}

Please pay special attention to these words and verify them against the image if needed.`;
    }
    
    // Add text prompt
    messageContent.push({
      type: 'text',
      text: `Analyze this text and identify its structural elements. Also generate compressed TextNodes for the editor:

${text}

${imageUrl ? 'Please also reference the provided image to identify any formatting, corrections, or special notations that may not be captured in the extracted text. Look for:' : ''}
${imageUrl ? '- Text that was erased but not fully removed' : ''}
${imageUrl ? '- Words inserted between lines with insertion symbols' : ''}
${imageUrl ? '- Words that were crossed out rather than erased' : ''}
${imageUrl ? '- Special formatting like underlines, highlights, or margin notes' : ''}
${lowConfidenceWordsText}

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

It is CRITICAL that you return the complete compressed nodes array without truncation. If the document is too large, use the most efficient compression possible.`
    });
    
    // Create Claude API request
    const response = await client.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 20000,
      system: `You are a document structure analyzer that identifies structural elements in text and generates compressed TextNodes for the editor. Be precise and thorough in your analysis. NEVER truncate your response, even for large documents. If the document is too large, focus on providing accurate structural analysis for the content you can process. ${textQualityInstructions}`,
      messages: [{
        role: "user",
        content: messageContent
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
    
    // Rest of the function remains the same...
  } catch (error) {
    // Error handling...
  }
};

/**
 * Helper function to get text quality instructions
 * @param textQuality Text quality identifier
 * @returns Instructions for Claude based on text quality
 */
function getTextQualityInstructions(textQuality?: string): string {
  if (textQuality === 'handwriting') {
    return `
      This text was extracted from handwritten work, produced by second language learners.
      Focus on ACCURATE EXTRACTION ONLY, preserving all spelling, grammar, and punctuation exactly as written.
      The text may include unusual letter forms, inconsistent spacing, and many errors.
      Do not attempt to correct or standardize anything - preserve all errors exactly as written.
      If you're uncertain about any text, reference the original image to verify.
    `;
  }
  
  // Default instructions for printed text
  return `
    Focus on ACCURATE EXTRACTION ONLY, preserving all spelling, grammar, and punctuation exactly as written.
    Do not correct anything, even if it appears to be an error.
  `;
}
```

### 2. Update `analyzeStructureInChunks` Function

Modify the `analyzeStructureInChunks` function to handle the new parameters:

```typescript
/**
 * Analyzes document structure in chunks for large documents
 * @param text Text to analyze
 * @param imageUrl Optional URL of the original image
 * @param lowConfidenceWords Optional array of words with low OCR confidence
 * @param textQuality Optional quality of the text (printed or handwriting)
 * @returns Structural analysis and compressed nodes
 */
export const analyzeStructureInChunks = async (
  text: string,
  imageUrl?: string,
  lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>,
  textQuality?: string
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> => {
  // For small texts, use the regular method with all parameters
  if (text.length <= MAX_CHUNK_SIZE) {
    return analyzeStructure(text, imageUrl, lowConfidenceWords, textQuality);
  }
  
  // Split text into manageable chunks
  const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
  
  let allNodes: CompressedNode[] = [];
  let structuralElements: StructuralAnalysis = [];
  let position = 0;
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Only pass the image URL and text quality for the first chunk
    // Filter low confidence words that belong to this chunk
    const chunkLowConfidenceWords = lowConfidenceWords?.filter(
      word => word.lineIndex >= position && word.lineIndex < position + chunk.length
    );
    
    const result = await analyzeStructure(
      chunk,
      i === 0 ? imageUrl : undefined,
      chunkLowConfidenceWords,
      i === 0 ? textQuality : undefined
    );
    
    // Rest of the function remains the same...
  }
  
  // Return combined results...
};
```

### 3. Update `llmWhispererService.ts` to Extract Confidence Metadata

Modify the `processImage` function to extract confidence metadata:

```typescript
/**
 * Process a single image URL
 * @param imageUrl URL of the image to process
 * @param textQuality Text quality (printed or handwriting)
 * @param options Processing options
 * @returns Processing result or whisper hash for async processing
 */
export const processImage = async (
  imageUrl: string,
  textQuality: string = 'printed',
  options: Partial<WhisperOptions> = {}
): Promise<WhisperResult> => {
  try {
    console.log(`Processing image with LLM Whisperer: ${imageUrl}, quality: ${textQuality}`);
    
    // Set OCR parameters based on text quality
    const mode = textQuality === 'handwriting' ? 'handwriting' : 'high_quality';
    
    const result = await whispererClient.whisper({
      url: imageUrl,
      mode: mode,
      outputMode: 'text',
      waitForCompletion: options.waitForCompletion || false,
      waitTimeout: 60, // 1 minute timeout before switching to async
      includeConfidence: true // Request confidence metadata
    });
    
    return result as WhisperResult;
  } catch (error) {
    console.error('Error processing image with LLM Whisperer:', error);
    throw error;
  }
};
```

### 4. Update `processPendingImage` Function

Modify the `processPendingImage` function to pass the image URL and confidence data to Claude:

```typescript
/**
 * Process a pending image from Firestore
 * @param image PendingImage object from Firestore
 * @returns Processed text and analysis
 */
export const processPendingImage = async (image: PendingImage) => {
  try {
    // Get text quality from session if available
    let textQuality = 'printed'; // Default to printed
    
    if (image.sessionId) {
      try {
        const sessionDoc = await adminDb.collection('document_sessions').doc(image.sessionId).get();
        if (sessionDoc.exists) {
          const sessionData = sessionDoc.data();
          if (sessionData && sessionData.textQuality) {
            textQuality = sessionData.textQuality;
          }
        }
      } catch (error) {
        console.warn('Error getting text quality from session:', error);
      }
    }
    
    // Process with LLM Whisperer using the appropriate mode
    const whisperResult = await processImage(image.imageUrl, textQuality, {
      waitForCompletion: true
    });
    
    // Extract text from result
    const extractedText = whisperResult.extraction.result_text;
    
    // Extract confidence metadata for low-confidence words
    const confidenceMetadata = whisperResult.confidence_metadata || [];
    const lowConfidenceWords = [];
    
    // Process confidence metadata to identify low-confidence words
    confidenceMetadata.forEach((line, lineIndex) => {
      line.forEach(wordData => {
        if (parseFloat(wordData.confidence) < 0.8) {
          lowConfidenceWords.push({
            text: wordData.text,
            confidence: wordData.confidence,
            lineIndex: lineIndex
          });
        }
      });
    });
    
    // Analyze structure with Claude and get compressed nodes
    // Pass the original image URL, low confidence words, and text quality to Claude
    const { structuralAnalysis, compressedNodes } = await claude.analyzeStructure(
      extractedText,
      image.imageUrl,
      lowConfidenceWords,
      textQuality
    );
    
    // Rest of the function remains the same...
  } catch (error) {
    // Error handling...
  }
};
```

### 5. Update `processDocumentSession` Function

Ensure the text quality is passed through the entire pipeline:

```typescript
// In processDocumentSession function, when processing each image:
const result = await processPendingImage(imageData);
```

## Testing Plan

1. **Unit Tests**:
   - Test `getTextQualityInstructions` with different text quality values
   - Test image URL formatting in Claude messages
   - Test confidence metadata extraction and formatting

2. **Integration Tests**:
   - Test end-to-end processing with printed text images
   - Test end-to-end processing with handwritten text images
   - Test with images containing corrections and annotations

3. **Manual Testing**:
   - Upload images with known formatting challenges (crossed-out text, insertions)
   - Compare results with and without image inclusion
   - Verify that text quality selection affects the processing results

## Rollout Plan

1. **Development Phase** (2 days):
   - Implement changes to Claude service
   - Implement changes to LLMWhisperer service
   - Add unit tests

2. **Testing Phase** (1 day):
   - Run integration tests
   - Perform manual testing
   - Fix any issues discovered

3. **Deployment** (1 day):
   - Deploy to staging environment
   - Verify functionality in staging
   - Deploy to production

## Monitoring and Evaluation

1. **Metrics to Track**:
   - Processing accuracy (measured by user edits required)
   - Processing time (to ensure image inclusion doesn't significantly impact performance)
   - Error rates in different processing stages

2. **User Feedback**:
   - Collect feedback from teachers on the accuracy of processed documents
   - Compare feedback before and after the enhancement

## Conclusion

Including the original image with the Claude prompt is expected to significantly improve the accuracy of document processing, especially for handwritten documents with corrections and annotations. This enhancement leverages Claude's visual capabilities to provide a more complete understanding of the document, resulting in better structural analysis and more accurate text extraction.