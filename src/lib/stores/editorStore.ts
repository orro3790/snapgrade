// src/lib/stores/editorStore.ts
import { writable, derived } from 'svelte/store';
import { type Node, type NodeType, type CorrectionData } from '$lib/schemas/textNode';

// Core state
const { subscribe: nodesSubscribe, set: setNodes, update: updateNodes } = writable<Node[]>([]);
const { subscribe: activeNodeSubscribe, set: setActiveNode } = writable<string | null>(null);
const { subscribe: undoStackSubscribe, update: updateUndoStack } = writable<Node[][]>([]);
const { subscribe: redoStackSubscribe, update: updateRedoStack } = writable<Node[][]>([]);

// Derived state for paragraphs
export const paragraphs = derived(
    { subscribe: nodesSubscribe },
    ($nodes) => groupNodesByParagraph($nodes)
);

// Helper function to group nodes into paragraphs
function groupNodesByParagraph(nodes: Node[]) {
    const paragraphs: { id: string; corrections: Node[] }[] = [];
    let currentParagraph: Node[] = [];
    
    nodes.forEach((node, index) => {
        currentParagraph.push(node);
        
        // Create new paragraph on newline spacer or end of nodes
        if ((node.type === 'spacer' && node.spacerData?.subtype === 'newline') || index === nodes.length - 1) {
            if (currentParagraph.length > 0) {
                paragraphs.push({
                    id: crypto.randomUUID(),
                    corrections: [...currentParagraph]
                });
                currentParagraph = [];
            }
        }
    });
    
    return paragraphs;
}

import { serializeNodes, deserializeNodes } from '$lib/utils/nodeSerializer';

// Parse text content into nodes
function parseContent(content: string) {
    const newNodes: Node[] = [];
    const words = content.split(/(\s+)/); // Split on whitespace but keep separators
    let position = 0;
    
    words.forEach((word) => {
        if (!word) return; // Skip empty strings
        
        if (/^\s+$/.test(word)) {
            // Handle whitespace
            if (word.includes('\n')) {
                newNodes.push({
                    id: crypto.randomUUID(),
                    text: '',
                    type: 'spacer',
                    spacerData: { subtype: 'newline' },
                    metadata: {
                        position: position++,
                        lineNumber: 1,
                        isPunctuation: false,
                        isWhitespace: true,
                        startIndex: 0,
                        endIndex: 0
                    }
                });
            } else if (word.length > 1) {
                newNodes.push({
                    id: crypto.randomUUID(),
                    text: '',
                    type: 'spacer',
                    spacerData: { subtype: 'doubletab' },
                    metadata: {
                        position: position++,
                        lineNumber: 1,
                        isPunctuation: false,
                        isWhitespace: true,
                        startIndex: 0,
                        endIndex: 0
                    }
                });
            } else {
                newNodes.push({
                    id: crypto.randomUUID(),
                    text: '',
                    type: 'spacer',
                    spacerData: { subtype: 'tab' },
                    metadata: {
                        position: position++,
                        lineNumber: 1,
                        isPunctuation: false,
                        isWhitespace: true,
                        startIndex: 0,
                        endIndex: 0
                    }
                });
            }
        } else {
            // Handle normal text
            newNodes.push({
                id: crypto.randomUUID(),
                text: word,
                type: 'normal',
                metadata: {
                    position: position++,
                    lineNumber: 1,
                    isPunctuation: /^[.,!?;:]$/.test(word),
                    isWhitespace: false,
                    startIndex: 0,
                    endIndex: 0
                }
            });
        }
    });
    
    setNodes(newNodes);
    updateUndoStack(() => []);
    updateRedoStack(() => []);
}

// Get serialized content for storage
function getSerializedContent(): string {
    let nodes: Node[] = [];
    nodesSubscribe(($nodes) => {
        nodes = $nodes;
    })();
    return serializeNodes(nodes);
}

// Load serialized content
function loadSerializedContent(serialized: string) {
    const nodes = deserializeNodes(serialized);
    setNodes(nodes);
    updateUndoStack(() => []);
    updateRedoStack(() => []);
}

// Node manipulation functions
function updateNode(nodeId: string, text: string, correctionData?: CorrectionData, type: NodeType = 'normal') {
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
            ...(correctionData && { correctionData })
        };
        
        return [
            ...$nodes.slice(0, nodeIndex),
            updatedNode,
            ...$nodes.slice(nodeIndex + 1)
        ];
    });
}

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
                startIndex: 0, // Will be calculated
                endIndex: 0 // Will be calculated
            }
        };
        
        return [
            ...$nodes.slice(0, nodeIndex + 1),
            newNode,
            ...$nodes.slice(nodeIndex + 1)
        ];
    });
}

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


// Undo/Redo functionality
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

// Content getter for parent component updates
function getContent(): string {
    let content = '';
    nodesSubscribe(($nodes) => {
        content = $nodes.map(node => node.text).join('');
    })();
    return content;
}

// Export store interface
export const editorStore = {
    subscribe: nodesSubscribe,
    activeNode: {
        subscribe: activeNodeSubscribe,
        set: setActiveNode
    },
    paragraphs,
    parseContent,
    updateNode,
    insertNodeAfter,
    removeNode,
    setActiveNode: (nodeId: string | null) => setActiveNode(nodeId),
    undo,
    redo,
    getContent,
    getSerializedContent,
    loadSerializedContent
};

// Export active node as a separate store for easier access
export const activeCorrection = {
    subscribe: activeNodeSubscribe
};
