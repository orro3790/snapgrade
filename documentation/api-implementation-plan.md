# API Implementation Plan: Document Processing Endpoint

## Overview

This document outlines the implementation plan for the document processing endpoint that receives documents from the Telegram bot pipeline and processes them for structural analysis and text verification using Claude 3.5 Sonnet.

## Document Processing Flow

1. **Initial Request**

   - Receive image and LLMWhisperer's extracted text
   - Store in Firestore for persistence
   - Send to Claude for:
     a. Text verification (comparing with LLMWhisperer's extraction)
     b. Structural analysis

2. **Initial Response**
   Returns to user:

   - Original LLMWhisperer extraction
   - Claude's verified text
   - Structural analysis
   - Document ID for later retrieval

3. **User Review Stage**

   - User reviews both text versions
   - Makes manual corrections if needed
   - Can retrieve document from Firestore if workflow is interrupted

4. **Final Corrections Stage**
   - After user confirms text accuracy
   - Send to LLM for writing corrections
   - Store final corrected version in Firestore

## API Endpoints

### 1. Initial Processing

`POST /api/documents/process`

Request:

```typescript
{
	image: string; // base64 encoded image
	text: string; // LLMWhisperer's extracted text
	uid: string; // Firebase user ID
	botToken: string; // Bot authentication token
}
```

Response:

```typescript
{
    success: boolean;
    documentId: string;
    originalText: string;    // LLMWhisperer's extraction
    verifiedText: string;    // Claude's verification
    structuralAnalysis: {
        nodes: Node[];       // Structural nodes
    }
}
```

### 2. Writing Analysis (Future Endpoint)

`POST /api/documents/{documentId}/analyze`

## Firestore Document Structure

```typescript
interface DocumentData {
	// Initial data
	originalText: string; // LLMWhisperer extraction
	verifiedText: string; // Claude verification
	image: string; // base64 image
	userId: string;
	createdAt: Timestamp;

	// Processing status
	status: 'processing' | 'awaiting_review' | 'reviewing' | 'correcting' | 'completed';

	// Structural analysis
	nodes: Node[];

	// Final corrections (added later)
	correctedNodes?: Node[];
	correctionDate?: Timestamp;
}
```

## Implementation Steps

1. **API Endpoint Creation**

   - Create endpoint at `src/routes/api/documents/process/+server.ts`
   - Implement request validation using Zod schema
   - Add bot token validation

2. **Claude Integration**

   - Send image and text for verification
   - Get structural analysis
   - Parse and validate responses

3. **Firestore Integration**

   - Store initial document data
   - Support document retrieval
   - Handle status updates

4. **Response Processing**
   - Format Claude's responses
   - Generate structural nodes
   - Validate against schemas

## Claude Prompts

### Text Verification Prompt

```
Here is an image and its OCR-extracted text. Please:
1. Verify the accuracy of the extracted text
2. If there are significant differences, provide your own extraction
3. Return both versions for comparison

Image: [Image]
Extracted text:
[OCR Text]
```

### Structural Analysis Prompt

```
Please analyze the structural elements of this text and identify:
1. The title (if any)
2. Any subtitles or headings
3. Paragraph boundaries

Return the analysis as a JSON array of objects with:
- position: number (word position in text)
- type: "title" | "subtitle" | "heading" | "paragraphStart"
```

## Error Handling

1. **Input Validation**

   - Image format/size validation
   - Text content validation
   - Bot token verification

2. **Processing Errors**

   - Claude API failures
   - Firestore write errors
   - Schema validation errors

3. **Response Format**
   - Consistent error messages
   - Appropriate HTTP status codes
   - Detailed error information

## Next Steps

1. Update document processing schema
2. Implement text verification in Claude integration
3. Update Firestore document structure
4. Create document retrieval endpoint
5. Update Postman collection for testing
