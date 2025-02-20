# Detailed Document Services Refactoring Implementation Plan

## Overview

This plan details the specific implementation steps for refactoring our document processing and session management services to follow functional programming principles.

## Prerequisites

1. Environment variables are configured:
   - ANTHROPIC_API_KEY: For Claude API integration
   - LLM_WHISPERER_API_KEY: For OCR and document processing

## Implementation Steps

### 1. Claude Integration Service (src/lib/services/claude.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';

// Initialize client with environment variable
const client = new Anthropic();

export interface StructuralAnalysis {
  headers: string[];
  paragraphs: string[];
  lists: Array<{
    items: string[];
    type: 'ordered' | 'unordered';
  }>;
}

export interface TextVerification {
  corrections: Array<{
    original: string;
    suggested: string;
    confidence: number;
  }>;
  grammarIssues: Array<{
    text: string;
    issue: string;
    suggestion: string;
  }>;
}

/**
 * Analyzes document structure using Claude
 * @param text Raw text to analyze
 * @returns Structured analysis of the document
 */
export const analyzeStructure = async (text: string): Promise<StructuralAnalysis> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Analyze this text and identify its structure:
      
${text}

Return the analysis as a JSON object with these properties:
- headers: Array of header text
- paragraphs: Array of paragraph text
- lists: Array of list objects with items and type (ordered/unordered)`
    }]
  });

  return JSON.parse(message.content[0].text);
};

/**
 * Verifies text accuracy and suggests improvements
 * @param text Text to verify
 * @returns Verification results with corrections
 */
export const verifyText = async (text: string): Promise<TextVerification> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Review this text for accuracy and suggest improvements:
      
${text}

Return the analysis as a JSON object with these properties:
- corrections: Array of {original, suggested, confidence}
- grammarIssues: Array of {text, issue, suggestion}`
    }]
  });

  return JSON.parse(message.content[0].text);
};
```

### 2. Document Session Management (src/lib/services/documentSession.ts)

```typescript
import { v4 as uuidv4 } from 'uuid';
import type { DocumentSession, PendingImage } from '../schemas/documentSession';

const SESSION_EXPIRY_MINUTES = 10;

/**
 * Creates a new document processing session
 */
export const createSession = async (
  userId: string,
  expectedPages: number
): Promise<DocumentSession> => {
  const session: DocumentSession = {
    sessionId: uuidv4(),
    userId,
    status: 'COLLECTING',
    expectedPages,
    receivedPages: 0,
    totalSize: 0,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60000),
    images: []
  };

  await db.sessions.create(session);
  return session;
};

// Additional functions as outlined in the original plan...
```

### 3. Document Processing Service (src/lib/services/documentProcessing.ts)

```typescript
import { LLMWhispererClient } from 'llmwhisperer-client';
import type { DocumentProcessResponse } from '../schemas/documentProcessing';
import { analyzeStructure, verifyText } from './claude';

const llmWhisperer = new LLMWhispererClient({
  apiKey: process.env.LLM_WHISPERER_API_KEY
});

/**
 * Processes a document session
 */
export const processSession = async (sessionId: string): Promise<void> => {
  const session = await db.sessions.findById(sessionId);
  if (!session) throw new Error('Session not found');

  try {
    // Process each image
    const results = await Promise.all(
      session.images.map(img => processImage(img, session.userId))
    );

    // Combine results
    const combinedText = results.map(r => r.text).join('\n\n');
    
    // Analyze structure and verify text
    const [structure, verification] = await Promise.all([
      analyzeStructure(combinedText),
      verifyText(combinedText)
    ]);

    // Update session with results
    await db.sessions.update(sessionId, {
      status: 'COMPLETED',
      results: {
        text: combinedText,
        structure,
        verification
      }
    });

  } catch (error) {
    await db.sessions.update(sessionId, { status: 'FAILED' });
    throw error;
  }
};

// Additional functions as outlined in the original plan...
```

### 4. Document Handler (src/lib/discord/handlers/document.ts)

```typescript
import type { MessageData, ActionRow } from '../schemas/discord';
import * as documentSession from '../../services/documentSession';
import * as documentProcessing from '../../services/documentProcessing';

/**
 * Handles image attachments in Discord messages
 */
export const handleImageAttachments = async (
  message: MessageData,
  sendMessage: (channelId: string, content: string, components?: ActionRow[]) => Promise<void>
): Promise<void> => {
  const images = message.attachments.filter(att => 
    att.contentType?.startsWith('image/'));

  if (images.length === 0) return;

  if (images.length === 1) {
    // Single image processing
    await processImagesIndividually(message, images, sendMessage);
  } else {
    // Check for active session or prompt for page count
    const activeSession = await documentSession.getActiveSession(message.author.id);
    if (activeSession) {
      await handleMultiPageDocument(message, images, activeSession, sendMessage);
    } else {
      await promptForPageCount(message.channelId, sendMessage);
    }
  }
};

// Additional functions as outlined in the original plan...
```

## Testing Strategy

1. Unit Tests
   - Test each pure function in isolation
   - Mock external services (Claude, LLMWhisperer)
   - Test error handling and edge cases

2. Integration Tests
   - Test service interactions
   - Test complete document processing flow
   - Verify webhook handling

3. E2E Tests
   - Test Discord bot interaction
   - Verify document processing results
   - Test session management

## Migration Plan

1. Deploy new services alongside existing ones
2. Gradually migrate traffic to new services
3. Monitor for errors and performance issues
4. Remove old services once migration is complete

## Error Handling

- Implement proper error handling for API calls
- Add retry logic for transient failures
- Log errors with appropriate context
- Provide meaningful error messages to users

## Monitoring

- Add logging for key operations
- Track API call latencies
- Monitor session states
- Alert on critical failures

## Documentation

- Update API documentation
- Add JSDoc comments for all functions
- Document error handling procedures
- Update integration guides