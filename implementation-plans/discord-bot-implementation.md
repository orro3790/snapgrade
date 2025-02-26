# Discord Bot Document Upload Implementation: Concerns and Solutions

## 1. Current State Analysis

Based on the code review, we already have:

- A Discord bot implementation that connects to the Discord Gateway API
- Authentication flow that checks if users have linked their Discord account with Snapgrade
- Basic image handling that stores pending images in Firestore
- Document session management for multi-page uploads
- Integration with LLM Whisperer for OCR and Claude for structural analysis

## 2. Current Problems and Concerns

We're building a text editor that allows ESL teachers to correct student essays. One key feature is allowing teachers to upload student essays via Discord. Here's what we're concerned about:

1. **Context Preservation**: When a teacher uploads multiple pages of the same essay, we need to maintain proper document context. If page 2 starts mid-sentence, without context the LLM would incorrectly flag it as an error.

2. **Organization Burden**: A teacher with 10 students, each submitting 2-4 page essays, might end up with 20-40 individual photos. Organizing these after upload creates significant friction.

3. **Time Constraints**: The entire workflow (upload, processing, correction) needs to complete within a 45-60 minute class period. Teachers need time to review essays while students work on practice exercises.

4. **User Experience**: We need a frictionless upload process that doesn't sacrifice organization and context.

## 3. Our Data Structure

Looking at our data structure:

- `User` schema: Teachers with classes they manage
- `Class` schema: Contains students and class metadata
- `Student` schema: Individual students belonging to a class

This structure lets us build an intelligent upload flow where the teacher can quickly associate uploaded documents with specific students and classes.

## 4. Authentication Flow

The current authentication flow works as follows:

1. User connects their Discord account in the Snapgrade web app
2. OAuth flow creates a mapping in the `discord_mappings` collection
3. When a user sends a message to the bot, it checks this mapping
4. If authenticated, it also verifies the user's subscription status

### Improvements Needed:

1. **Caching Strategy**: While Firebase reads are inexpensive, we should implement a time-based cache for frequent users to reduce latency and costs.
   - Cache user auth status for 5-10 minutes
   - Invalidate cache on subscription status changes
   - Use a simple in-memory cache with TTL

2. **Subscription Verification Endpoint**: Create a dedicated API endpoint for the bot to verify user subscription status.
   ```typescript
   // src/routes/api/auth/discord/verify/+server.ts
   export const POST: RequestHandler = async ({ request }) => {
     const { discordId } = await request.json();
     // Verify mapping exists and user has active subscription
     // Return status code 200 if authorized, 403 if unauthorized
   }
   ```

## 5. Proposed Document-Centric Upload Flow

We've designed a document-centric upload flow that balances ease-of-use with proper organization:

```typescript
// src/lib/discord/upload-flow.ts
export const handleImageUpload = async (
  message: Message,
  userId: string
): Promise<void> => {
  try {
    // Check for active session
    const activeSession = await getActiveSession(userId);
    
    // Handle multiple images in a single message
    const attachments = message.attachments;
    
    if (!activeSession) {
      // Prompt to start a new document session if none exists
      return sendInteractiveMessage(
        message.channelId,
        "Would you like to start a new document with these images?",
        [
          {
            type: 2, // BUTTON
            style: 1, // PRIMARY
            label: "Start New Document",
            custom_id: `start_doc_${attachments.size}`
          }
        ]
      );
    }
    
    // Process images in order (sort by filename)
    const imageUrls = [...attachments.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(attachment => attachment.url);
    
    // Add to active session
    await addImagesToSession(activeSession.sessionId, imageUrls);
    
    // Update session status
    const newTotal = activeSession.receivedPages + imageUrls.length;
    await updateSessionPageCount(activeSession.sessionId, newTotal);
    
    // Send confirmation with quick actions
    return sendInteractiveMessage(
      message.channelId,
      `Added ${imageUrls.length} image(s) to document (${newTotal} total). Is this document complete?`,
      [
        {
          type: 2, // BUTTON
          style: 3, // SUCCESS
          label: "Yes, Process Document",
          custom_id: "end_upload"
        },
        {
          type: 2, // BUTTON
          style: 2, // SECONDARY
          label: "No, More Pages Coming",
          custom_id: "continue_upload"
        }
      ]
    );
  } catch (error) {
    console.error('Error handling image upload:', error);
    sendErrorMessage(message.channelId, 'Failed to process images. Please try again.');
  }
};
```

After a document is completed, we'll show a quick metadata dialog leveraging our schemas:

