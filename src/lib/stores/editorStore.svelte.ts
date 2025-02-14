/**
 * @module editorStore
 * @description Core state management for the text editor implementation.
 * Handles document state, node management, selection, and undo/redo operations.
 * Uses Svelte 5 runes ($state, $derived) for reactive state management.
 */

import type { Node, NodeType, CorrectionData, SpacerSubtype, StructuralRole } from '$lib/schemas/textNode';
import { serializeNodes, deserializeNodes } from '$lib/utils/nodeSerializer';
import { z } from 'zod';

/**
 * Editor mode enum defining available editing states
 */
export const EditorMode = {
    FORMATTING: 'formatting',
    CORRECTING: 'correcting'
} as const;

export type EditorModeType = typeof EditorMode[keyof typeof EditorMode];

/**
 * Core editor state containing all document and editing state.
 * Uses Svelte 5's $state rune for reactivity.
 * 
 * @property {Node[]} nodes - Array of text nodes representing the document content
 * @property {string | null} activeNode - ID of currently active node, if any
 * @property {Node[][]} undoStack - Stack of previous document states for undo
 * @property {Node[][]} redoStack - Stack of undone states for redo
 * @property {string} documentName - Name of the current document
 */
const editorState = $state({
    nodes: [] as Node[],
    activeNode: null as string | null,
    undoStack: [] as Node[][],
    redoStack: [] as Node[][],
    documentName: "",
    mode: EditorMode.FORMATTING as EditorModeType
});

/**
 * Type definition for node position cache.
 * Used to efficiently track node positions and handle selection operations.
 * 
 * @property {Map<string, number>} indices - Maps node IDs to their positions
 * @property {number} version - Cache version for tracking updates
 */
type NodeCache = {
    indices: Map<string, number>;
    version: number;
};

/**
 * Version counter for cache invalidation.
 * Increments whenever the node cache is updated.
 */
let cacheVersion = $state(0);

/**
 * Derived cache for efficient node position lookups.
 * Automatically updates when nodes change.
 * Used by selection and drag operations.
 */
const nodeCache = $derived<NodeCache>({
    indices: new Map(editorState.nodes.map((node, index) => [node.id, index])),
    version: cacheVersion++
});

/**
 * Gets the valid position of a node in the current document.
 * Uses the node cache for efficient lookups.
 * 
 * @param {string} nodeId - ID of the node to find
 * @returns {number} Position of the node, or -1 if not found
 */
function getValidPosition(nodeId: string): number {
    return nodeCache.indices.get(nodeId) ?? -1;
}

/**
 * Updates the editor's node array and triggers reactivity.
 * This is the primary method for modifying document content.
 *
 * @param {Node[]} newNodes - New array of nodes to set
 */
function updateNodes(newNodes: Node[]) {
    editorState.nodes = newNodes;
}

/**
 * Performs a batch update of nodes with position recalculation.
 * Updates all nodes in a single operation to prevent multiple rerenders.
 *
 * @param {Node[]} nodes - Array of nodes to update
 */
function batchUpdateNodes(nodes: Node[]) {
    // Update positions for all nodes
    const updatedNodes = nodes.map((node, index) => ({
        ...node,
        metadata: { ...node.metadata, position: index }
    }));
    
    // Single atomic update
    updateNodes(updatedNodes);
}

// Selection state schemas
export const dragSelectStateSchema = z.object({
    isDragging: z.boolean(),
    isSelected: z.boolean(), 
    startNodeId: z.string().nullable(),
    endNodeId: z.string().nullable(),
    generation: z.number()
});

export const groupSelectStateSchema = z.object({
    selectedNodeIds: z.set(z.string()),
    isGroupMode: z.boolean(),
    generation: z.number()
});

type GroupSelectState = z.infer<typeof groupSelectStateSchema>;
type DragSelectState = z.infer<typeof dragSelectStateSchema>;

const groupSelectState = $state<GroupSelectState>({
    selectedNodeIds: new Set<string>(),
    isGroupMode: false,
    generation: 0
});

const dragSelectState = $state<DragSelectState>({
    isDragging: false,
    isSelected: false,
    startNodeId: null,
    endNodeId: null,
    generation: 0
});


/**
 * Groups an array of nodes into paragraphs. Paragraphs are delimited by 'newline' spacer nodes.
 * @param {Node[]} nodes - The array of nodes to group.
 * @returns {{ id: string; corrections: Node[] }[]} An array of paragraph objects, where each object contains a unique ID and an array of nodes belonging to that paragraph.
 */
