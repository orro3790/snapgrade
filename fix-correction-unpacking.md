# Fix for Correction Node Unpacking

## Issue

The group node unpacking logic in the CORRECTION command is incorrectly nested and structured differently from the working DELETE command implementation.

## Current Implementation

```typescript
if (!trimmedCorrection && node.type === 'correction') {
    // First empty correction check
    editorStore.updateNode(...);
} else if (trimmedCorrection) {
    if (!trimmedCorrection && node.type === 'correction') {
        // Duplicate and nested empty correction check
        if (node.metadata.groupedNodes?.length) {
            // Unpacking logic here
        }
    }
}
```

## Working DELETE Implementation

```typescript
if (node.metadata.groupedNodes?.length) {
	if (node.type === 'deletion') {
		// Unpack group node
		const groupPosition = node.metadata.position;
		const restoredNodes = editorStore.unpackGroupNode(node);
		const newNodes = editorStore.nodes.filter((n) => n.id !== nodeId);
		// ... rest of unpacking logic
	} else {
		// Toggle to deletion
		editorStore.toggleDeletion(nodeId);
	}
} else {
	// Handle single node
	editorStore.toggleDeletion(nodeId);
}
```

## Proposed Fix

Restructure the CORRECTION command to match the working pattern:

```typescript
if (node.metadata.groupedNodes?.length) {
	if (!trimmedCorrection && node.type === 'correction') {
		// Unpack group node
		const groupPosition = node.metadata.position;
		const restoredNodes = editorStore.unpackGroupNode(node);
		const newNodes = editorStore.nodes.filter((n) => n.id !== nodeId);
		const insertIndex = newNodes.findIndex((n) => n.metadata.position > groupPosition);

		if (insertIndex === -1) {
			newNodes.push(...restoredNodes);
		} else {
			newNodes.splice(insertIndex, 0, ...restoredNodes);
		}

		// Use batch update for atomic operation
		editorStore.batchUpdateNodes(newNodes);
	} else if (trimmedCorrection) {
		// Apply correction to group node
		editorStore.updateNode(
			nodeId,
			node.text,
			{
				correctedText: trimmedCorrection,
				pattern: '',
				explanation: ''
			},
			undefined,
			'correction'
		);
	}
} else {
	// Handle single node
	if (!trimmedCorrection && node.type === 'correction') {
		editorStore.updateNode(nodeId, node.text, undefined, undefined, 'normal');
	} else if (trimmedCorrection) {
		editorStore.updateNode(
			nodeId,
			node.text,
			{
				correctedText: trimmedCorrection,
				pattern: '',
				explanation: ''
			},
			undefined,
			'correction'
		);
	}
}
```

## Implementation Steps

1. Switch to Code mode
2. Update the CORRECTION command with the new structure
3. Test both single and group node corrections:
   - Create a group correction
   - Submit empty string
   - Verify nodes unpack correctly
   - Test single node corrections still work

## Expected Results

1. Group correction nodes should properly unpack when given empty input
2. Single correction nodes should revert to normal when given empty input
3. Both operations should maintain proper node positions
4. No duplicate condition checks
