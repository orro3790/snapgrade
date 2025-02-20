# Discord Bot Implementation Plan

## Overview
We need to implement a Discord bot that can:
1. Receive photos from teachers
2. Authenticate users against Firebase
3. Process images through LLM Whisperer for OCR
4. Store results in Firestore
5. Handle document processing workflow

## Current State Analysis
- Discord schemas defined for:
  - User authentication mappings
  - Message attachments
  - Document processing
- Existing services:
  - documentProcessing.ts for OCR and analysis
  - documentSession.ts for managing upload sessions
  - claude.ts for text analysis

## Implementation Plan

### 1. Message Processing Functions
Location: `src/lib/discord/messageHandlers.ts`
```typescript
export const handleIncomingMessage = async (message: MessageData): Promise<void>;
export const handleAttachments = async (attachments: Attachment[], userId: string): Promise<void>;
export const sendStatusMessage = async (channelId: string, content: string): Promise<void>;
```

### 2. Authentication Functions
Location: `src/lib/discord/auth.ts`
```typescript
export const verifyDiscordUser = async (discordId: string): Promise<AuthResult>;
export const updateLastUsed = async (discordId: string): Promise<void>;
```

### 3. LLM Whisperer Integration
Location: `src/lib/services/llmWhispererService.ts`
```typescript
export const processImage = async (imageData: string, userId: string): Promise<ProcessingResult>;
export const checkProcessingStatus = async (whisperHash: string): Promise<ProcessingStatus>;
export const retrieveProcessedText = async (whisperHash: string): Promise<ExtractedText>;
```

### 4. Document Session Management
Location: `src/lib/services/documentSessionService.ts`
```typescript
export const createDocumentSession = async (userId: string, expectedPages: number): Promise<string>;
export const addImageToSession = async (sessionId: string, imageData: ImageData): Promise<void>;
export const finalizeSession = async (sessionId: string): Promise<void>;
```

### 5. Gateway Event Handlers
Location: `src/lib/discord/events.ts`
```typescript
export const handleDispatch = async (payload: GatewayPayload): Promise<void>;
export const handleMessageCreate = async (data: MessageData): Promise<void>;
```

## Implementation Order

1. Authentication Flow
   - Implement user verification
   - Add status checking
   - Handle auth states

2. Image Processing Pipeline
   - Convert attachments to base64
   - Integrate with LLM Whisperer
   - Handle OCR results

3. Document Session Flow
   - Create sessions for uploads
   - Track processing status
   - Store results in Firestore

4. User Communication
   - Send status updates
   - Handle errors
   - Provide completion notifications

5. Gateway Integration
   - Connect event handlers
   - Handle reconnection
   - Manage WebSocket state

## Security Considerations

- Rate limiting per user
- File type validation
- Size restrictions (10 MiB total limit)
- Token security
- Error logging

## Error Handling Strategy

- Graceful degradation
- User-friendly messages
- Detailed logging
- Automatic retries for transient failures

## Next Steps

1. Implement auth functions
2. Add LLM Whisperer service
3. Create document session handlers
4. Add user communication
5. Connect gateway handlers

Would you like to proceed with this implementation plan? Once approved, we can switch to Code mode to begin implementation.