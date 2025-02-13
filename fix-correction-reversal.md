# Fix for Correction Node Reversal

## Issue

When a user submits an empty string for a correction node, it's not being properly reversed back to a normal text node.

## Current Implementation Issue

In EditModal.svelte, we're checking for empty input but not properly handling correction node reversal:

```typescript
if (!trimmedValue || trimmedValue === originalText) {
	onClose();
	return;
}
```

This causes the modal to close without actually triggering the correction reversal.

## Proposed Solution

### 1. Modify EditModal.svelte handleSubmit

```typescript
function handleSubmit() {
	if (isProcessingEdit) return;

	const trimmedValue = inputValue.trim();

	// Always process correction nodes, even with empty input
	if (node.type === 'correction' || trimmedValue !== originalText) {
		isProcessingEdit = true;

		if (isMultiNodeCorrection) {
			EditorCommands.GROUP_CORRECTION.execute([
				Array.from(editorStore.groupSelect.selectedNodeIds),
				trimmedValue
			]);
		} else {
			EditorCommands.CORRECTION.execute([node.id, trimmedValue]);
		}
		onClose();
		return;
	}

	onClose();
}
```

### Implementation Steps

1. Switch to Code mode
2. Modify EditModal.svelte's handleSubmit function
3. Test correction node reversal by:
   - Creating a correction node
   - Editing it with an empty string
   - Verifying it reverts to a normal text node

### Expected Results

1. When editing a correction node and submitting an empty string:
   - The node should revert to a normal text node
   - The original text should be preserved
   - Any correction data should be removed

## Additional Notes

- The CORRECTION command already has the logic to handle empty corrections
- We just need to ensure we're actually calling it instead of early returning from the modal
