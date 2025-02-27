# Discord Image Session Association Implementation Plan

## Problem Statement

Currently, there's an issue in the Discord bot integration where images uploaded by users aren't being properly associated with document sessions. The specific error occurs when a user uploads an image and then creates a document session - the image is received by the bot, but when the session is created and processing begins, the system can't find any images associated with the session:

```
Error processing document session: Error: No images found for session 799098be-6478-46c1-9bb2-1236d67c16fa
    at getSessionImages (c:\Users\matto\Desktop\Snapgrade\src\lib\services\llmWhispererService.ts:147:11)
```

This happens because the current implementation has a flow issue:

1. User uploads an image to Discord
2. Bot receives the image and asks if the user wants to create a document
3. User confirms they want to create a document
4. A new session is created, but the original image isn't associated with it
5. When processing begins, no images are found for the session

## Current Implementation Analysis

The current implementation in `document-session-handler.ts` handles image uploads as follows:

```typescript
// In handleImageUpload function
if (!activeSession) {
    // No active session, ask if user wants to create a document from these images
    await sendInteractiveMessage(
        channelId,
        "I've received your image(s). Would you like to create a document for processing?",
        [
            {
                type: ComponentType.Button,
                custom_id: `start_doc_${attachments.length}`,
                label: "Create Document",
                style: ButtonStyle.Primary
            }
        ]
    );
    return;
}
```

When there's no active session, the bot simply asks if the user wants to create a document but doesn't store the image information anywhere. When the user clicks "Create Document", the `handleStartDocument` function is called, which creates a new session but has no way to associate the original image with it.

## Solution Options

### Option 1: Temporary Storage in Memory

Store uploaded images in a temporary in-memory cache when they're first received, keyed by user ID. When a session is created, check if there are any pending images for that user and associate them with the new session.

**Pros:**
- Simple implementation
- No database changes required
- Low latency (no additional database operations)

**Cons:**
- Memory usage increases with number of pending images
- Images are lost if the bot restarts
- Potential race conditions if multiple users upload images simultaneously
- Doesn't scale well across multiple bot instances

### Option 2: Store Pending Images in Firestore Without Session ID

Modify the flow to store images in Firestore's `pending_images` collection immediately when received, with a `null` or temporary session ID. When a session is created, update these pending images with the new session ID.

**Pros:**
- Persistent storage (survives bot restarts)
- Scales across multiple bot instances
- Follows existing data model
- Cleaner transaction model

**Cons:**
- Additional database operations
- Slightly more complex implementation
- Need to handle cleanup of orphaned images

### Option 3: Pass Image Information in Button Custom ID

Encode minimal image information in the custom ID of the "Create Document" button. When the button is clicked, extract this information and use it to retrieve the original images.

**Pros:**
- No additional storage needed
- Simple implementation

**Cons:**
- Limited by Discord's custom ID length restrictions (100 characters)
- Can only encode minimal information (maybe just image IDs)
- Still requires retrieving the full image data from Discord API
- Potentially brittle solution

## Recommended Solution

**Option 2: Store Pending Images in Firestore Without Session ID** is the recommended approach because:

1. It's the most robust solution that persists across bot restarts
2. It scales well with multiple bot instances
3. It follows the existing data model and patterns
4. It provides a clear audit trail of all uploaded images
5. It allows for easy cleanup of orphaned images

This approach aligns with the existing architecture and provides the most reliable solution for the problem.

## Implementation Steps

### 1. Modify `handleImageUpload` Function

Update the function to store images in Firestore even when there's no active session:

