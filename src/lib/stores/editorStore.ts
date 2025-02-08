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

// Parse text content into nodes
function parseContent(content: string) {
    const newNodes: Node[] = [];
    let position = 0;

    // Split content into tokens, preserving whitespace and punctuation
    const tokens = content.split(/(\s+|[.,!?;:])/).filter(Boolean);

    tokens.forEach(token => {
        if (/^\s+$/.test(token)) {
            // Handle whitespace
            if (token.includes('\n')) {
                // Handle multiple newlines
                for (let i = 0; i < token.length; i++) {
                    if (token[i] === '\n') {
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
                    }
                }
            } else if (token.length > 1) {
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
            // Handle text or punctuation
            const isPunctuation = /^[.,!?;:]$/.test(token);
            console.log(`Token: '${token}', isPunctuation: ${isPunctuation}`); // Add logging
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

import { serializeNodes, deserializeNodes } from '$lib/utils/nodeSerializer';

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