```typescript
// src/lib/discord/metadata-handler.ts
export const showMetadataDialog = async (
  channelId: string,
  userId: string,
  sessionId: string
): Promise<void> => {
  try {
    // Get user's classes from database
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userSchema.parse({
      ...userDoc.data(),
      id: userDoc.id
    });
    
    // Fetch class info for dropdown
    const classesSnapshot = await adminDb
      .collection('classes')
      .where('id', 'in', userData.classes)
      .where('status', '==', 'active')
      .get();
    
    const classes = classesSnapshot.docs.map(doc => {
      return classSchema.parse({
        ...doc.data(),
        id: doc.id
      });
    });
    
    // Create class selection dropdown
    return sendInteractiveMessage(
      channelId,
      "Quick document organization (can be done later):",
      [
        {
          type: 3, // SELECT MENU
          custom_id: `class_select_${sessionId}`,
          placeholder: "Select class",
          options: classes.map(c => ({
            label: c.name,
            value: c.id
          }))
        },
        {
          type: 1, // ACTION ROW
          components: [
            {
              type: 2, // BUTTON
              style: 2, // SECONDARY
              label: "Skip - Organize Later",
              custom_id: `skip_metadata_${sessionId}`
            }
          ]
        }
      ]
    );
  } catch (error) {
    console.error('Error showing metadata dialog:', error);
    sendErrorMessage(channelId, 'Failed to load classes. You can organize documents later in the web app.');
  }
};

// When class is selected, show student selection for that class
export const handleClassSelection = async (
  interaction: Interaction,
  classId: string,
  sessionId: string
): Promise<void> => {
  try {
    // Get students for selected class
    const studentsSnapshot = await adminDb
      .collection('students')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get();
    
    const students = studentsSnapshot.docs.map(doc => {
      return studentSchema.parse({
        ...doc.data(),
        id: doc.id
      });
    });
    
    // Show student selection dropdown
    return respondToInteraction(
      interaction,
      {
        type: 7, // UPDATE_MESSAGE
        data: {
          content: "Quick document organization (can be done later):",
          components: [
            {
              type: 1, // ACTION ROW
              components: [
                {
                  type: 3, // SELECT MENU
                  custom_id: `student_select_${sessionId}_${classId}`,
                  placeholder: "Select student",
                  options: students.map(s => ({
                    label: s.name,
                    value: s.id
                  }))
                }
              ]
            },
            {
              type: 1, // ACTION ROW
              components: [
                {
                  type: 2, // BUTTON
                  style: 2, // SECONDARY
                  label: "Skip - Organize Later",
                  custom_id: `skip_metadata_${sessionId}`
                }
              ]
            }
          ]
        }
      }
    );
  } catch (error) {
    console.error('Error handling class selection:', error);
    respondToInteraction(
      interaction,
      {
        type: 7, // UPDATE_MESSAGE
        data: {
          content: "Failed to load students. You can organize documents later in the web app.",
          components: []
        }
      }
    );
  }
};
```

## 6. Batch Processing for Efficiency

To ensure we can process multiple documents efficiently, especially for larger classes:

```typescript
// src/lib/services/batch-processing.ts
export const processBatch = async (
  sessionIds: string[]
): Promise<void> => {
  // Process in batches of 5 for optimal throughput
  const batchSize = 5;
  
  for (let i = 0; i < sessionIds.length; i += batchSize) {
    const batch = sessionIds.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.all(
      batch.map(async (sessionId) => {
        try {
          await processDocument(sessionId);
        } catch (error) {
          console.error(`Error processing session ${sessionId}:`, error);
          await markSessionError(sessionId, error.message);
        }
      })
    );
  }
};
```

## 7. UX Considerations for Teachers

Putting myself in a teacher's shoes during a 45-60 minute class with 6-30 students:

### Small Class (6 students):
- Teacher can capture, process, and review essays within the class period
- Need quick processing (under 2 minutes per document)
- May want to show corrections to students immediately

### Large Class (12+ students):
- Focus on rapid capture during class
- Organization and processing will happen after class
- Need batch upload capabilities
- Email notification when processing is complete would be valuable

### Key UX Principles:

1. **Document-Centric Flow**: We treat each essay as a single multi-page document, preserving context for accurate LLM analysis.

2. **Minimal Friction**: Teachers can send multiple pages at once, and the bot provides simple "yes/no" options to move the process forward.

3. **In-Flow Organization**: By offering quick class/student assignment during upload, we reduce post-processing organization time.

4. **Flexible Experience**: Teachers can either organize documents during upload or skip and do it later in the Document Bay.