```typescript
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
        // Check for active session
        const activeSession = await getActiveSession(userId);
        
        // Process images in order (sort by filename)
        const sortedAttachments = [...attachments].sort((a, b) => 
            a.filename.localeCompare(b.filename)
        );
        
        // Create a temporary session ID if no active session
        const tempSessionId = activeSession ? 
            activeSession.sessionId : 
            `temp_${userId}_${Date.now()}`;
        
        // Add each image to Firestore
        const batch = adminDb.batch();
        const pendingImageRefs: FirebaseFirestore.DocumentReference[] = [];
        
        for (const [index, attachment] of sortedAttachments.entries()) {
            console.log('Processing image:', {
                index,
                id: attachment.id,
                filename: attachment.filename
            });

            // Validate content type
            if (!attachment.contentType || !SUPPORTED_IMAGE_TYPES.includes(
                attachment.contentType as typeof SUPPORTED_IMAGE_TYPES[number]
            )) {
                console.warn(`Unsupported content type: ${attachment.contentType}`);
                continue;
            }

            const pendingImage: PendingImage = {
                discordMessageId: attachment.id,
                channelId,
                userId,
                imageUrl: attachment.url,
                filename: attachment.filename,
                contentType: attachment.contentType as typeof SUPPORTED_IMAGE_TYPES[number],
                size: attachment.size,
                status: 'PENDING',
                createdAt: new Date(),
                sessionId: tempSessionId,
                pageNumber: activeSession ? 
                    (activeSession.receivedPages + index + 1) : 
                    (index + 1),
                isPartOfMultiPage: true,
                cdnUrlExpiry: extractCdnExpiry(attachment.url),
                isOrphaned: !activeSession // Mark as orphaned if no active session
            };

            // Create a new document reference
            const imageRef = adminDb.collection('pending_images').doc();
            batch.set(imageRef, pendingImage);
            pendingImageRefs.push(imageRef);
        }
        
        // Commit the batch
        await batch.commit();
        
        if (activeSession) {
            // Update existing session with new images
            await adminDb
                .collection('document_sessions')
                .doc(activeSession.sessionId)
                .update({
                    receivedPages: activeSession.receivedPages + sortedAttachments.length,
                    pageOrder: [...activeSession.pageOrder, ...pendingImageRefs.map(ref => ref.id)],
                    updatedAt: new Date()
                });
            
            // Send confirmation with quick actions
            const newTotal = activeSession.receivedPages + sortedAttachments.length;
            await sendInteractiveMessage(
                channelId,
                `Added ${sortedAttachments.length} image(s) to document (${newTotal} total). Is this document complete?`,
                [
                    {
                        type: ComponentType.Button,
                        custom_id: "end_upload",
                        label: "Yes, Process Document",
                        style: ButtonStyle.Success
                    },
                    {
                        type: ComponentType.Button,
                        custom_id: "continue_upload",
                        label: "No, More Pages Coming",
                        style: ButtonStyle.Secondary
                    }
                ]
            );
        } else {
            // No active session, ask if user wants to create a document
            await sendInteractiveMessage(
                channelId,
                "I've received your image(s). Would you like to create a document for processing?",
                [
                    {
                        type: ComponentType.Button,
                        custom_id: `start_doc_${tempSessionId}`,
                        label: "Create Document",
                        style: ButtonStyle.Primary
                    }
                ]
            );
        }
    } catch (error) {
        console.error('Error handling image upload:', error);
        await sendInteractiveMessage(
            channelId,
            "Sorry, there was an error processing your images. Please try again later.",
            []
        );
    }
};
```

### 2. Update the PendingImage Schema

Add an `isOrphaned` field to the `PendingImage` schema in `pending-image.ts`:

```typescript
export const pendingImageSchema = z.object({
    // ... existing fields
    isOrphaned: z.boolean().optional().default(false)
});
```

### 3. Modify `handleStartDocument` Function

Update the function to associate orphaned images with the new session:

