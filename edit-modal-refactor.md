# EditModal Refactor Plan

## Current Issues

1. Redundant Validation

- EditModal.svelte contains operation logic that should be in commands
- Group operations for addition nodes handled in modal instead of commands
- Creates inconsistency with centralized command pattern

2. TypeScript Errors

- Derived syntax needs updating to properly handle command results
- Current implementation may cause type inference issues

## Proposed Changes

### 1. Remove Redundant Logic

Remove from EditModal.svelte:

```typescript
// Remove this entire block
else if (isMultiNodeCorrection && selectedNodesList.every((n) => n.type === 'addition')) {
    // Handle multiple addition nodes - update each one individually
    selectedNodesList.forEach((node) => {
        EditorCommands.UPDATE.execute([node.id, trimmedValue]);
    });
}
```

### 2. Simplify handleSubmit Logic

```typescript
function handleSubmit() {
	if (isProcessingEdit) return;
	isProcessingEdit = true;

	const trimmedValue = inputValue.trim();

	if (!correctionResult.allowed) {
		isProcessingEdit = false;
		return;
	}

	if (isMultiNodeCorrection) {
		// Handle multi-node correction using GROUP_CORRECTION command
		const selectedIds = editorStore.groupSelect.selectedNodeIds;
		const groupNode = selectedNodesList.find(
			(n) => n.type === 'correction' && n.metadata.groupedNodes
		);

		if (!trimmedValue && groupNode) {
			EditorCommands.UNPACK_GROUP.execute(groupNode.id);
		} else if (trimmedValue && trimmedValue !== originalText) {
			EditorCommands.GROUP_CORRECTION.execute([selectedIds, trimmedValue]);
		}
	} else {
		// Single node operations
		if (!trimmedValue && node.type === 'correction') {
			EditorCommands.CORRECTION.execute([node.id, '']);
		} else if (trimmedValue && trimmedValue !== originalText) {
			// Use appropriate command based on node type
			const command =
				node.type === 'empty' || node.type === 'addition'
					? EditorCommands.UPDATE
					: EditorCommands.CORRECTION;
			command.execute([node.id, trimmedValue]);
		}
	}

	onClose();
}
```

### 3. Fix Derived Syntax

Update derived expressions to properly handle command results:

```typescript
// Current problematic implementation
let deleteResult = $derived(() =>
    isMultiNodeCorrection
        ? EditorCommands.GROUP_DELETE.canExecute(editorStore.groupSelect.selectedNodeIds)
        : EditorCommands.DELETE.canExecute(node.id)
);

// Proposed fix
let deleteResult = $derived({
    if (isMultiNodeCorrection) {
        return EditorCommands.GROUP_DELETE.canExecute(editorStore.groupSelect.selectedNodeIds);
    }
    return EditorCommands.DELETE.canExecute(node.id);
});
```

Apply similar pattern to other derived values:

```typescript
let addResult = $derived({
    return EditorCommands.INSERT_EMPTY.canExecute(node.id);
});

let removeResult = $derived({
    if (isMultiNodeCorrection) {
        return EditorCommands.GROUP_REMOVE.canExecute(editorStore.groupSelect.selectedNodeIds);
    }
    return EditorCommands.REMOVE.canExecute(node.id);
});

let correctionResult = $derived({
    const baseResult = isMultiNodeCorrection
        ? EditorCommands.GROUP_CORRECTION.canExecute(editorStore.groupSelect.selectedNodeIds)
        : EditorCommands.CORRECTION.canExecute(node.id);

    if (!baseResult.allowed) {
        return baseResult;
    }

    return inputValue.trim() !== originalText
        ? { allowed: true }
        : { allowed: false, reason: 'No changes made' };
});
```

## Benefits

1. Centralized Logic

- All operation validation happens in commands
- EditModal only handles UI state and command delegation
- Consistent behavior across all operations

2. Improved Type Safety

- Proper type inference for command results
- Clear return types for derived values
- Better TypeScript integration

3. Better UI Feedback

- Buttons properly reflect command validation state
- Consistent error messages from commands
- Clear indication of why operations are disabled

## Implementation Steps

1. Update Derived Syntax

- Fix type inference issues
- Ensure proper command result handling
- Maintain reactivity

2. Remove Redundant Logic

- Remove addition node group handling from modal
- Simplify handleSubmit logic
- Rely on command validation

3. Test Changes

- Verify button states reflect command validation
- Test all operations with different node types
- Ensure proper error messages display

## Success Criteria

1. All operation logic centralized in commands
2. No TypeScript errors in derived expressions
3. Buttons properly reflect command validation state
4. Consistent handling of all node types
5. Clear error messages from commands displayed in UI