5. **Parallel Processing**: Our backend will process multiple documents simultaneously for efficiency.

## 8. Command Structure

We'll implement a minimal set of slash commands to complement the interactive message flow:

### Essential Commands:

1. `/start-upload [pages]` - Start a new document upload session
   - Example: `/start-upload 3` (starts a session expecting 3 pages)
   - Response: "Upload session started. Please send 3 images."

2. `/end-upload` - Manually end the current upload session and start processing
   - Response: "Upload complete. Processing your document..."

3. `/status` - Check subscription and upload status
   - Response: "Your account is active. You have uploaded 45 documents this month."

4. `/help` - Show available commands and basic instructions
   - Response: Lists all commands with brief explanations

## 9. Document Bay Implementation

The Document Bay is a web interface component that displays all incoming documents from the Discord bot and allows teachers to organize, label, and assign them to students and classes.

Key features:
- Filter documents by class, student, status, and date
- Batch operations for efficient organization
- Preview of document content
- Direct links to the editor

## 10. Implementation Priorities

1. **Session Management**: 
   - Create functions to track document upload sessions
   - Add timeout handling for abandoned sessions
   - Store metadata about expected vs. received pages

2. **Interactive Components**:
   - Implement button handlers for "Yes, Process" and "No, More Pages"
   - Build class/student selection dropdown handlers
   - Create error handling for all interactions

3. **Optimize Document Processing**:
   - Implement parallel processing for multiple documents
   - Add progress tracking and notifications
   - Ensure OCR quality for classroom conditions (varied lighting, angles)

4. **Integrate with Document Bay**:
   - Ensure metadata from upload flows into the Document Bay
   - Create efficient filtering by class/student
   - Add batch organization capabilities

5. **Add Error Recovery**:
   - Implement retry mechanisms for failed processing
   - Add manual correction options for low-confidence OCR
   - Create session recovery for interrupted uploads

## 11. Why This Approach?

1. **Document-Centric Flow**: We treat each essay as a single multi-page document, preserving context for accurate LLM analysis.

2. **Minimal Friction**: Teachers can send multiple pages at once, and the bot provides simple "yes/no" options to move the process forward.

3. **In-Flow Organization**: By offering quick class/student assignment during upload, we reduce post-processing organization time.

4. **Flexible Experience**: Teachers can either organize documents during upload or skip and do it later in the Document Bay.

5. **Parallel Processing**: Our backend will process multiple documents simultaneously for efficiency.

## 12. Technical Implementation Details

### Authentication Caching

```typescript
// src/lib/discord/auth-cache.ts
type CachedAuth = {
  authenticated: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  firebaseUid: string;
  timestamp: number;
};

const AUTH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const authCache = new Map<string, CachedAuth>();

export const getCachedAuth = (discordId: string): CachedAuth | null => {
  const cached = authCache.get(discordId);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > AUTH_CACHE_TTL) {
    authCache.delete(discordId);
    return null;
  }
  
  return cached;
};

export const setCachedAuth = (discordId: string, auth: Omit<CachedAuth, 'timestamp'>) => {
  authCache.set(discordId, {
    ...auth,
    timestamp: Date.now()
  });
};

export const invalidateCache = (discordId: string) => {
  authCache.delete(discordId);
};
```

### Interactive Message Handling

```typescript
// src/lib/discord/interactive-messages.ts
export const sendInteractiveMessage = async (
  channelId: string,
  content: string,
  components: any[]
): Promise<void> => {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          components: components.length > 0 ? [
            {
              type: 1, // ACTION_ROW
              components
            }
          ] : []
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending interactive message:', error);
    throw error;
  }
};

export const respondToInteraction = async (
  interaction: Interaction,
  response: any
): Promise<void> => {
  try {
    await fetch(
      `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
      }
    );
  } catch (error) {
    console.error('Error responding to interaction:', error);
    throw error;
  }
};
```

## 13. Conclusion

This implementation plan focuses on creating a document-centric, frictionless experience for teachers capturing student essays in a classroom setting. By offering interactive components and flexible organization options, we allow teachers to quickly photograph essays during class time while maintaining proper document context and organization.

The approach balances the needs of teachers with small classes (who may want immediate processing) and those with larger classes (who need efficient batch processing). By implementing parallel processing and providing clear status updates, we ensure the entire workflow can be completed within a single class period when needed.

By focusing on these implementation priorities, we'll create a seamless experience that allows teachers to capture, process, and correct student essays efficiently, whether they have 6 or 30 students in their class.