function groupNodesByParagraph(nodes: Node[]) {
    const paragraphs: { id: string; corrections: Node[] }[] = [];
    let currentParagraph: Node[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node.type === 'spacer' && node.spacerData?.subtype === 'newline') {
            // Add current paragraph (without the newline)
            if (currentParagraph.length > 0) {
                paragraphs.push({
                    id: crypto.randomUUID(),
                    corrections: [...currentParagraph]
                });
            }
            currentParagraph = [];

            // Handle consecutive newlines more efficiently
            while (i + 1 < nodes.length &&
                   nodes[i + 1].type === 'spacer' &&
                   nodes[i + 1].spacerData?.subtype === 'newline') {
                paragraphs.push({
                    id: crypto.randomUUID(),
                    corrections: [nodes[i+1]]
                });
                i++;
            }
        } else {
            currentParagraph.push(node);
        }
    }

    // Add final paragraph if there are remaining nodes
    if (currentParagraph.length > 0) {
        paragraphs.push({
            id: crypto.randomUUID(),
            corrections: currentParagraph
        });
    }

    return paragraphs;
}

/**
 * Sets both the document content and name.
 * @param {string} content - The document content to parse.
 * @param {string} name - The name of the document.
 */
function setDocument(content: string, name: string) {
    parseContent(content);
    editorState.documentName = name;
}

/**
 * Parses the input text content and creates an array of nodes.
 * @param {string} content - The input text content.
 */
function parseContent(content: string) {
    const newNodes: Node[] = [];
    let position = 0;

    // Split content into words and punctuation, ignoring whitespace
    const tokens = content
        .split(/([.,!?;:]|\s+)/)  // Split by punctuation or whitespace sequences
        .map(token => token.trim()) // Trim any whitespace
        .filter(token => {
            // Keep only non-empty tokens that aren't pure whitespace
            return token && !/^\s+$/.test(token);
        });

    tokens.forEach(token => {
        // Handle text or punctuation
        const isPunctuation = /^[.,!?;:]/.test(token);
        newNodes.push({
            id: crypto.randomUUID(),
            text: token,
            type: 'normal' as const,
            metadata: {
                position: position++,
                isPunctuation,
                isWhitespace: false,
                startIndex: 0,
                endIndex: 0,
            }
        });
    });

    updateNodes(newNodes);
    editorState.undoStack = [];
    editorState.redoStack = [];
}

/**
 * Serializes the current nodes array into a JSON string for storage.
 * @returns {string} The serialized JSON string.
 */
function getSerializedContent(): string {
    return serializeNodes(editorState.nodes);
}

/**
 * Loads and deserializes nodes from a JSON string.
 * @param {string} serialized - The serialized JSON string.
 */
function loadSerializedContent(serialized: string) {
    editorState.nodes = deserializeNodes(serialized);
    editorState.undoStack = [];
    editorState.redoStack = [];
}

/**
 * Updates the properties of an existing node.
 * @param {string} nodeId - The ID of the node to update.
 * @param {string} text - The new text content of the node.
 * @param {CorrectionData} [correctionData] - Optional correction data.
 * @param {{ subtype: SpacerSubtype }} [spacerData] - Optional spacer data (for spacer nodes).
 * @param {NodeType} [type='normal'] - The node type. Defaults to 'normal'.
 * @param {StructuralRole} [structuralRole] - Optional structural role for formatting.
 */
function updateNode(
    nodeId: string,
    text: string,
    correctionData?: CorrectionData,
    spacerData?: { subtype: SpacerSubtype },
    type: NodeType = 'normal',
    structuralRole?: StructuralRole
) {
    const nodeIndex = editorState.nodes.findIndex((n: Node) => n.id === nodeId);
    if (nodeIndex === -1) return;

    const oldNode = editorState.nodes[nodeIndex];
    
    // Handle deletion toggle when type is 'deletion'
    if (type === 'deletion') {
        // If node is already deletion, revert to normal
        if (oldNode.type === 'deletion') {
            type = 'normal';
        }
        // Otherwise it will remain deletion
    }
    
    // Determine the new type based on current node type
    let newType = type;
    if (oldNode.type === 'addition') {
        // Preserve addition type
        newType = 'addition';
    } else if (oldNode.type === 'empty') {
        // Empty nodes can only become addition nodes or remain empty
        newType = type === 'deletion' ? 'empty' : type;
    }

    // Only save to undo stack if there's an actual change
    if (oldNode.text !== text || oldNode.type !== newType) {
        editorState.undoStack = [...editorState.undoStack, editorState.nodes];
        editorState.redoStack = [];
    }

    const newNodes = [...editorState.nodes];
    newNodes[nodeIndex] = {
        ...oldNode,
        text,
        type: newType,
        ...(correctionData && { correctionData }),
        ...(spacerData && { spacerData })
    };

    updateNodes(newNodes);
    
    // Clear active node after update to ensure proper re-rendering
    editorState.activeNode = null;
}

