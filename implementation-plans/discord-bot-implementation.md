# Discord Bot and Document Processing Implementation Plan

## Overview

Implementation plan for handling multi-page document uploads through Discord, using message components for user interaction and session management.

## 1. Message Component Implementation

### Initial Upload Interaction

1. When user sends image(s):

   ```typescript
   // Response with buttons
   {
     type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
     data: {
       content: "Is this part of a multi-page document?",
       components: [{
         type: MessageComponentTypes.ACTION_ROW,
         components: [{
           type: MessageComponentTypes.BUTTON,
           custom_id: "multi_page_yes",
           label: "Yes",
           style: ButtonStyleTypes.PRIMARY
         }, {
           type: MessageComponentTypes.BUTTON,
           custom_id: "multi_page_no",
           label: "No",
           style: ButtonStyleTypes.SECONDARY
         }]
       }]
     }
   }
   ```

2. If user clicks "Yes":
   ```typescript
   // Follow-up with select menu
   {
     type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
     data: {
       content: "How many pages in total?",
       flags: InteractionResponseFlags.EPHEMERAL,
       components: [{
         type: MessageComponentTypes.ACTION_ROW,
         components: [{
           type: MessageComponentTypes.STRING_SELECT,
           custom_id: "page_count_select",
           placeholder: "Select total pages",
           options: [
             { label: "2 pages", value: "2" },
             { label: "3 pages", value: "3" },
             { label: "4 pages", value: "4" },
             { label: "5 pages", value: "5" }
           ]
         }]
       }]
     }
   }
   ```

## 2. Document Session Management

### Components

1. Session Creation

   - Create when user selects page count
   - Store session ID in Firestore
   - Set 10-minute expiration

2. Page Tracking

   - Track uploaded pages in session
   - Maintain page order
   - Auto-complete when all pages received

3. Status Updates
   - Send progress messages using ephemeral responses
   - Allow session cancellation
   - Handle timeouts

## 3. Implementation Steps

### Phase 1: Message Components

1. Implement button interactions for multi-page selection
2. Add page count selection menu
3. Handle interaction responses

### Phase 2: Session Management

1. Create document session schema
2. Implement session tracking
3. Add timeout handling

### Phase 3: Document Processing

1. Process individual pages
2. Track page relationships
3. Combine multi-page documents

## 4. Error Handling

### User Interaction Errors

- Invalid page order
- Timeout exceeded
- Session cancellation
- Duplicate uploads

### Processing Errors

- Failed OCR
- Invalid file types
- Size limits exceeded

## 5. User Experience Flow

1. Initial Upload:

   ```
   User: [uploads image]
   Bot: "Is this part of a multi-page document?" [Yes/No buttons]
   ```

2. Multi-page Setup:

   ```
   User: [clicks Yes]
   Bot: "How many pages in total?" [Select menu: 2-5]
   User: [selects 3]
   Bot: "Created session for 3 pages. Upload remaining pages within 10 minutes.
        Current progress: 1/3 pages"
   ```

3. Progress Updates:

   ```
   User: [uploads second image]
   Bot: "Received page 2/3. Waiting for 1 more page..."
   ```

4. Session Completion:
   ```
   User: [uploads final image]
   Bot: "All pages received! Processing your document..."
   ```

## 6. Implementation Notes

1. Message Components:

   - Use buttons for binary choices
   - Use select menus for numeric options
   - All progress messages should be ephemeral

2. Session Management:

   - Store session state in Firestore
   - Include user ID, page count, and timeout
   - Track page order and status

3. Error Recovery:

   - Allow session restart on timeout
   - Provide clear error messages
   - Enable manual cancellation

4. Security:
   - Validate all interactions
   - Check user permissions
   - Verify file types and sizes
