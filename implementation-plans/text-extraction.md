# Text Extraction Implementation Plan

## 1. Overview

This document outlines the implementation plan for the text extraction phase of our document processing pipeline. After the DocumentBay component has been built, we need to implement the process of sending photos from the Discord bot to the LLM Whisperer service for OCR processing, as described in section 1.2 of the workflow.

## 2. LLM Whisperer Integration

Based on the research conducted, LLM Whisperer is a powerful OCR and text extraction service that can process various document types including images and PDFs. It provides a comprehensive API suite for document processing, text extraction, and result management. Here's what we know about its capabilities:

### 2.1 Key Features

- **Multiple Processing Modes**: 
  - Native Text (very fast, for PDFs with embedded text)
  - Low Cost (fast, basic OCR capabilities)
  - High Quality (medium speed, advanced OCR with AI/ML enhancement)
  - Form (medium speed, supports checkbox/radio button detection)

- **Document Type Support**:
  - Images (JPEG, PNG, etc.)
  - PDFs (scanned and native)
  - MS Office documents
  - LibreOffice documents

- **Output Formats**:
  - Layout Preserving (maintains document structure, optimized for LLMs)
  - Text (raw text extraction)

- **Advanced Features**:
  - Handwriting recognition (in High Quality and Form modes)
  - Rotation and skew compensation
  - Layout preservation
  - Multi-language support (300+ languages in High Quality mode)

### 2.2 Integration Options

LLM Whisperer provides a comprehensive JavaScript client that can be easily integrated into our Node.js application:

```javascript
// Installation
// npm install llmwhisperer-client

// Usage
const { LLMWhispererClientV2 } = require("llmwhisperer-client");

// Create a new client with options
const client = new LLMWhispererClientV2({
  baseUrl: "<base URL>", // Optional, defaults to https://llmwhisperer-api.us-central.unstract.com/api/v2
  apiKey: "<API key>",   // Required if LLMWHISPERER_API_KEY env variable is not set
  loggingLevel: "info"   // Optional, defaults to 'error'
});

// Process a document (synchronous approach)
const whisper = await client.whisper({
  filePath: 'path/to/image.jpg',
  mode: 'high_quality',           // Options: native_text, low_cost, high_quality, form
  outputMode: 'layout_preserving', // Options: layout_preserving, text
  waitForCompletion: true,        // Wait for processing to complete
  waitTimeout: 60                 // Timeout in seconds before switching to async
});

// For async processing, poll for status and retrieve results
const whisper = await client.whisper({
  filePath: 'path/to/image.jpg',
  mode: 'high_quality',
  outputMode: 'layout_preserving'
});
const whisperStatus = await client.whisperStatus(whisper.whisper_hash);
const whisperResult = await client.whisperRetrieve(whisper.whisper_hash);

// Process a document from URL
const whisper = await client.whisper({
  url: 'https://example.com/document.pdf',
  mode: 'high_quality',
  outputMode: 'layout_preserving'
});

// Additional options
const whisper = await client.whisper({
  filePath: 'path/to/image.jpg',
  mode: 'high_quality',
  outputMode: 'layout_preserving',
  pagesToExtract: '1-5,7,21-',    // Extract specific pages
  pageSeparator: '<<<PAGE>>>'     // Custom page separator
});
```

The JavaScript client provides the following methods:

1. `whisper(options)`: Performs a text extraction operation on a document
2. `whisperStatus(whisperHash)`: Retrieves the status of an async whisper operation
3. `whisperRetrieve(whisperHash)`: Retrieves the result of a completed whisper operation
4. `highlightData(whisperHash, searchText)`: Highlights specified text in the extraction result

The client handles all HTTP requests and responses, including error handling through the `LLMWhispererClientException` class, which extends the built-in Error class and adds a `statusCode` property.

#### Environment Variables

The client can be configured using environment variables:

```
LLMWHISPERER_BASE_URL_V2  # Base URL of the API
LLMWHISPERER_API_KEY      # API key for authentication
LLMWHISPERER_LOGGING_LEVEL # Logging level (error, warn, info, debug)
```

These variables are optional and can be overridden by the options provided when creating the client.

## 3. API Endpoints and Processing Flow

LLM Whisperer provides several API endpoints that we'll need to integrate with:

### 3.1 Core API Endpoints

1. **Whisper API** (`/whisper`):
   - Main endpoint for document processing
   - Accepts PDF/scanned documents in `application/octet-stream` format
   - Returns extracted text or a whisper hash for async processing

2. **Status API** (`/whisper-status`):
   - Checks the status of async processing jobs
   - Takes a whisper hash as input
   - Returns processing status (processing, processed, error)

3. **Retrieve API** (`/whisper-retrieve`):
   - Retrieves the extracted text from completed jobs
   - Takes a whisper hash as input
   - Returns the extracted text and metadata

4. **Detail API** (`/whisper-detail`):
   - Provides detailed information about the processing job
   - Includes processing time, page counts, and file size

### 3.2 Implementation Challenges and Solutions

#### 3.2.1 Multi-Photo Document Handling

While LLM Whisperer doesn't explicitly document batch processing for multiple images, we can implement a solution by:

