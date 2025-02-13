# Alt+Click and Delete Button Alignment

## Problem

The alt+click functionality in TextNode.svelte is not using the same code path as the delete button in EditModal.svelte, leading to inconsistent behavior.

## Current Implementation

1. EditModal.svelte (delete button):

```typescript
if (isMultiNodeCorrection) {
	EditorCommands.GROUP_DELETE.execute(editorStore.groupSelect.selectedNodeIds);
} else if (EditorCommands.DELETE.canExecute(node.id)) {
	EditorCommands.DELETE.execute(node.id);
}
```

2. TextNode.svelte (alt+click):

```typescript
if (editorStore.isNodeInGroupSelection(node.id)) {
	editorStore.toggleMultiNodeDeletion(editorStore.groupSelect.selectedNodeIds);
} else {
	editorStore.toggleDeletion(node.id);
}
```

## Proposed Solution

1. Modify TextNode.svelte's handleClick function to mirror EditModal.svelte's handleDelete:

```typescript
if (event.altKey) {
	if (editorStore.isNodeInGroupSelection(node.id)) {
		EditorCommands.GROUP_DELETE.execute(editorStore.groupSelect.selectedNodeIds);
	} else if (EditorCommands.DELETE.canExecute(node.id)) {
		EditorCommands.DELETE.execute(node.id);
	}
	return;
}
```

## Benefits

1. Consistent behavior between alt+click and delete button
2. Uses the same command execution path
3. Maintains proper validation through canExecute checks
4. Ensures identical group node handling

## Testing Plan

1. Test single node operations:

   - Alt+click on single node
   - Verify same behavior as delete button

2. Test group operations:

   - Select multiple nodes
   - Alt+click to delete group
   - Verify same behavior as delete button

3. Test group node unpacking:
   - Alt+click on group node
   - Verify same behavior as delete button
