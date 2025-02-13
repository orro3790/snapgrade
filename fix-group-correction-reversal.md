# Fix for Group Correction Node Reversal

## Issue

When submitting an empty string for a group correction node:

- The type changes to 'normal'
- The correctionData is removed
- But the node remains grouped instead of unpacking into original nodes

## Current Behavior

```typescript
// Current CORRECTION command behavior with empty input
if (!trimmedCorrection && node.type === 'correction') {
	editorStore.updateNode(nodeId, node.text, undefined, undefined, 'normal');
}
```

## Proposed Solution

### 1. Modify CORRECTION Command

```typescript
CORRECTION: {
    id: 'correction',
    execute: ([nodeId, correctedText]: [string, string]) => {
        if (!EditorCommands.CORRECTION.canExecute(nodeId)) return;

        commandStore.startCommand('correction');

        const node = editorStore.nodes.find(n => n.id === nodeId);
        if (!node) {
            commandStore.endCommand('correction');
            return;
        }

        const trimmedCorrection = correctedText.trim();

        if (!trimmedCorrection && node.type === 'correction') {
            if (node.metadata.groupedNodes?.length) {
                // Unpack group node back to original nodes
                const groupPosition = node.metadata.position;
                const restoredNodes = editorStore.unpackGroupNode(node);

                // Remove the group node and insert restored nodes
                const newNodes = editorStore.nodes.filter(n => n.id !== nodeId);
                const insertIndex = newNodes.findIndex(n =>
                    n.metadata.position > groupPosition
                );

                if (insertIndex === -1) {
                    newNodes.push(...restoredNodes);
                } else {
                    newNodes.splice(insertIndex, 0, ...restoredNodes);
                }

                // Use batch update for atomic operation
                editorStore.batchUpdateNodes(newNodes);
            } else {
                // Handle single node correction reversal
                editorStore.updateNode(
                    nodeId,
                    node.text,
                    undefined,
                    undefined,
                    'normal'
                );
            }
        } else if (trimmedCorrection) {
            // Apply correction as normal
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

        commandStore.endCommand('correction');
    },
    // ... rest of the command
}
```

### Implementation Steps

1. Switch to Code mode
2. Update the CORRECTION command in editorCommands.svelte.ts
3. Test group correction reversal:
   - Create a group correction
   - Submit empty string
   - Verify nodes unpack correctly

### Expected Results

When submitting an empty string for a group correction:

1. The group node should be removed
2. Original nodes should be restored in their correct positions
3. All nodes should be normal type with no correction data
4. Node positions should be properly updated

## Additional Notes

- Uses the same unpacking logic as the DELETE command
- Maintains atomic updates with batchUpdateNodes
- Preserves original node data and positions