1. **Sequential Processing**: Process each image individually and concatenate the results
2. **PDF Conversion**: Convert multiple images into a single PDF before processing
3. **Context Preservation**: Maintain document context across multiple images

**Recommended Approach**: Process images sequentially with proper metadata to track their relationship, then combine the extracted text with appropriate page separators.

#### 3.2.2 Image Size and Quality Constraints

Based on the documentation, we should consider:

1. **Image Preprocessing**: For low-quality images, use the Low Cost mode which includes median filter and gaussian blur preprocessing
2. **Rotation Handling**: For images that might be rotated, use High Quality mode which includes rotation and skew compensation
3. **Handwriting Support**: For handwritten essays, use High Quality or Form mode

#### 3.2.3 Processing Time and Async Handling

LLM Whisperer supports both synchronous and asynchronous processing:

1. **Sync Mode**: Suitable for single images or small documents
2. **Async Mode**: Required for multi-page documents or when processing takes more than the timeout value (default 200 seconds)

**Recommendation**: Implement async processing with webhook notifications to handle potentially long-running OCR operations.

## 4. Implementation Plan

### 4.1 Phase 1: Discord Bot Integration (2-3 days)

1. **Update Document Session Handler**:
   - Modify `document-session-handler.ts` to track multiple images per document
   - Add metadata for image ordering and relationship

2. **Create LLM Whisperer Service**:
   - Create a new service file `src/lib/services/llmWhispererService.ts`
   - Implement client initialization and configuration
   - Create methods for processing single and multiple images

3. **Update Discord Bot Flow**:
   - Modify the bot to collect all images before initiating processing
   - Add confirmation step before sending to LLM Whisperer

### 4.2 Phase 2: OCR Processing Implementation (3-4 days)

1. **Image Processing Service**:
   - Implement image validation and preprocessing
   - Create queue system for handling multiple documents
   - Add error handling and retry mechanisms

2. **Text Extraction Logic**:
   - Implement the OCR processing with appropriate mode selection
   - Create text post-processing to handle multi-page documents
   - Add metadata extraction for later highlighting

3. **Firestore Integration**:
   - Create schema for storing extracted text
   - Implement storage of raw text in Firestore
   - Add status tracking for the OCR process

### 4.3 Phase 3: Document Structure Analysis (3-4 days)

1. **Structure LLM Integration**:
   - Create service for document structure analysis
   - Implement identification of headers, titles, paragraphs, and lists
   - Add confidence scoring for structural elements

2. **Document Metadata Enhancement**:
   - Update document schema to include structural information
   - Create methods for updating document metadata
   - Implement versioning for document processing stages

### 4.4 Phase 4: Testing and Optimization (2-3 days)

1. **Performance Testing**:
   - Test with various document types and sizes
   - Measure processing time and optimize where possible
   - Implement caching for frequently accessed documents

2. **Error Handling**:
   - Create comprehensive error handling for OCR failures
   - Implement fallback mechanisms for different processing modes
   - Add user feedback for processing status

## 5. Technical Implementation Details

### 5.1 LLM Whisperer Service

```typescript
// src/lib/services/llmWhispererService.ts
import { LLMWhispererClientV2 } from 'llmwhisperer-client';
import { adminDb } from '$lib/firebase/admin';
import type { DocumentSession } from '$lib/schemas/documentSession';

export class LLMWhispererService {
  private client: LLMWhispererClientV2;
  
  constructor() {
    this.client = new LLMWhispererClientV2({
      apiKey: process.env.LLMWHISPERER_API_KEY,
      loggingLevel: 'info'
    });
  }
  
  /**
   * Process a single image URL
   * @param imageUrl URL of the image to process
   * @param options Processing options
   * @returns Processing result or whisper hash for async processing
   */
  async processImage(imageUrl: string, options: {
    mode?: 'native_text' | 'low_cost' | 'high_quality' | 'form',
    outputMode?: 'layout_preserving' | 'text',
    waitForCompletion?: boolean
  } = {}) {
    try {
      const result = await this.client.whisper({
        url: imageUrl,
        mode: options.mode || 'high_quality',
        outputMode: options.outputMode || 'layout_preserving',
        waitForCompletion: options.waitForCompletion || false,
        waitTimeout: 60 // 1 minute timeout before switching to async
      });
      
      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }
  
  /**
   * Process multiple images from a document session
   * @param sessionId Document session ID
   * @returns Processing status
   */
  async processDocumentSession(sessionId: string) {
    try {
      // Get session data
      const sessionDoc = await adminDb.collection('documentSessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error(`Document session ${sessionId} not found`);
      }
      
      const session = sessionDoc.data() as DocumentSession;
      
      // Update session status
      await adminDb.collection('documentSessions').doc(sessionId).update({
        status: 'processing',
        processingStartedAt: new Date()
      });
      
      // Process each image in order
      const imageResults = [];
      for (const [index, imageUrl] of session.imageUrls.entries()) {
        const result = await this.processImage(imageUrl, {
          mode: 'high_quality',
          outputMode: 'layout_preserving',
          waitForCompletion: true
        });
        
        imageResults.push({
          index,
          imageUrl,
          result
        });
        
        // Update progress
        await adminDb.collection('documentSessions').doc(sessionId).update({
          processingProgress: {
            current: index + 1,
            total: session.imageUrls.length
          }
        });
      }
      
      // Combine results
      const combinedText = imageResults
        .sort((a, b) => a.index - b.index)
        .map(r => r.result.extraction.result_text)
        .join('\n\n<<< PAGE BREAK >>>\n\n');
      
      // Store the extracted text
      await adminDb.collection('documentSessions').doc(sessionId).update({
        status: 'extracted',
        extractedText: combinedText,
        processingCompletedAt: new Date()
      });
      
      // Create document record
      const docRef = await adminDb.collection('documents').add({
        sessionId,
        userId: session.userId,
        rawText: combinedText,
        status: 'unprocessed',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        success: true,
        documentId: docRef.id
      };
    } catch (error) {
      console.error('Error processing document session:', error);
      
      // Update session with error
      await adminDb.collection('documentSessions').doc(sessionId).update({
        status: 'error',
        error: error.message,
        processingCompletedAt: new Date()
      });
      
      throw error;
    }
  }
  
  /**
   * Check status of an async processing job
   * @param whisperHash Hash returned from async processing
   * @returns Current status
   */
  async checkProcessingStatus(whisperHash: string) {
    try {
      return await this.client.whisperStatus(whisperHash);
    } catch (error) {
      console.error('Error checking processing status:', error);
      throw error;
    }
  }
  
  /**
   * Retrieve results of an async processing job
   * @param whisperHash Hash returned from async processing
   * @returns Processing results
   */
  async retrieveProcessingResults(whisperHash: string) {
    try {
      return await this.client.whisperRetrieve(whisperHash);
    } catch (error) {
      console.error('Error retrieving processing results:', error);
      throw error;
    }
  }
}

export const llmWhispererService = new LLMWhispererService();
```

