# Snapgrade Improvements Implementation Plan

## Table of Contents

1. [Overview](#overview)
2. [Requirements Analysis](#requirements-analysis)
3. [Current System Analysis](#current-system-analysis)
   - [Processing Flow and Bottlenecks](#processing-flow-and-bottlenecks)
   - [Current Status Tracking Implementation](#current-status-tracking-implementation)
4. [Implementation Plan](#implementation-plan)
   - [1. Processing Status Updates](#1-processing-status-updates)
   - [2. Confirmation Before Processing](#2-confirmation-before-processing)
   - [3. Text Quality Specification](#3-text-quality-specification)
   - [4. Class Manager Improvements](#4-class-manager-improvements)
   - [5. Image Inclusion with Claude Prompt](#5-image-inclusion-with-claude-prompt)
5. [Implementation Timeline](#implementation-timeline)
6. [Conclusions](#conclusions)

## Overview

This document outlines a comprehensive plan to address several key improvements for the Snapgrade application, focusing on enhancing the user experience, improving processing efficiency, and adding new functionality. The plan is based on a thorough analysis of the current codebase and identified bottlenecks.

## Requirements Analysis

The following requirements have been identified:

1. **Processing Status Updates**: Add a button for users to check status updates and view processing images due to slow processing. Identify and address the bottleneck.
2. **Confirmation Before Processing**: Add a final confirmation option before processing starts.
3. **Text Quality Specification**: Evaluate the potential benefits of allowing users to specify text quality (e.g., sloppy writing, children's handwriting) to improve OCR accuracy.
4. **Class Manager Improvements**: Add ability to add/remove classes and students in the Class Manager.
5. **Image Inclusion with Claude Prompt**: Include the original image along with the prompt to Claude to improve formatting accuracy.

## Current System Analysis

### Processing Flow and Bottlenecks

The current document processing pipeline follows these steps:

1. User uploads image(s) in Discord
2. Discord bot receives images and stores them as pending_images in Firestore
3. User creates a document session
4. User selects class and student metadata
5. LLM Whisperer processes images with OCR
6. Claude analyzes text structure
7. Document is created in Firestore
8. User views document in DocumentBay

**Identified Bottlenecks**:

1. **LLM Whisperer Processing**: The OCR processing through LLM Whisperer is the primary bottleneck. This is an external service that can take significant time to process images, especially for multi-page documents.
2. **Claude Analysis**: The structural analysis performed by Claude can also be time-consuming, particularly for large documents.
3. **Lack of Status Updates**: Currently, there's no way for users to check the processing status once it has started, leading to uncertainty and a poor user experience.

### Current Status Tracking Implementation

The current implementation tracks document processing status in the following ways:

1. Document sessions have a `status` field that can be:
   - `collecting`: Still collecting images
   - `processing`: Processing has started
   - `completed`: Processing is complete
   - `failed`: Processing failed

2. LLM Whisperer provides status tracking via:
   - `whisperStatus` method to check processing status
   - Status values include: `accepted`, `processing`, `processed`, `error`, `retrieved`

3. However, this status information is not exposed to the user interface, leaving users in the dark about processing progress.

## Implementation Plan

### 1. Processing Status Updates

#### 1.1 Status Tracking Improvements

**Objective**: Enhance status tracking to provide more granular information about processing stages.

**Implementation**:

1. Modify `processDocumentSession` in `llmWhispererService.ts` to update session status with more detailed progress information:

```typescript
// Update progress for each stage
await updateSessionStatus(sessionId, 'processing', {
  processingProgress: {
    current: index + 1,
    total: sessionImages.length,
    stage: 'ocr_processing', // New field to track processing stage
    startedAt: new Date(),
    estimatedTimeRemaining: estimatedTime // Based on previous processing times
  }
});
```

2. Add new status tracking fields to the document session schema in `documentSession.ts`:

```typescript
processingProgress: z.object({
  current: z.number(),
  total: z.number(),
  stage: z.enum(['queued', 'ocr_processing', 'structure_analysis', 'document_creation']),
  startedAt: z.date(),
  estimatedTimeRemaining: z.number().optional()
}).optional()
```

#### 1.2 Status Update UI

**Objective**: Create a UI component to display processing status and allow users to check progress.

**Implementation**:

1. Create a new `ProcessingStatusModal.svelte` component:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { formatTime } from '$lib/utils/formatters';
  
  export let sessionId: string;
  export let onClose: () => void;
  
  let status = 'loading';
  let progress = { current: 0, total: 0, stage: 'queued', startedAt: new Date() };
  let error = '';
  let intervalId: number;
  
  async function checkStatus() {
    try {
      const response = await fetch(`/api/document-sessions/${sessionId}/status`);
      const data = await response.json();
      
      if (data.success) {
        status = data.status;
        progress = data.processingProgress || progress;
        
        if (status === 'completed') {
          clearInterval(intervalId);
        }
      } else {
        error = data.error || 'Failed to fetch status';
      }
    } catch (err) {
      error = 'Error checking status';
      console.error(err);
    }
  }
  
  onMount(() => {
    checkStatus();
    intervalId = setInterval(checkStatus, 5000); // Check every 5 seconds
  });
  
  onDestroy(() => {
    clearInterval(intervalId);
  });
</script>

<div class="modal">
  <div class="modal-content">
    <h2>Processing Status</h2>
    
    {#if status === 'loading'}
      <Spinner />
      <p>Loading status...</p>
    {:else if status === 'processing'}
      <div class="progress-container">
        <Spinner />
        <p>Processing document ({progress.current} of {progress.total})</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {(progress.current / progress.total) * 100}%"></div>
        </div>
        <p>Current stage: {progress.stage.replace('_', ' ')}</p>
        {#if progress.estimatedTimeRemaining}
          <p>Estimated time remaining: {formatTime(progress.estimatedTimeRemaining)}</p>
        {/if}
      </div>
    {:else if status === 'completed'}
      <div class="success">
        <p>Processing complete!</p>
        <Button on:click={onClose}>View Document</Button>
      </div>
    {:else if status === 'failed'}
      <div class="error">
        <p>Processing failed: {error}</p>
        <Button on:click={onClose}>Close</Button>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal {
    /* Modal styling */
  }
  
  .progress-container {
    /* Progress container styling */
  }
  
  .progress-bar {
    /* Progress bar styling */
  }
  
  .progress-fill {
    /* Progress fill styling */
  }
  
  .success, .error {
    /* Success and error styling */
  }
</style>
```

2. Add a new API endpoint to fetch session status in `src/routes/api/document-sessions/[id]/status/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/firebase/admin';

export async function GET({ params, locals }) {
  try {
    const { id } = params;
    const userId = locals.user?.uid;
    
    if (!userId) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const sessionDoc = await adminDb.collection('document_sessions').doc(id).get();
    
    if (!sessionDoc.exists) {
      return json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = sessionDoc.data();
    
    if (sessionData.userId !== userId) {
      return json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }
    
    return json({
      success: true,
      status: sessionData.status,
      processingProgress: sessionData.processingProgress || null,
      documentId: sessionData.documentId || null
    });
  } catch (error) {
    console.error('Error fetching session status:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
```

3. Modify the Discord bot's interaction handler to provide a status check button after processing starts:

```typescript
// In metadata-handler.ts, after starting processing
sendInteractiveMessage(
  interaction.channel_id,
  "Document processing has started. You can check the status on the web app.",
  [
    {
      type: ComponentType.Button,
      custom_id: `view_status_${sessionId}`,
      label: "Check Processing Status",
      style: ButtonStyle.Primary,
      url: `${process.env.APP_URL}/processing-status?sessionId=${sessionId}`
    }
  ]
);
```

4. Add a route for processing status in `src/routes/processing-status/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import ProcessingStatusModal from '$lib/components/ProcessingStatusModal.svelte';
  import { goto } from '$app/navigation';
  
  let sessionId = $page.url.searchParams.get('sessionId');
  
  function handleClose(documentId?: string) {
    if (documentId) {
      goto(`/documents/${documentId}`);
    } else {
      goto('/documents');
    }
  }
</script>

<div class="container">
  {#if sessionId}
    <ProcessingStatusModal {sessionId} onClose={handleClose} />
  {:else}
    <p>No session ID provided. <a href="/documents">Go to Document Bay</a></p>
  {/if}
</div>

<style>
  .container {
    /* Container styling */
  }
</style>
```

### 2. Confirmation Before Processing

**Objective**: Add a confirmation step before starting document processing.

**Implementation**:

1. Modify the `endDocumentSession` function in `document-session-handler.ts` to add a confirmation step:

```typescript
export const endDocumentSession = async (
  channelId: string,
  userId: string
): Promise<string | null> => {
  try {
    // Get active session
    const session = await getActiveSession(userId);
    
    if (!session) {
      await sendInteractiveMessage(
        channelId,
        "You don't have an active document session.",
        []
      );
      return null;
    }
    
    // Check if any CDN URLs have expired
    const hasExpiredUrls = await checkSessionUrlExpiry(session.sessionId);
    if (hasExpiredUrls) {
      // Handle expired URLs
      return null;
    }
    
    // Show confirmation message with session details
    await sendInteractiveMessage(
      channelId,
      `Ready to process your document with ${session.receivedPages} page(s). This will start the OCR process and may take several minutes. Do you want to continue?`,
      [
        {
          type: ComponentType.Button,
          custom_id: `confirm_process_${session.sessionId}`,
          label: "Yes, Process Document",
          style: ButtonStyle.Success
        },
        {
          type: ComponentType.Button,
          custom_id: `cancel_process_${session.sessionId}`,
          label: "No, Cancel",
          style: ButtonStyle.Danger
        }
      ]
    );
    
    return session.sessionId;
  } catch (error) {
    console.error('Error ending document session:', error);
    await sendInteractiveMessage(
      channelId,
      "Failed to process document. Please try again.",
      []
    );
    return null;
  }
};
```

2. Add handlers for the confirmation buttons in `interaction-handler.ts`:

```typescript
// In handleMessageComponent function
else if (customId.startsWith('confirm_process_')) {
  // Extract session ID from custom_id
  const sessionId = customId.split('_')[2];
  await handleConfirmProcess(interaction, sessionId);
} else if (customId.startsWith('cancel_process_')) {
  // Extract session ID from custom_id
  const sessionId = customId.split('_')[2];
  await handleCancelProcess(interaction, sessionId);
}

// Add new handler functions
const handleConfirmProcess = async (
  interaction: Interaction,
  sessionId: string
): Promise<void> => {
  try {
    // Update the interaction to show processing has started
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "Document processing has been confirmed and will begin now...",
        components: [] // Remove buttons
      }
    });
    
    // Show metadata dialog for document organization
    await showMetadataDialog(interaction.channel_id, interaction.user.id, sessionId);
  } catch (error) {
    console.error('Error confirming process:', error);
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "An error occurred. Please try again.",
        components: [] // Remove buttons
      }
    });
  }
};

const handleCancelProcess = async (
  interaction: Interaction,
  sessionId: string
): Promise<void> => {
  try {
    // Update session status to cancelled
    await adminDb
      .collection('document_sessions')
      .doc(sessionId)
      .update({
        status: 'cancelled',
        updatedAt: new Date()
      });
    
    // Update the interaction to show cancellation
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "Document processing has been cancelled. Your images are still saved and you can process them later.",
        components: [] // Remove buttons
      }
    });
  } catch (error) {
    console.error('Error cancelling process:', error);
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "An error occurred while cancelling. Please try again.",
        components: [] // Remove buttons
      }
    });
  }
};
```

3. Update the document session schema in `documentSession.ts` to include the new status:

```typescript
export const documentSessionSchema = z.object({
  // Existing fields
  status: z.enum(['collecting', 'processing', 'completed', 'failed', 'cancelled']),
  // Other fields
});
```

### 3. Text Quality Specification

**Objective**: Evaluate and implement an option for users to specify text quality to improve OCR accuracy.

**Analysis**:

After researching the LLM Whisperer documentation and Claude capabilities, adding text quality specification would be beneficial for the following reasons:

1. It would allow Claude to apply specialized processing for different handwriting styles
2. It could improve OCR accuracy for challenging inputs like children's handwriting
3. It would provide valuable context that Claude could use when analyzing the structure

The implementation would involve:

1. Adding a text quality selection step in the Discord workflow
2. Passing this information to Claude during processing
3. Modifying Claude's prompt to include the quality information

**Implementation**:

1. Add a text quality selection step after confirming processing in `interaction-handler.ts`:

```typescript
const handleConfirmProcess = async (
  interaction: Interaction,
  sessionId: string
): Promise<void> => {
  try {
    // Update the interaction to show text quality selection
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: "Please select the text quality to help improve processing accuracy:",
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.SelectMenu,
                custom_id: `text_quality_${sessionId}`,
                placeholder: "Select text quality",
                options: [
                  {
                    label: "Standard Typed Text",
                    value: "standard",
                    description: "Clearly typed or printed text"
                  },
                  {
                    label: "Neat Handwriting",
                    value: "neat_handwriting",
                    description: "Clear, legible handwriting"
                  },
                  {
                    label: "Sloppy Handwriting",
                    value: "sloppy_handwriting",
                    description: "Difficult to read handwriting"
                  },
                  {
                    label: "Children's Handwriting",
                    value: "children_handwriting",
                    description: "Handwriting by young students"
                  },
                  {
                    label: "Low Quality Scan/Photo",
                    value: "low_quality",
                    description: "Blurry or low-resolution image"
                  }
                ]
              }
            ]
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error showing text quality selection:', error);
    // Error handling
  }
};
```

2. Add a handler for the text quality selection in `interaction-handler.ts`:

```typescript
else if (customId.startsWith('text_quality_')) {
  // Extract session ID from custom_id
  const sessionId = customId.split('_')[2];
  const textQuality = interaction.data?.values?.[0];
  await handleTextQualitySelection(interaction, sessionId, textQuality);
}

const handleTextQualitySelection = async (
  interaction: Interaction,
  sessionId: string,
  textQuality: string
): Promise<void> => {
  try {
    // Update session with text quality
    await adminDb
      .collection('document_sessions')
      .doc(sessionId)
      .update({
        textQuality,
        updatedAt: new Date()
      });
    
    // Update the interaction to show processing will begin
    await respondToInteraction(interaction, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: `Text quality set to: ${textQuality.replace('_', ' ')}. Document processing will begin now...`,
        components: [] // Remove components
      }
    });
    
    // Show metadata dialog for document organization
    await showMetadataDialog(interaction.channel_id, interaction.user.id, sessionId);
  } catch (error) {
    console.error('Error handling text quality selection:', error);
    // Error handling
  }
};
```

3. Update the document session schema in `documentSession.ts` to include text quality:

```typescript
export const documentSessionSchema = z.object({
  // Existing fields
  textQuality: z.enum([
    'standard',
    'neat_handwriting',
    'sloppy_handwriting',
    'children_handwriting',
    'low_quality'
  ]).optional(),
  // Other fields
});
```

4. Modify the Claude prompt in `claude.ts` to include text quality information:

```typescript
// In analyzeStructure function
const textQualityInstructions = getTextQualityInstructions(textQuality);

const response = await client.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 20000,
  system: `You are a document structure analyzer that identifies structural elements in text and generates compressed TextNodes for the editor. Be precise and thorough in your analysis. NEVER truncate your response, even for large documents. ${textQualityInstructions}`,
  // Rest of the function
});

// Helper function to get text quality instructions
function getTextQualityInstructions(textQuality?: string): string {
  switch (textQuality) {
    case 'neat_handwriting':
      return "The text comes from neat handwriting. Pay attention to potential inconsistencies in letter spacing and alignment.";
    case 'sloppy_handwriting':
      return "The text comes from sloppy handwriting. Be forgiving of spelling errors and unusual spacing. Focus on extracting the intended meaning rather than literal transcription.";
    case 'children_handwriting':
      return "The text comes from a child's handwriting. Expect simplified vocabulary, spelling errors, and unconventional grammar. Be especially forgiving of errors while preserving the original meaning.";
    case 'low_quality':
      return "The text comes from a low-quality scan or photo. There may be artifacts, blurring, or partial text. Focus on extracting what is clearly visible and indicate uncertainty where appropriate.";
    default:
      return ""; // No special instructions for standard text
  }
}
```

### 4. Class Manager Improvements

**Objective**: Add functionality to add/remove classes and students in the Class Manager.

**Implementation**:

1. Create a new `ClassForm.svelte` component for adding/editing classes
2. Create a new `StudentForm.svelte` component for adding/editing students
3. Update the `ClassManager.svelte` component to include add/remove functionality
4. Create API endpoints for class and student management

### 5. Image Inclusion with Claude Prompt

**Objective**: Include the original image along with the prompt to Claude to improve formatting accuracy.

**Analysis**:

Based on the research of Claude's capabilities, including the original image in the prompt would significantly improve formatting accuracy. Claude can analyze both the text and the visual layout, which would help with:

1. Identifying text that was erased but not fully removed
2. Recognizing inserted words between lines
3. Understanding crossed-out words
4. Preserving the original formatting and structure

**Implementation**:

1. Modify the `analyzeStructure` function in `claude.ts` to accept an image URL:

```typescript
export const analyzeStructure = async (
  text: string,
  imageUrl?: string
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> => {
  try {
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

For the compressed nodes, create a JSON array where each node uses the compact format:
{
  "i": "unique-id", // id
  "t": "normal", // type (normal, spacer, correction)
  "x": "word", // text (optional for spacers)
  "s": "paragraphBreak", // spacer subtype (optional)
  "r": "title", // structural role (optional)
  "m": { // metadata
    "p": 0, // position
    "w": false, // isWhitespace
    "u": false, // isPunctuation
    "s": 0, // startIndex
    "e": 0 // endIndex
  }
}`
    });
    
    const response = await client.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 20000,
      system: "You are a document structure analyzer that identifies structural elements in text and generates compressed TextNodes for the editor. Be precise and thorough in your analysis. NEVER truncate your response, even for large documents. If the document is too large, focus on providing accurate structural analysis for the content you can process. IMPORTANT: Do not create spacer nodes for regular whitespace between words or for line breaks within the same paragraph - only create spacer nodes for paragraph breaks and paragraph indentation.",
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
    
    // Rest of the function remains the same
    // ...
  } catch (error) {
    // Error handling
    // ...
  }
};
```

2. Modify the `processPendingImage` function in `llmWhispererService.ts` to pass the image URL to Claude:

```typescript
export const processPendingImage = async (image: PendingImage) => {
  try {
    // Process with LLM Whisperer
    const whisperResult = await processImage(image.imageUrl, {
      mode: 'high_quality',
      outputMode: 'text',
      waitForCompletion: true
    });
    
    // Extract text from result
    const extractedText = whisperResult.extraction.result_text;
    
    // Analyze structure with Claude and get compressed nodes
    // Pass the original image URL to Claude for better analysis
    const { structuralAnalysis, compressedNodes } = await claude.analyzeStructure(
      extractedText,
      image.imageUrl // Pass the image URL
    );
    
    // Rest of the function remains the same
    // ...
  } catch (error) {
    // Error handling
    // ...
  }
};
```

3. Update the `analyzeStructureInChunks` function in `claude.ts` to handle images:

```typescript
export const analyzeStructureInChunks = async (
  text: string,
  imageUrl?: string
): Promise<{
  structuralAnalysis: StructuralAnalysis;
  compressedNodes?: string;
}> => {
  // For small texts, use the regular method with image
  if (text.length <= MAX_CHUNK_SIZE) {
    return analyzeStructure(text, imageUrl);
  }
  
  // For large texts, we'll need to process in chunks
  // but we can still use the image for the first chunk to get context
  const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
  
  let allNodes: CompressedNode[] = [];
  let structuralElements: StructuralAnalysis = [];
  let position = 0;
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Only pass the image URL for the first chunk
    const result = await analyzeStructure(
      chunk,
      i === 0 ? imageUrl : undefined
    );
    
    // Rest of the function remains the same
    // ...
  }
  
  // Return combined results
  // ...
};
```

## Implementation Timeline

The implementation will be carried out in the following phases:

### Phase 1: Processing Status Updates (2 days)
- Enhance status tracking in backend services
- Create status update UI components
- Add API endpoints for status checking
- Integrate with Discord bot

### Phase 2: Confirmation Before Processing (1 day)
- Modify document session handler to add confirmation step
- Add handlers for confirmation buttons
- Update schema to include new status

### Phase 3: Text Quality Specification (1 day)
- Add text quality selection step
- Update schema to include text quality
- Modify Claude prompt to include quality instructions

### Phase 4: Class Manager Improvements (3 days)
- Create form components for classes and students
- Update ClassManager component
- Add API endpoints for CRUD operations
- Test and refine UI

### Phase 5: Image Inclusion with Claude (2 days)
- Modify Claude service to accept image URLs
- Update processing pipeline to pass images
- Test and optimize image handling

### Phase 6: Testing and Refinement (2 days)
- Comprehensive testing of all new features
- Performance optimization
- Bug fixes and refinements

## Conclusions

### Processing Status Updates

The current system lacks transparency during document processing, leaving users uncertain about progress. Our solution introduces a comprehensive status tracking system with two key components:

1. **Discord Bot Integration**: We'll enhance the Discord bot to provide status updates directly in the chat where users initiate processing. This includes a status command and interactive buttons that link to a detailed status page.

2. **Web Status Dashboard**: We'll create a dedicated status page that shows real-time progress, including which processing stage the document is in (OCR, structure analysis, etc.) and estimated completion time.

This approach addresses user frustration by providing visibility into the process, setting appropriate expectations, and giving users confidence that their document is being processed correctly.

### Confirmation Before Processing

Adding a confirmation step before processing starts is a simple but effective improvement to prevent accidental processing and give users more control. The implementation will:

1. Show users a summary of what will be processed (number of pages, etc.)
2. Provide clear options to proceed or cancel
3. Include information about expected processing time

This small change will significantly improve the user experience by ensuring users are making intentional choices and understand what to expect.

### Text Quality Specification

Our research indicates that allowing users to specify text quality (e.g., sloppy handwriting, children's handwriting) would significantly improve OCR accuracy. This feature:

1. Gives Claude valuable context about the input it's processing
2. Allows for specialized handling of different writing styles
3. Improves accuracy for challenging inputs like children's handwriting

The implementation is straightforward and adds minimal friction to the user experience while potentially delivering substantial improvements in accuracy.

### Class Manager Improvements

The ability to add, edit, and remove classes and students is a fundamental feature for a teacher-focused application. Our implementation will:

1. Provide intuitive forms for managing classes and students
2. Include proper validation and error handling
3. Ensure data consistency across the application

This feature will make the Class Manager more functional and user-friendly, allowing teachers to organize their work more effectively.

### Image Inclusion with Claude Prompt

Including the original image along with the extracted text when sending to Claude is perhaps the most impactful improvement we can make. Claude's visual capabilities allow it to:

1. See formatting that may be lost in text extraction
2. Identify corrections, insertions, and deletions
3. Understand spatial relationships in the document

This change requires minimal modifications to the existing code but could dramatically improve the accuracy of document processing, especially for handwritten documents with corrections.

### Cost and Performance Considerations

While not explicitly part of our initial requirements, we should also consider using Claude 3.5 Haiku instead of Claude 3.7 Sonnet for most processing tasks. Our research indicates:

1. Haiku could reduce costs by up to 92% compared to Sonnet
2. For most document processing tasks, Haiku's performance is likely sufficient
3. We could implement a tiered approach where complex documents use Sonnet and standard documents use Haiku

This optimization would make the application more cost-effective while maintaining acceptable performance for most use cases.