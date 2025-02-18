# Edit Modal Refactor Plan

## Current Issues

1. Empty node text updates not working
2. Need for a dedicated submit button

## Analysis

### Empty Node Update Issue

The current implementation in `EditModal.svelte` has a gap in the `handleSubmit` function's logic. While it handles various node types, it's not properly executing the UPDATE command for empty nodes.

Current problematic code section:

```typescript
} else if (node.type === 'empty' || node.type === 'addition') {
    // Handle empty and addition nodes using UPDATE command
    EditorCommands.UPDATE.execute([node.id, trimmedValue]);
}
```

This code is in the right place but isn't being reached due to earlier conditional checks.

### Submit Button Addition

We need to add a new submit button using the Replace icon for better UX.

## Implementation Plan

### 1. Fix Empty Node Update

#### Changes needed in handleSubmit function:

```typescript
function handleSubmit() {
	if (isProcessingEdit) return;
	isProcessingEdit = true;

	const trimmedValue = inputValue.trim();

	// Handle empty nodes first
	if (node.type === 'empty') {
		EditorCommands.UPDATE.execute([node.id, trimmedValue]);
		onClose();
		return;
	}

	// Rest of the existing logic...
}
```

### 2. Add Submit Button

#### Required Imports:

```typescript
import Replace from '$lib/icons/Replace.svelte';
```

#### New Button HTML:

```svelte
<button
	onclick={() =>
		correctionResult.allowed ? handleSubmit() : handleDisabledClick(correctionResult, true)}
	type="button"
	title="Submit changes"
	class:disabled={!correctionResult.allowed}
>
	<span class="button-icon">
		<Replace />
	</span>
</button>
```

#### Button Styling:

```css
/* Add to existing styles */
button:nth-child(5):hover {
	color: var(--interactive-accent);
}
```

## Implementation Steps

1. Switch to Code mode
2. Update EditModal.svelte:
   - Modify handleSubmit function to properly handle empty nodes
   - Add Replace icon import
   - Add new submit button to actions container
   - Add appropriate styling for the new button
3. Test changes:
   - Test empty node creation and text update
   - Test submit button functionality
   - Verify existing functionality still works

## Recommendation

I recommend switching to Code mode to implement these changes:

<switch_mode>
<mode_slug>code</mode_slug>
<reason>Need to implement code changes to fix empty node updates and add submit button functionality</reason>
</switch_mode>
