# Document Services Refactoring Plan

## Overview

Following our functional programming principles, we need to refactor our document processing and session management services away from class-based patterns to a more functional approach.

## Environment Setup

Create `.env` file with required API keys:

```env
ANTHROPIC_API_KEY=your_key_here
LLM_WHISPERER_API_KEY=your_key_here
```

## Service Refactoring

### 1. Document Session Management

Convert `DocumentSessionService` class to pure functions in `src/lib/services/documentSession.ts`:

```typescript
export const createSession = async (
	userId: string,
	expectedPages: number
): Promise<DocumentSession> => {
	// Create new session with:
	// - Unique sessionId
	// - Initial status: 'COLLECTING'
	// - Expiry time: 10 minutes
	// - Track received pages and total size
};

export const getActiveSession = async (userId: string): Promise<DocumentSession | null> => {
	// Find non-expired session in 'COLLECTING' state
};

export const addImageToSession = async (
	session: DocumentSession,
	pendingImage: PendingImage
): Promise<void> => {
	// Validate total size
	// Extract and validate CDN URL expiry
	// Update session with new image
	// Trigger processing if all pages received
};

export const cancelSession = async (sessionId: string): Promise<void> => {
	// Mark session as failed
};

export const cleanupExpiredSessions = async (): Promise<void> => {
	// Find and mark expired sessions as failed
};

export const checkSessionUrlExpiry = async (sessionId: string): Promise<boolean> => {
	// Check if any CDN URLs in session have expired
};
```

### 2. Document Processing

Convert `DocumentProcessingService` class to pure functions in `src/lib/services/documentProcessing.ts`:

```typescript
export const processSession = async (sessionId: string): Promise<void> => {
	// Get session and images
	// Process each image
	// Combine results
	// Update session status
	// Clean up pending images
};

export const processImage = async (
	image: PendingImage,
	userId: string
): Promise<DocumentProcessResponse> => {
	// Check URL expiry
	// Convert image to base64
	// Get bot token
	// Call LLM Whisperer for OCR
	// Call Claude for analysis
	// Return combined results
};
```

### 3. Claude Integration

Create new file `src/lib/services/claude.ts` for Claude-specific functions:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // Uses ANTHROPIC_API_KEY from env

export const analyzeStructure = async (text: string): Promise<StructuralAnalysis> => {
	// Use Claude to analyze document structure
	// Identify headers, paragraphs, lists
};

export const verifyText = async (text: string): Promise<TextVerification> => {
	// Use Claude to verify text accuracy
	// Identify potential OCR errors
	// Suggest corrections
};
```

### 4. Document Handler

Convert `DocumentHandler` class to pure functions in `src/lib/discord/handlers/document.ts`:

```typescript
export const handleImageAttachments = async (
	message: MessageData,
	sendMessage: (channelId: string, content: string, components?: ActionRow[]) => Promise<void>
): Promise<void> => {
	// Filter valid images
	// Check for active session
	// Handle single/multi-page documents
};

export const handleMultiPageDocument = async (
	message: MessageData,
	images: MessageData['attachments'],
	session: DocumentSession,
	sendMessage: (channelId: string, content: string, components?: ActionRow[]) => Promise<void>
): Promise<void> => {
	// Validate page count
	// Process images
	// Send status updates
};

export const processImagesIndividually = async (
	message: MessageData,
	images: MessageData['attachments'],
	sendMessage: (channelId: string, content: string, components?: ActionRow[]) => Promise<void>
): Promise<void> => {
	// Create single-page sessions
	// Process each image
};

export const promptForPageCount = async (
	channelId: string,
	sendMessage: (channelId: string, content: string, components?: ActionRow[]) => Promise<void>
): Promise<void> => {
	// Send interactive message for page count selection
};
```

## Implementation Order

1. Set up environment variables
2. Implement Claude integration service
3. Refactor document session management
4. Refactor document processing
5. Refactor document handler
6. Update any dependent components to use new functional APIs

## Benefits

- Better adherence to functional programming principles
- Improved testability with pure functions
- Easier to reason about data flow
- More modular and composable code
- Reduced state management complexity
- Clearer separation of concerns

## Notes

- All functions should be pure where possible
- Use composition over inheritance
- Minimize shared state
- Use TypeScript's type system for better safety
- Document all functions with JSDoc comments
- Add appropriate error handling
- Consider adding retry logic for API calls