/**
 * Toggles the deletion state of a node.
 * @param {string} nodeId - The ID of the node to toggle.
 */
function toggleDeletion(nodeId: string) {
    const nodeIndex = editorState.nodes.findIndex((n: Node) => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = editorState.nodes[nodeIndex];
    
    // Don't toggle if it's an empty or spacer node
    if (node.type === 'empty' || node.type === 'spacer') return;

    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    const newNodes = [...editorState.nodes];
    newNodes[nodeIndex] = {
        ...node,
        type: node.type === 'deletion' ? ('normal' as const) : ('deletion' as const)
    };

    updateNodes(newNodes);
    
    // Clear active node after toggle to ensure proper re-rendering
    editorState.activeNode = null;
}

/**
 * Inserts a new node after the specified node.
 * @param {string} nodeId - The ID of the node after which to insert the new node.
 * @param {string} text - The text content of the new node.
 * @param {NodeType} [type='normal'] - The type of the new node. Defaults to 'normal'.
 */
function insertNodeAfter(nodeId: string, text: string, type: NodeType = 'normal') {
    const nodeIndex = editorState.nodes.findIndex((n: Node) => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];
    
    const newNode: Node = {
        id: crypto.randomUUID(),
        text,
        type,
        metadata: {
            position: editorState.nodes[nodeIndex].metadata.position + 1,
            isPunctuation: /^[.,!?;:]$/.test(text),
            isWhitespace: /^\s+$/.test(text),
            startIndex: 0,
            endIndex: 0,
        }
    };
    
    // More efficient array manipulation
    const newNodes = [...editorState.nodes];
    newNodes.splice(nodeIndex + 1, 0, newNode);
    updateNodes(newNodes);
}

/**
 * Removes a node from the editor.
 * @param {string} nodeId - The ID of the node to remove.
 */
function removeNode(nodeId: string) {
    const nodeIndex = editorState.nodes.findIndex((n: Node) => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];
    
    // More efficient array manipulation
    const newNodes = [...editorState.nodes];
    newNodes.splice(nodeIndex, 1);
    updateNodes(newNodes);
}

/**
 * Undoes the last action.
 */
function undo() {
    if (editorState.undoStack.length === 0) return;

    const previousState = editorState.undoStack[editorState.undoStack.length - 1];
    editorState.redoStack = [editorState.nodes, ...editorState.redoStack];
    editorState.nodes = previousState;
    editorState.undoStack = editorState.undoStack.slice(0, -1);
}

/**
 * Redoes the last undone action.
 */
function redo() {
    if (editorState.redoStack.length === 0) return;

    const nextState = editorState.redoStack[0];
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.nodes = nextState;
    editorState.redoStack = editorState.redoStack.slice(1);
}

/**
 * Gets the current text content of the editor by joining the text of all nodes.
 * @returns {string} The current text content.
 */
function getContent(): string {
    return editorState.nodes.reduce((acc: string, node: Node) => acc + node.text, '');
}

/**
 * Gets the currently selected nodes based on drag selection state.
 * Uses cached positions for better performance.
 * @returns {Node[]} Array of selected nodes.
 */
function getSelectedNodes(): Node[] {
    // Only return nodes if we're in a valid selection state
    if (!dragSelectState.startNodeId || !dragSelectState.endNodeId || 
        (!dragSelectState.isDragging && !dragSelectState.isSelected)) {
        return [];
    }
    
    const startPos = getValidPosition(dragSelectState.startNodeId);
    const endPos = getValidPosition(dragSelectState.endNodeId);
    
    if (startPos === -1 || endPos === -1) {
        return [];
    }

    // Return empty array if selection is back to start
    if (startPos === endPos) {
        return [];
    }
    
    // Handle selection in both directions
    const start = Math.min(startPos, endPos);
    const end = Math.max(startPos, endPos);
    
    return editorState.nodes.slice(start, end + 1);
}

/**
 * Starts a drag selection operation.
 * Updates selection generation to match current node positions.
 * @param {string} nodeId - The ID of the node where selection started.
 */
function startDragSelection(nodeId: string) {
    dragSelectState.isDragging = true;
    dragSelectState.isSelected = false;
    dragSelectState.startNodeId = nodeId;
    dragSelectState.endNodeId = nodeId;
    dragSelectState.generation = nodeCache.version;
}

/**
 * Updates the current drag selection and group selection in real-time.
 * Uses cached positions for efficient updates.
 * @param {string} nodeId - The ID of the current node in the selection.
 */
function updateDragSelection(nodeId: string) {
    // Validate positions are from current generation
    const startPos = getValidPosition(dragSelectState.startNodeId!);
    const currentPos = getValidPosition(nodeId);
    
    if (startPos === -1 || currentPos === -1) {
        clearSelection();
        return;
    }

    // Clear selection if dragging back to start
    if (nodeId === dragSelectState.startNodeId) {
        dragSelectState.endNodeId = null;
        groupSelectState.selectedNodeIds.clear();
        groupSelectState.isGroupMode = false;
        return;
    }

    dragSelectState.endNodeId = nodeId;
    dragSelectState.generation = nodeCache.version;
    
    // Update group selection in real-time
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length > 0) {
        groupSelectState.selectedNodeIds = new Set(selectedNodes.map(node => node.id));
        groupSelectState.isGroupMode = true;
        groupSelectState.generation = nodeCache.version;
    } else {
        groupSelectState.selectedNodeIds.clear();
        groupSelectState.isGroupMode = false;
    }
}

