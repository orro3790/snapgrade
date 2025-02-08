import { writable, derived } from 'svelte/store';
import { type Node, type NodeType, type CorrectionData } from '$lib/schemas/textNode';

// Core state
const { subscribe: nodesSubscribe, set: setNodes, update: updateNodes } = writable<Node[]>([]);
const { subscribe: activeNodeSubscribe, set: setActiveNode } = writable<string | null>(null);
const { subscribe: undoStackSubscribe, update: updateUndoStack } = writable<Node[][]>([]);
const { subscribe: redoStackSubscribe, update: updateRedoStack } = writable<Node[][]>([]);

// Derived state for paragraphs
/**
 * A derived store that groups nodes into paragraphs based on newline spacer nodes.
 */
export const paragraphs = derived(
    { subscribe: nodesSubscribe },
    ($nodes) => groupNodesByParagraph($nodes)
);

/**
 * Groups an array of nodes into paragraphs.  Paragraphs are delimited by 'newline' spacer nodes.
 * @param {Node[]} nodes - The array of nodes to group.
 * @returns {{ id: string; corrections: Node[] }[]} An array of paragraph objects, where each object contains a unique ID and an array of nodes belonging to that paragraph.
 */
function groupNodesByParagraph(nodes: Node[]) {
    const paragraphs: { id: string; corrections: Node[] }[] = [];
    let currentParagraph: Node[] = [];

    console.log("Initial nodes:", nodes);

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node.type === 'spacer' && node.spacerData?.subtype === 'newline') {
            // Add current paragraph (without the newline)
            paragraphs.push({
                id: crypto.randomUUID(),
                corrections: [...currentParagraph]
            });
            currentParagraph = [];

            console.log("Paragraph added (newline encountered):", paragraphs);

            // Consume ALL consecutive newlines
            while (i + 1 < nodes.length &&
                   nodes[i + 1].type === 'spacer' &&
                   nodes[i + 1].spacerData?.subtype === 'newline') {
                paragraphs.push({
                    id: crypto.randomUUID(),
                    corrections: [nodes[i+1]] // Add the newline node to the empty paragraph
                });
                console.log("Empty paragraph added:", paragraphs);
                i++; // Increment i to consume the newline
            }
        } else {
            currentParagraph.push(node);
            console.log("Node added to current paragraph:", currentParagraph);
        }
    }

    // Add final paragraph if there are remaining nodes
    if (currentParagraph.length > 0) {
        paragraphs.push({
            id: crypto.randomUUID(),
            corrections: currentParagraph
        });
        console.log("Final paragraph added:", paragraphs);
    }

    return paragraphs;
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
        const isPunctuation = /^[.,!?;:]$/.test(token);
        console.log(`Token: '${token}', isPunctuation: ${isPunctuation}`);
        newNodes.push({
            id: crypto.randomUUID(),
            text: token,
            type: 'normal',
            metadata: {
                position: position++,
                lineNumber: 1,
                isPunctuation,
                isWhitespace: false,
                startIndex: 0,
                endIndex: 0
            }
        });
    });

    setNodes(newNodes);
    updateUndoStack(() => []);
    updateRedoStack(() => []);
}

/**
 * Serializes the current nodes array into a JSON string for storage.
 * @returns {string} The serialized JSON string.
 */
function getSerializedContent(): string {
    let nodes: Node[] = [];
    nodesSubscribe(($nodes) => {
        nodes = $nodes;
    })();
    return serializeNodes(nodes);
}

/**
 * Loads and deserializes nodes from a JSON string.
 * @param {string} serialized - The serialized JSON string.
 */
function loadSerializedContent(serialized: string) {
    const nodes = deserializeNodes(serialized);
    setNodes(nodes);
    updateUndoStack(() => []);
    updateRedoStack(() => []);
}

import { serializeNodes, deserializeNodes } from '$lib/utils/nodeSerializer';

/**
 * Updates the properties of an existing node.
 * @param {string} nodeId - The ID of the node to update.
 * @param {string} text - The new text content of the node.
 * @param {CorrectionData} [correctionData] - Optional correction data.
 * @param {{ subtype: 'newline' | 'tab' }} [spacerData] - Optional spacer data (for spacer nodes).
 * @param {NodeType} [type='normal'] - The node type. Defaults to 'normal'.
 */
function updateNode(nodeId: string, text: string, correctionData?: CorrectionData, spacerData?: { subtype: 'newline' | 'tab' }, type: NodeType = 'normal') {
    updateNodes($nodes => {
        const nodeIndex = $nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return $nodes;

        // Save current state for undo
        updateUndoStack($undoStack => [...$undoStack, [...$nodes]]);
        updateRedoStack(() => []);

        const updatedNode = {
            ...$nodes[nodeIndex],
            text,
            type,
            ...(correctionData && { correctionData }),
            ...(spacerData && { spacerData })
        };

        return [
            ...$nodes.slice(0, nodeIndex),
            updatedNode,
            ...$nodes.slice(nodeIndex + 1)
        ];
    });
}

/**
 * Inserts a new node after the specified node.
 * @param {string} nodeId - The ID of the node after which to insert the new node.
 * @param {string} text - The text content of the new node.
 * @param {NodeType} [type='normal'] - The type of the new node. Defaults to 'normal'.
 */
