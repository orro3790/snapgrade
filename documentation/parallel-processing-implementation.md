# Parallel Processing Implementation Plan

## Overview

Implementation plan for step 3 of the workflow: Parallel Processing. This step handles storing raw text in Firestore and sending data to the Snapgrade server's API endpoint.

## 1. API Endpoint Implementation

### Create Document API Endpoint

- Location: `src/routes/api/documents/create/+server.ts`
- Method: POST
- Authentication: Handled by hooks.server.ts (session cookies)

#### Request Body Schema

```typescript
{
  documentBody: string;
  image: {
    base64: string;
    mimeType: string;
  };
  sourceMetadata?: {
    rawOcrOutput?: string;
    telegramMessageId?: string;
    telegramChatId?: string;
    telegramFileId?: string;
  };
}
```

Note: userId is available from event.locals.uid

#### Response Schema

```typescript
{
  status: 'success' | 'error';
  data?: {
    documentId: string;
    // Document fields from schema
  };
  error?: {
    message: string;
    code: string;
  };
}
```

## 2. TextEditor State Management

### Editor States

1. **Formatting State**

   - Purpose: Structure identification and adjustment
   - Allowed actions:
     - Paragraph formatting
     - Header identification
     - List formatting
   - Disabled actions:
     - Text corrections
     - Deletions
     - Node editing

2. **Editing State**
   - Purpose: Content correction and refinement
   - Allowed actions:
     - Text corrections
     - Deletions
     - Node editing
   - Disabled actions:
     - Structure formatting

### State Implementation

```typescript
// In editorStore.svelte
export const EditorMode = {
	FORMATTING: 'formatting',
	EDITING: 'editing'
} as const;

let currentMode = $state(EditorMode.FORMATTING);
```

### UI Updates

- Add mode indicator in TextEditor
- Disable/enable controls based on mode
- Visual feedback for current mode
- Keyboard shortcuts for mode switching

## 3. Testing Plan

### API Testing

```typescript
// Example request using SvelteKit's fetch
const response = await fetch('/api/documents/create', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({
		documentBody: 'Sample essay text...',
		image: {
			base64: 'encoded_image_data',
			mimeType: 'image/jpeg'
		},
		sourceMetadata: {
			rawOcrOutput: 'OCR text',
			telegramMessageId: 'msg123',
			telegramChatId: 'chat456',
			telegramFileId: 'file789'
		}
	})
});
```

### Editor State Testing

1. Mode Transitions
   - Format → Edit
   - Edit → Format
   - State persistence
2. Control Availability
   - Verify disabled actions in each mode
   - Test keyboard shortcuts
   - Check visual indicators

## Implementation Steps

1. **API Development**

   - Create API endpoint
   - Implement request validation
   - Set up Firestore document creation
   - Add error handling

2. **Editor Updates**

   - Add state management to editorStore
   - Update TextEditor component
   - Modify TextNode behavior
   - Add mode indicators
   - Implement state transitions

3. **Testing**
   - Test API endpoint
   - Verify state management
   - Test document creation flow
   - Validate mode restrictions

## Next Steps

1. Begin with API endpoint implementation
2. Add editor state management
3. Update UI components
4. Implement testing