### 5.2 Discord Bot Integration

```typescript
// Update to src/lib/discord/document-session-handler.ts
import { adminDb } from '$lib/firebase/admin';
import { llmWhispererService } from '$lib/services/llmWhispererService';
import type { DocumentSession } from '$lib/schemas/documentSession';

export async function startDocumentSession(userId: string): Promise<string> {
  const sessionRef = await adminDb.collection('documentSessions').add({
    userId,
    status: 'collecting',
    imageUrls: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return sessionRef.id;
}

export async function addImageToSession(
  sessionId: string, 
  imageUrl: string
): Promise<void> {
  const sessionRef = adminDb.collection('documentSessions').doc(sessionId);
  
  await adminDb.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const session = sessionDoc.data() as DocumentSession;
    const updatedImageUrls = [...session.imageUrls, imageUrl];
    
    transaction.update(sessionRef, { 
      imageUrls: updatedImageUrls,
      updatedAt: new Date()
    });
  });
}

export async function completeDocumentSession(
  sessionId: string
): Promise<void> {
  const sessionRef = adminDb.collection('documentSessions').doc(sessionId);
  
  await adminDb.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    transaction.update(sessionRef, { 
      status: 'ready_for_processing',
      updatedAt: new Date()
    });
  });
  
  // Start processing in the background
  llmWhispererService.processDocumentSession(sessionId)
    .catch(error => console.error(`Error processing session ${sessionId}:`, error));
}
```

## 6. Next Steps

After implementing the text extraction phase, we will need to:

1. **Implement Document Structure Analysis**:
   - Create a service that uses a Structure LLM to identify document elements
   - Update the document schema to include structural information
   - Implement UI for reviewing and adjusting structural analysis

2. **Develop Teacher Review Interface**:
   - Create UI for reviewing extracted text and structure
   - Implement formatting mode in TextEditor
   - Add custom cursors for different formatting actions

3. **Implement Writing Analysis**:
   - Integrate with Writing Analysis LLM
   - Create services for grammar, spelling, and style checks
   - Convert analysis results to TextNode array

## 7. Conclusion

This implementation plan provides a comprehensive roadmap for building the text extraction phase of our document processing pipeline. By integrating with LLM Whisperer's powerful OCR capabilities, we can efficiently extract text from student essays captured via the Discord bot, preparing them for further processing and teacher review.

Key aspects of this implementation plan include:

1. **LLM Whisperer Integration**: Leveraging the JavaScript client to interact with LLM Whisperer's API endpoints for document processing
2. **Multi-Photo Handling**: Implementing a sequential processing approach to maintain document context across multiple images
3. **Processing Mode Selection**: Using the appropriate processing mode (High Quality, Form) based on document characteristics
4. **Async Processing**: Implementing asynchronous processing with proper status tracking for longer operations
5. **Discord Bot Integration**: Enhancing the Discord bot to collect and manage multiple images per document

The implementation is structured in phases to ensure a systematic approach to development, starting with the Discord bot integration and progressing through OCR processing, document structure analysis, and testing.

By following this approach, we can create a robust and efficient text extraction system that forms the foundation of our essay correction workflow, enabling teachers to quickly and accurately review and provide feedback on student essays.