function insertNodeAfter(nodeId: string, text: string, type: NodeType = 'normal') {
    updateNodes($nodes => {
        const nodeIndex = $nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return $nodes;
        
        // Save current state for undo
        updateUndoStack($undoStack => [...$undoStack, [...$nodes]]);
        updateRedoStack(() => []);
        
        const newNode: Node = {
            id: crypto.randomUUID(),
            text,
            type,
            metadata: {
                position: $nodes[nodeIndex].metadata.position + 1,
                lineNumber: $nodes[nodeIndex].metadata.lineNumber,
                isPunctuation: /^[.,!?;:]$/.test(text),
                isWhitespace: /^\s+$/.test(text),
                startIndex: 0,
                endIndex: 0
            }
        };
        
        return [
            ...$nodes.slice(0, nodeIndex + 1),
            newNode,
            ...$nodes.slice(nodeIndex + 1)
        ];
    });
}

/**
 * Removes a node from the editor.
 * @param {string} nodeId - The ID of the node to remove.
 */
function removeNode(nodeId: string) {
    updateNodes($nodes => {
        const nodeIndex = $nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return $nodes;
        
        // Save current state for undo
        updateUndoStack($undoStack => [...$undoStack, [...$nodes]]);
        updateRedoStack(() => []);
        
        return [
            ...$nodes.slice(0, nodeIndex),
            ...$nodes.slice(nodeIndex + 1)
        ];
    });
}

/**
 * Undoes the last action.
 */
function undo() {
    let canUndo = false;
    undoStackSubscribe(($undoStack) => {
        canUndo = $undoStack.length > 0;
    })();

    if (!canUndo) return;

    let currentNodes: Node[] = [];
    nodesSubscribe(($nodes) => {
        currentNodes = $nodes;
    })();
    
    updateRedoStack($redoStack => [currentNodes, ...$redoStack]);
    
    updateUndoStack($undoStack => {
        const previousState = $undoStack[$undoStack.length - 1];
        setNodes(previousState);
        return $undoStack.slice(0, -1);
    });
}

/**
 * Redoes the last undone action.
 */
function redo() {
    let canRedo = false;
    redoStackSubscribe(($redoStack) => {
        canRedo = $redoStack.length > 0;
    })();

    if (!canRedo) return;

    let currentNodes: Node[] = [];
    nodesSubscribe(($nodes) => {
        currentNodes = $nodes;
    })();
    
    updateUndoStack($undoStack => [...$undoStack, currentNodes]);
    
    updateRedoStack($redoStack => {
        const nextState = $redoStack[0];
        setNodes(nextState);
        return $redoStack.slice(1);
    });
}

/**
 * Gets the current text content of the editor by joining the text of all nodes.
 * @returns {string} The current text content.
 */
function getContent(): string {
    let content = '';
    nodesSubscribe(($nodes) => {
        content = $nodes.map(node => node.text).join('');
    })();
    return content;
}

/**
 * The main editor store object, containing functions and stores for managing the editor state.
 */
export const editorStore = {
    /**
     * Subscribe to changes in the nodes array.
     */
    subscribe: nodesSubscribe,
    /**
     * Store for managing the active node.
     */
    activeNode: {
        /**
         * Subscribe to changes in the active node ID.
         */
        subscribe: activeNodeSubscribe,
        /**
         * Sets the active node ID.
         * @param {string | null} nodeId - The ID of the node to set as active, or null to clear the active node.
         */
        set: setActiveNode
    },
    /**
     * A derived store that groups nodes into paragraphs.
     */
    paragraphs,
    /**
     * Parses the input text content and creates nodes.
     * @param {string} content - The input text content.
     */
    parseContent,
    /**
     * Updates the properties of an existing node.
     * @param {string} nodeId - The ID of the node to update.
     * @param {string} text - The new text content.
     * @param {CorrectionData} [correctionData] - Optional correction data.
     * @param {object} [spacerData] - Optional spacerData (subtype).
     * @param {NodeType} [type='normal'] - The node type.
     */
    updateNode,
    /**
     * Inserts a new node after the specified node.
     * @param {string} nodeId - The ID of the node after which to insert.
     * @param {string} text - The text content of the new node.
     * @param {NodeType} [type='normal'] - The type of the new node.
     */
    insertNodeAfter,
    /**
     * Removes a node from the editor.
     * @param {string} nodeId - The ID of the node to remove.
     */
    removeNode,
     /**
     * Sets the active node ID.
     * @param {string | null} nodeId The ID of the node to set as active, or null to clear the active node.
     */
    setActiveNode: (nodeId: string | null) => setActiveNode(nodeId),
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
     * @returns {string} The current text content.
     */
    getContent,
    /**
     * Serializes the current nodes array into a JSON string.
     * @returns {string} The serialized JSON string.
     */
    getSerializedContent,
    /**
     * Loads and deserializes nodes from a JSON string.
     * @param {string} serialized - The serialized JSON string.
     */
    loadSerializedContent
};

/**
 * A separate store for easier access to the active correction.
 */
// Export active node as a separate store for easier access
export const activeCorrection = {
    /**
     * Subscribe to changes in the active node ID.
     */
    subscribe: activeNodeSubscribe
};
