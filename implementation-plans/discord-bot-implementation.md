# Discord Bot and Document Processing Implementation Plan

## Overview

Implementation plan for the Discord bot message handler and document processing pipeline, with support for both single and multi-page document processing.

## 1. Multi-File Document Handling

### Document Session Management

- Track related uploads using a document session
- Allow teachers to indicate multi-page documents
- Support flexible upload patterns

```typescript
// Add to schemas/documentSession.ts
export const documentSessionSchema = z.object({
	sessionId: z.string(),
	userId: z.string(),
	status: z.enum(['COLLECTING', 'PROCESSING', 'COMPLETED', 'FAILED']),
	pageCount: z.number().optional(),
	createdAt: z.date(),
	expiresAt: z.date(),
	completedAt: z.date().optional()
});

// Update pending-image.ts
export const pendingImageSchema = pendingImageSchema.extend({
	sessionId: z.string().optional(),
	pageNumber: z.number().optional()
});
```

### User Interaction Flow

1. Initial Upload

   - Bot responds: "Is this a multi-page document? (Yes/No)"
   - If Yes:
     - "How many pages total?"
     - Create document session
     - Track uploaded pages
   - If No:
     - Process as single document

2. Multi-page Upload

   - Track uploads within session
   - Show progress (e.g., "Received page 2 of 5")
   - Auto-complete when all pages received
   - Allow manual completion

3. Session Management
   - 10-minute timeout for completing uploads
   - Allow manual session cancellation
   - Support for adding/removing pages

## 2. Discord Bot Message Handler

### Core Functionality

- Listen for image attachments
- Handle single/multi-page scenarios
- Validate user authentication
- Manage document sessions
- Queue processing

### Implementation Flow

1. Message with image(s) received
2. Validate user status
3. Check for active session
   - If exists: Add to session
   - If not: Ask about multi-page
4. Create pending image record(s)
5. Queue for processing when ready
6. Update status throughout

## 3. Document Processing Pipeline

### Core Components

1. Image Processing

   - Process individual pages
   - Maintain page order
   - Combine multi-page results

2. Text Analysis

   - Extract text structure
   - Verify text quality
   - Handle multi-page context

3. Storage
   - Store complete document
   - Track page relationships
   - Handle session status

## Implementation Steps

### Phase 1: Session Management

1. Implement document session schema
2. Add session tracking
3. Create user interaction flows
4. Add timeout handling

### Phase 2: Discord Integration

1. Set up message listeners
2. Add multi-page prompts
3. Implement session management
4. Handle user responses

### Phase 3: Document Processing

1. Process individual pages
2. Combine multi-page documents
3. Generate complete analysis
4. Store final results

## Error Handling

- Incomplete uploads
- Session timeouts
- Out-of-order pages
- Processing failures
- Missing pages

## User Experience

- Clear progress indicators
- Simple session management
- Flexible upload patterns
- Error recovery options

### Example Bot Interactions

```
Teacher: [uploads image]
Bot: "Is this a multi-page document? (Yes/No)"

Teacher: "Yes"
Bot: "How many pages should I expect?"

Teacher: "3"
Bot: "Created session for 3-page document. Upload remaining pages within 10 minutes.
     Current progress: 1/3 pages"

Teacher: [uploads second image]
Bot: "Received page 2/3. Waiting for 1 more page..."

Teacher: [uploads third image]
Bot: "All pages received! Processing your document..."
```

## Success Criteria

- Seamless handling of single/multi-page documents
- Clear user communication
- Accurate page tracking
- Proper document assembly
- Error resilience

## Future Enhancements

(To be implemented based on user feedback)

- Batch processing
- Page reordering
- Preview before processing
- Extended session timeouts
