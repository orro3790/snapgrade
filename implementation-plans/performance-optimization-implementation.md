# Performance Optimization Implementation Plan

This document outlines the comprehensive implementation plan for optimizing the Snapgrade document processing pipeline, with a focus on the Claude service which has been identified as the primary bottleneck.

## 1. Overview

Based on performance logging and code analysis, we've identified several optimization opportunities in the document processing pipeline. The Claude service accounts for approximately 73% of the total processing time, making it the highest priority for optimization.

## 2. Implementation Phases

### Phase 1: Document Size Limits & Claude Service Simplification (1-2 weeks)

#### 1.1 Implement Document Size Limits

**Tasks:**
- Add validation in the Discord bot to limit the number of pages (max 10 pages)
- Add clear user messaging about document size limits
- Update documentation to reflect these limits

**Files to modify:**
- `src/lib/discord/document-session-handler.ts`
- `src/lib/discord/interactive-messages.ts`

**Implementation details:**
```typescript
// In document-session-handler.ts
export const handleImageUpload = async (
  channelId: string,
  userId: string,
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    contentType?: string;
    size: number;
  }>
): Promise<void> => {
  try {
    // Check if there are too many images
    const MAX_PAGES = 10;
    if (attachments.length > MAX_PAGES) {
      await sendInteractiveMessage(
        channelId,
        `You've uploaded ${attachments.length} pages, but the maximum is ${MAX_PAGES}. Please reduce the number of pages and try again.`,
        []
      );
      return;
    }

    // Rest of the function remains the same
    // ...
  } catch (error) {
    // Error handling
  }
};
```

#### 1.2 Remove Chunking for Standard Cases

**Tasks:**
- Modify `analyzeStructure` to handle entire documents directly
- Keep chunking logic only as a fallback for edge cases
- Update error handling for token limit errors

**Files to modify:**
- `src/lib/services/claude.ts`

**Implementation details:**
- Remove direct calls to `analyzeStructureInChunks` for documents under a certain size
- Add a size check before processing to determine if chunking is needed
- Update error handling to provide clear messages about document size limits

### Phase 2: Code Refactoring (2-3 weeks)

#### 2.1 Consolidate Request Content Preparation

**Tasks:**
- Extract a single function for preparing request content
- Update all code paths to use this function
- Add comprehensive tests to ensure behavior is preserved

**Files to modify:**
- `src/lib/services/claude.ts`

**Implementation details:**
```typescript
function prepareRequestContent(
  text: string,
  options: {
    imageData?: { base64: string, mediaType: string },
    lowConfidenceWordsText?: string
  } = {}
): string | ContentBlockParam[] {
  const { imageData, lowConfidenceWordsText = '' } = options;
  
  // Common text content for all scenarios
  const textContent = `Analyze this text and identify its structural elements. Also generate compressed TextNodes for the editor:

${text}
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

// ... rest of the instructions ...`;

  // If we have image data, return content blocks
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
      text: textContent
    };
    
    return [imageBlock, textBlock];
  }
  
  // Otherwise, return just the text content
  return textContent;
}
```

#### 2.2 Simplify Function Structure

**Tasks:**
- Restructure the API to have fewer, more flexible functions
- Maintain backward compatibility through wrapper functions
- Update all calling code to use the new structure

**Files to modify:**
- `src/lib/services/claude.ts`
- `src/lib/services/llmWhispererService.ts` (to update calls to Claude service)

**Implementation details:**
```typescript
export async function analyzeDocument(
  text: string,
  options: {
    imageUrl?: string,
    lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>,
    retryOptions?: { maxAttempts?: number, baseDelay?: number }
  } = {}
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> {
  // Implementation that handles all cases
}

// Backward compatibility wrapper
export const analyzeStructure = async (
  text: string,
  imageUrl?: string,
  lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> => {
  return analyzeDocument(text, { imageUrl, lowConfidenceWords });
};

// Backward compatibility wrapper with retry
export const analyzeStructureWithRetry = (
  text: string,
  imageUrl?: string,
  lowConfidenceWords?: Array<{text: string, confidence: string, lineIndex: number}>
) => {
  return analyzeDocument(text, { 
    imageUrl, 
    lowConfidenceWords,
    retryOptions: { maxAttempts: 3, baseDelay: 1000 }
  });
};
```

### Phase 3: Claude API Optimizations (1-2 weeks)

#### 3.1 Optimize System Prompt

**Tasks:**
- Carefully refine prompts while preserving required output format
- Test different variations to find optimal balance
- Document the changes and their impact

**Files to modify:**
- `src/lib/services/claude.ts`

**Implementation details:**
- Review and streamline the system prompt
- Remove redundant instructions while keeping critical format requirements
- Test with real documents to ensure output format is preserved

#### 3.2 Optimize Response Parsing

**Tasks:**
- Optimize response parsing logic
- Add more efficient error handling
- Benchmark improvements

**Files to modify:**
- `src/lib/services/claude.ts`

**Implementation details:**
- Review and optimize the response parsing logic
- Add more specific error handling for different error types
- Add benchmarking code to measure improvements

## 3. Testing Strategy

### 3.1 Unit Tests

- Add unit tests for new functions
- Update existing tests to reflect changes
- Add specific tests for edge cases (large documents, invalid inputs, etc.)

### 3.2 Integration Tests

- Test the entire document processing pipeline with various document sizes
- Test with different types of documents (text-only, with images, etc.)
- Test error handling and recovery

### 3.3 Performance Benchmarks

- Create a benchmark suite to measure performance improvements
- Compare before and after performance for different document sizes
- Track key metrics (total processing time, time per stage, etc.)

## 4. Rollout Plan

### 4.1 Staging Deployment

- Deploy changes to staging environment
- Run comprehensive tests
- Gather metrics and compare with production

### 4.2 Gradual Production Rollout

- Roll out changes in phases, starting with non-critical components
- Monitor performance and error rates
- Be prepared to roll back if issues arise

### 4.3 Monitoring and Feedback

- Set up monitoring for key performance metrics
- Collect user feedback on performance improvements
- Adjust optimization strategy based on real-world performance

## 5. Resource Requirements

### 5.1 Development Resources

- 1-2 developers for implementation
- 1 QA engineer for testing
- 1 DevOps engineer for deployment and monitoring

### 5.2 Infrastructure Resources

- Staging environment for testing
- Monitoring tools for performance tracking
- Additional Claude API credits for testing

## 6. Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: Document Size Limits & Claude Service Simplification | 1-2 weeks | Week 1 | Week 2 |
| Phase 2: Code Refactoring | 2-3 weeks | Week 3 | Week 5 |
| Phase 3: Claude API Optimizations | 1-2 weeks | Week 6 | Week 7 |
| Phase 4: Image Handling Optimization | 1-2 weeks | Week 8 | Week 9 |
| Testing and Deployment | 2 weeks | Week 10 | Week 11 |

Total estimated time: 11 weeks

## 7. Success Metrics

- 30% reduction in overall document processing time
- 50% reduction in Claude API processing time
- Improved code maintainability (measured by code complexity metrics)
- Reduced error rates in document processing
- Improved user satisfaction with processing speed

## 8. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude API changes | High | Medium | Implement adapter pattern to isolate API-specific code |
| Regression in output quality | High | Low | Comprehensive testing with various document types |
| Performance degradation in edge cases | Medium | Medium | Specific testing for edge cases, fallback mechanisms |
| User resistance to document size limits | Medium | High | Clear communication about limits, gradual rollout |

## 9. Conclusion

This implementation plan provides a comprehensive approach to optimizing the Snapgrade document processing pipeline, with a focus on the Claude service which has been identified as the primary bottleneck. By implementing these optimizations in phases, we can achieve significant performance improvements while maintaining system stability and accuracy.

The most immediate gains will come from simplifying the Claude service and implementing document size limits, which can be done relatively quickly. More complex optimizations like code refactoring and image handling improvements will provide additional benefits but require more careful implementation.