/**
 * Ends the current drag selection operation and updates group selection.
 */
function endDragSelection() {
    dragSelectState.isDragging = false;
    dragSelectState.isSelected = true;
    updateGroupSelection();
}

/**
 * Clears the current selection.
 */
function clearSelection() {
    dragSelectState.isDragging = false;
    dragSelectState.isSelected = false;
    dragSelectState.startNodeId = null;
    dragSelectState.endNodeId = null;
    clearGroupSelection();
}

/**
 * Clears the group selection state.
 */
function clearGroupSelection() {
    groupSelectState.selectedNodeIds.clear();
    groupSelectState.isGroupMode = false;
}

/**
 * Checks if a node is part of the current group selection.
 * Validates selection generation before checking.
 * @param {string} nodeId - The ID of the node to check.
 * @returns {boolean} True if the node is part of the group selection.
 */
function isNodeInGroupSelection(nodeId: string): boolean {
    return groupSelectState.isGroupMode && 
           groupSelectState.generation === nodeCache.version &&
           groupSelectState.selectedNodeIds.has(nodeId);
}

/**
 * Updates the group selection with the currently selected nodes.
 * Only creates a group selection if multiple nodes are selected.
 */
function updateGroupSelection() {
    const selectedNodes = getSelectedNodes();
    if (selectedNodes.length > 1) {
        groupSelectState.selectedNodeIds = new Set(selectedNodes.map(node => node.id));
        groupSelectState.isGroupMode = true;
    }
}

/**
 * Unpacks a group node back into its original constituent nodes.
 * Handles both deletion and correction group nodes.
 * @param {Node} groupNode - The node containing grouped nodes in its metadata
 * @returns {Node[]} Array of the original nodes with updated positions
 */
function unpackGroupNode(groupNode: Node): Node[] {
    // Return the node itself if it has no grouped nodes
    if (!groupNode.metadata.groupedNodes || groupNode.metadata.groupedNodes.length === 0) {
        return [groupNode];
    }

    // Map the grouped nodes, preserving their original data but updating positions
    return groupNode.metadata.groupedNodes.map((node: Node, index: number) => ({
        ...node,
        // Ensure correction data is cleared and type is restored to normal
        type: 'normal' as const,
        correctionData: undefined,
        metadata: {
            ...node.metadata,
            position: groupNode.metadata.position + index,
            // Clear any group-specific metadata
            groupedNodes: undefined
        }
    }));
}

/**
 * Creates a deletion node from multiple selected nodes.
 * Combines the text of selected nodes into a single deletion node.
 * Stores original nodes in metadata for restoration.
 * 
 * @param {string[]} nodeIds - Array of node IDs to combine into a deletion
 */
