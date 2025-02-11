import type { Node, NodeType, CorrectionData } from '$lib/schemas/textNode';
import { serializeNodes, deserializeNodes } from '$lib/utils/nodeSerializer';

interface DragSelectState {
    isDragging: boolean;
    isSelected: boolean;
    startNodeId: string | null;
    endNodeId: string | null;
}

// Core state
const dragSelectState = $state<DragSelectState>({
    isDragging: false,
    isSelected: false,
    startNodeId: null,
    endNodeId: null
});

const editorState = $state({
    nodes: [] as Node[],
    activeNode: null as string | null,
    undoStack: [] as Node[][],
    redoStack: [] as Node[][],
    documentName: ""
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
                lineNumber: 1,
                isPunctuation,
                isWhitespace: false,
                startIndex: 0,
                endIndex: 0,
            }
        });
    });

    editorState.nodes = newNodes;
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
 * @param {{ subtype: 'newline' | 'tab' }} [spacerData] - Optional spacer data (for spacer nodes).
 * @param {NodeType} [type='normal'] - The node type. Defaults to 'normal'.
 */
function updateNode(nodeId: string, text: string, correctionData?: CorrectionData, spacerData?: { subtype: 'newline' | 'tab' }, type: NodeType = 'normal') {
    const nodeIndex = editorState.nodes.findIndex((n: Node) => n.id === nodeId);
    if (nodeIndex === -1) return;

    const oldNode = editorState.nodes[nodeIndex];
    
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

    editorState.nodes = newNodes;
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

    editorState.nodes = newNodes;
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
            lineNumber: editorState.nodes[nodeIndex].metadata.lineNumber,
            isPunctuation: /^[.,!?;:]$/.test(text),
            isWhitespace: /^\s+$/.test(text),
            startIndex: 0,
            endIndex: 0,
        }
    };
    
    // More efficient array manipulation
    const newNodes = [...editorState.nodes];
    newNodes.splice(nodeIndex + 1, 0, newNode);
    editorState.nodes = newNodes;
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
    editorState.nodes = newNodes;
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
 * @returns {Node[]} Array of selected nodes.
 */
function getSelectedNodes(): Node[] {
    if (!dragSelectState.startNodeId || (!dragSelectState.isDragging && !dragSelectState.isSelected)) {
        return [];
    }
    
    const startIndex = editorState.nodes.findIndex((n: Node) => n.id === dragSelectState.startNodeId);
    const endIndex = dragSelectState.endNodeId 
        ? editorState.nodes.findIndex((n: Node) => n.id === dragSelectState.endNodeId)
        : startIndex;
        
    if (startIndex === -1) {
        return [];
    }
    
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    return editorState.nodes.slice(start, end + 1);
}

/**
 * Starts a drag selection operation.
 * @param {string} nodeId - The ID of the node where selection started.
 */
function startDragSelection(nodeId: string) {
    dragSelectState.isDragging = true;
    dragSelectState.isSelected = false;
    dragSelectState.startNodeId = nodeId;
    dragSelectState.endNodeId = nodeId;
}

/**
 * Updates the current drag selection.
 * @param {string} nodeId - The ID of the current node in the selection.
 */
function updateDragSelection(nodeId: string) {
    dragSelectState.endNodeId = nodeId;
}

/**
 * Ends the current drag selection operation.
 */
function endDragSelection() {
    dragSelectState.isDragging = false;
    dragSelectState.isSelected = true;
}

/**
 * Clears the current selection.
 */
function clearSelection() {
    dragSelectState.isDragging = false;
    dragSelectState.isSelected = false;
    dragSelectState.startNodeId = null;
    dragSelectState.endNodeId = null;
}

/**
 * Creates a correction from multiple selected nodes.
 * @param {string[]} nodeIds - Array of node IDs to combine into a correction.
 * @param {string} correctedText - The correction to apply to the combined text.
 * @param {string} pattern - The correction pattern.
 * @param {string} [explanation] - Optional explanation for the correction.
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
            lineNumber: firstNode.metadata.lineNumber,
            isPunctuation: false,
            isWhitespace: false,
            startIndex: firstNode.metadata.startIndex,
            endIndex: lastNode.metadata.endIndex
        },
        correctionData: {
            originalText: combinedText,
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

    editorState.nodes = newNodes;
}

/**
 * Toggles deletion state for multiple nodes.
 * @param {string[]} nodeIds - Array of node IDs to toggle deletion for.
 */
function toggleMultiNodeDeletion(nodeIds: string[]) {
    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    const newNodes = editorState.nodes.map((node: Node) => {
        if (nodeIds.includes(node.id) && node.type !== 'empty' && node.type !== 'spacer') {
            return {
                ...node,
                type: node.type === 'deletion' ? ('normal' as const) : ('deletion' as const)
            };
        }
        return node;
    });

    editorState.nodes = newNodes;
}

/**
 * Removes multiple nodes from the editor.
 * @param {string[]} nodeIds - Array of node IDs to remove.
 */
function removeNodes(nodeIds: string[]) {
    // Save current state for undo
    editorState.undoStack = [...editorState.undoStack, editorState.nodes];
    editorState.redoStack = [];

    editorState.nodes = editorState.nodes.filter((node: Node) => !nodeIds.includes(node.id));
}

/**
 * The main editor store object, containing functions and state for managing the editor.
 */
export const editorStore = {
    /**
     * Get the current nodes array.
     */
    get nodes() {
        return editorState.nodes;
    },
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
    // Multi-node operations
    createMultiNodeCorrection,
    toggleMultiNodeDeletion,
    removeNodes
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