```typescript
const handleStartDocument = async (
    interaction: Interaction,
    userId: string,
    channelId: string,
    pages: number,
    tempSessionId?: string
): Promise<void> => {
    try {
        console.log('Starting document session with params:', {
            interactionId: interaction.id,
            userId,
            channelId,
            pages,
            tempSessionId
        });
        
        // First, acknowledge the interaction immediately to prevent timeout
        await respondToInteraction(interaction, {
            type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
        
        // Create the session
        const session = await startDocumentSession(channelId, userId, pages);
        
        // If we have a temporary session ID, associate those images with the new session
        if (tempSessionId) {
            const batch = adminDb.batch();
            
            // Get all pending images with the temporary session ID
            const pendingImagesSnapshot = await adminDb
                .collection('pending_images')
                .where('sessionId', '==', tempSessionId)
                .where('userId', '==', userId)
                .where('isOrphaned', '==', true)
                .get();
            
            if (!pendingImagesSnapshot.empty) {
                const imageRefs: string[] = [];
                
                // Update each image with the new session ID
                pendingImagesSnapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        sessionId: session.sessionId,
                        isOrphaned: false
                    });
                    imageRefs.push(doc.id);
                });
                
                // Update the session with the image references
                batch.update(adminDb.collection('document_sessions').doc(session.sessionId), {
                    receivedPages: pendingImagesSnapshot.size,
                    pageOrder: imageRefs,
                    updatedAt: new Date()
                });
                
                await batch.commit();
            }
        }
        
        // Send followup message with buttons for next actions
        await sendInteractiveMessage(
            channelId,
            `Document created successfully! You can now:\n• Upload more images if you have additional pages\n• Process the document when you're ready`,
            [
                {
                    type: ComponentType.Button,
                    custom_id: "end_upload",
                    label: "Process Document",
                    style: ButtonStyle.Success
                },
                {
                    type: ComponentType.Button,
                    custom_id: "continue_upload",
                    label: "I'll Add More Images",
                    style: ButtonStyle.Secondary
                }
            ]
        );
    } catch (error) {
        console.error('Error starting document:', error);
        try {
            await respondToInteraction(interaction, {
                type: 4,
                data: {
                    content: "Failed to start document session. Please try again."
                }
            });
        } catch (err) {
            console.error('Failed to send error response:', err);
            try {
                await sendInteractiveMessage(
                    channelId,
                    "Failed to start document session. Please try again.",
                    []
                );
            } catch (msgErr) {
                console.error('Failed to send fallback message:', msgErr);
            }
        }
    }
};
```

### 4. Update the Interaction Handler

Modify the interaction handler to extract the temporary session ID from the custom ID:

```typescript
// In interaction-handler.ts
if (customId.startsWith('start_doc_')) {
    console.log('Handling start_doc button');
    // Extract temp session ID from custom_id
    const parts = customId.split('_');
    if (parts.length >= 3 && parts[2] === 'temp') {
        // This is a new format with temp session ID
        const tempSessionId = parts.slice(2).join('_');
        await handleStartDocument(interaction, userId, channelId, 1, tempSessionId);
    } else {
        // Legacy format with just page count
        const pages = parseInt(parts[2]) || 1;
        await handleStartDocument(interaction, userId, channelId, pages);
    }
}
```

### 5. Add a Cleanup Job for Orphaned Images

Create a scheduled function to clean up orphaned images that are never associated with a session:

```typescript
export const cleanupOrphanedImages = async (): Promise<void> => {
    try {
        // Find orphaned images older than 24 hours
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        
        const orphanedImagesSnapshot = await adminDb
            .collection('pending_images')
            .where('isOrphaned', '==', true)
            .where('createdAt', '<', cutoffTime)
            .get();
        
        if (orphanedImagesSnapshot.empty) {
            console.log('No orphaned images to clean up');
            return;
        }
        
        console.log(`Cleaning up ${orphanedImagesSnapshot.size} orphaned images`);
        
        const batch = adminDb.batch();
        orphanedImagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('Orphaned images cleanup completed');
    } catch (error) {
        console.error('Error cleaning up orphaned images:', error);
    }
};
```

## Testing Plan

1. **Unit Tests**:
   - Update existing tests for `handleImageUpload` and `handleStartDocument`
   - Add tests for the new orphaned image handling
   - Test edge cases (multiple uploads, timeouts, etc.)

2. **Integration Tests**:
   - Test the full flow from image upload to document creation
   - Test with multiple images
   - Test with images uploaded before and after session creation

3. **Manual Testing**:
   - Test with real Discord interactions
   - Verify images are properly associated with sessions
   - Test error handling and recovery

## Rollout Strategy

1. **Development Phase**:
   - Implement changes in a feature branch
   - Run unit and integration tests
   - Code review

2. **Staging Deployment**:
   - Deploy to staging environment
   - Conduct manual testing
   - Monitor for any issues

3. **Production Deployment**:
   - Deploy during low-traffic period
   - Monitor error rates and performance
   - Have rollback plan ready

4. **Post-Deployment**:
   - Monitor for any issues
   - Collect metrics on success rates
   - Document the changes for the team

## Conclusion

This implementation plan addresses the issue of Discord images not being properly associated with document sessions. By storing images in Firestore immediately upon receipt and then associating them with sessions when created, we ensure a robust and scalable solution that works across bot restarts and multiple instances.

The solution maintains the existing data model and patterns while adding the necessary functionality to track orphaned images and clean them up when they're no longer needed. This approach provides the best balance of reliability, maintainability, and performance.