function createMultiNodeDeletion(nodeIds: string[]) {
    const selectedNodes = nodeIds
        .map(id => editorState.nodes.find((n: Node) => n.id === id))
        .filter(Boolean) as Node[];
    
    if (selectedNodes.length === 0) return;

    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    const firstNode = selectedNodes[0];
    const lastNode = selectedNodes[selectedNodes.length - 1];
    const combinedText = selectedNodes.map((n: Node) => n.text).join(' ');

    const newNode: Node = {
        id: crypto.randomUUID(),
        text: combinedText,
        type: 'deletion' as const,
        metadata: {
            position: firstNode.metadata.position,
            isPunctuation: false,
            isWhitespace: false,
            startIndex: firstNode.metadata.startIndex,
            endIndex: lastNode.metadata.endIndex,
            groupedNodes: selectedNodes
        }
    };

    // Remove all selected nodes and insert the new deletion node
    const newNodes = editorState.nodes.filter((n: Node) => !nodeIds.includes(n.id));
    const insertIndex = newNodes.findIndex((n: Node) => n.metadata.position > firstNode.metadata.position);
    if (insertIndex === -1) {
        newNodes.push(newNode);
    } else {
        newNodes.splice(insertIndex, 0, newNode);
    }

    updateNodes(newNodes);
}

/**
 * Creates a correction from multiple selected nodes.
 * Combines the text of selected nodes and applies a correction to the combined text.
 * Stores original nodes in metadata for restoration.
 * 
 * @param {string[]} nodeIds - Array of node IDs to combine into a correction
 * @param {string} correctedText - The correction to apply to the combined text
 * @param {string} pattern - The correction pattern to apply
 * @param {string} [explanation] - Optional explanation for the correction
 */
function createMultiNodeCorrection(nodeIds: string[], correctedText: string, pattern: string, explanation?: string) {
    const selectedNodes = nodeIds
        .map(id => editorState.nodes.find((n: Node) => n.id === id))
        .filter(Boolean) as Node[];
    
    if (selectedNodes.length === 0) return;

    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    const firstNode = selectedNodes[0];
    const lastNode = selectedNodes[selectedNodes.length - 1];
    const combinedText = selectedNodes.map((n: Node) => n.text).join(' ');

    const newNode: Node = {
        id: crypto.randomUUID(),
        text: combinedText,
        type: 'correction' as const,
        metadata: {
            position: firstNode.metadata.position,
            isPunctuation: false,
            isWhitespace: false,
            startIndex: firstNode.metadata.startIndex,
            endIndex: lastNode.metadata.endIndex,
            groupedNodes: selectedNodes
        },
        correctionData: {
            correctedText,
            pattern,
            explanation
        }
    };

    // Remove all selected nodes and insert the new correction node
    const newNodes = editorState.nodes.filter((n: Node) => !nodeIds.includes(n.id));
    const insertIndex = newNodes.findIndex((n: Node) => n.metadata.position > firstNode.metadata.position);
    if (insertIndex === -1) {
        newNodes.push(newNode);
    } else {
        newNodes.splice(insertIndex, 0, newNode);
    }

    updateNodes(newNodes);
}

/**
 * Toggles deletion state for multiple nodes.
 */
function toggleMultiNodeDeletion(nodeIds: string[]) {
    // Filter out empty and spacer nodes
    const validNodeIds = nodeIds.filter(id => {
        const node = editorState.nodes.find(n => n.id === id);
        return node && node.type !== 'empty' && node.type !== 'spacer';
    });

    if (validNodeIds.length === 0) return;

    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    // Handle single node case
    if (validNodeIds.length === 1) {
        const nodeId = validNodeIds[0];
        const node = editorState.nodes.find(n => n.id === nodeId);
        if (node) {
            updateNode(nodeId, node.text, node.correctionData, node.spacerData, 
                node.type === 'deletion' ? 'normal' : 'deletion');
        }
        return;
    }

    // Check if any of the nodes are already group nodes (deletion or correction)
    const groupNode = editorState.nodes.find(n => 
        validNodeIds.includes(n.id) && 
        (n.type === 'deletion' || n.type === 'correction') && 
        n.metadata.groupedNodes
    );

    if (groupNode) {
        // Get all nodes that aren't being restored
        const newNodes = editorState.nodes.filter(n => !validNodeIds.includes(n.id));
        
        // Unpack the group node back to original nodes
        const restoredNodes = unpackGroupNode(groupNode);

        // Find where to insert the restored nodes
        const insertIndex = newNodes.findIndex(n => 
            n.metadata.position > groupNode.metadata.position
        );
        
        if (insertIndex === -1) {
            newNodes.push(...restoredNodes);
        } else {
            newNodes.splice(insertIndex, 0, ...restoredNodes);
        }
        
        updateNodes(newNodes);
    } else {
        // Create a single deletion node from the selected nodes
        createMultiNodeDeletion(validNodeIds);
    }

    // Clear active node and selection after operation
    editorState.activeNode = null;
    clearSelection();
}

/**
 * Removes multiple nodes from the editor.
 * Adds the current state to the undo stack before removing nodes.
 * 
 * @param {string[]} nodeIds - Array of node IDs to remove
 */
function removeNodes(nodeIds: string[]) {
    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    updateNodes(editorState.nodes.filter((node: Node) => !nodeIds.includes(node.id)));
}

/**
 * The main editor store object, containing functions and state for managing the editor.
 */
export const editorStore = {
    /**
     * Get/set the current editor mode
     */
    get mode() {
        return editorState.mode;
    },
    set mode(value: EditorModeType) {
        editorState.mode = value;
    },

    /**
     * Check if editor is in formatting mode
     */
    isFormattingMode() {
        return editorState.mode === EditorMode.FORMATTING;
    },

    /**
     * Check if editor is in editing mode
     */
    isEditingMode() {
        return editorState.mode === EditorMode.CORRECTING;
    },

    /**
     * Toggle between formatting and editing modes
     */
    toggleMode() {
        editorState.mode = editorState.mode === EditorMode.FORMATTING
            ? EditorMode.CORRECTING
            : EditorMode.FORMATTING;
    },

    /**
     * Check if an operation is allowed in the current mode
     */
    isOperationAllowed(operation: 'delete' | 'correct' | 'format'): boolean {
        if (editorState.mode === EditorMode.FORMATTING) {
            return operation === 'format';
        }
        return operation === 'delete' || operation === 'correct';
    },

    /**
     * Get the current nodes array.
     */
    get nodes() {
        return editorState.nodes;
    },
    /**
     * Performs a batch update of nodes with position recalculation.
     */
    batchUpdateNodes,
    /**
     * Get/set the active node ID.
     */
    get activeNode() {
        return editorState.activeNode;
    },
    set activeNode(value: string | null) {
        editorState.activeNode = value;
    },
    /**
     * Get the current document name.
     */
    get documentName() {
        return editorState.documentName;
    },
    /**
     * Get the current paragraphs.
     */
    get paragraphs() {
        return groupNodesByParagraph(editorState.nodes);
    },
    /**
     * Get the currently selected nodes.
     */
    get selectedNodes() {
        return getSelectedNodes();
    },
    /**
     * Get the current drag select state.
     */
    get dragSelect() {
        return dragSelectState;
    },
    /**
     * Get the current group selection state.
     */
    get groupSelect() {
        return {
            isGroupMode: groupSelectState.isGroupMode,
            selectedNodeIds: Array.from(groupSelectState.selectedNodeIds),
            isNodeSelected: (nodeId: string) => isNodeInGroupSelection(nodeId)
        };
    },
    /**
     * Parses the input text content and creates nodes.
     */
    parseContent,
    /**
     * Updates the properties of an existing node.
     */
    updateNode,
    /**
     * Inserts a new node after the specified node.
     */
    insertNodeAfter,
    /**
     * Removes a node from the editor.
     */
    removeNode,
    /**
     * Undoes the last action.
     */
    undo,
    /**
     * Redoes the last undone action.
     */
    redo,
    /**
     * Gets the current text content of the editor.
     */
    getContent,
    /**
     * Serializes the current nodes array into a JSON string.
     */
    getSerializedContent,
    /**
     * Loads and deserializes nodes from a JSON string.
     */
    loadSerializedContent,
    /**
     * Toggles the deletion state of a node.
     */
    toggleDeletion,
    /**
     * Sets both the document content and name.
     */
    setDocument,
    // Selection management
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    clearSelection,
    clearGroupSelection,
    isNodeInGroupSelection,
    // Multi-node operations
    createMultiNodeCorrection,
    toggleMultiNodeDeletion,
    removeNodes,
    unpackGroupNode
};

/**
 * A separate store for easier access to the active correction.
 */
export const activeCorrection = {
    /**
     * Get the current active node ID.
     */
    get value() {
        return editorState.activeNode;
    }
};
