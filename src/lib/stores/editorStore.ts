// stores/editorStore.ts
import { writable, get } from 'svelte/store';

// Type Definitions
type CorrectionType = 'normal' | 'deletion' | 'addition' | 'correction' | 'empty';

interface TextNode {
  id: string;
  text: string;
  type: CorrectionType;
  correctionText?: string;
  hasNextCorrection?: boolean;
  startIndex: number;
  endIndex: number;
  isPunctuation?: boolean;
  mispunctuation?: boolean;
}

interface NodeList {
  id: string;
  nodes: TextNode[];
  originalText: string;
}

interface EditorState {
  nodeList: NodeList[];
  activeNodeId: string | null;
  undoStack: NodeList[][];
  redoStack: NodeList[][];
  isSaving: boolean;
  lastSavedContent: string;
  initialState: NodeList[] | null;
}

// Create the editor store with a complete set of operations
export function createEditorStore() {
  const { subscribe, update } = writable<EditorState>({
    nodeList: [],
    activeNodeId: null,
    undoStack: [],
    redoStack: [],
    isSaving: false,
    lastSavedContent: '',
    initialState: null
  });

  // Helper function to save state for undo/redo
  function saveState(state: EditorState): EditorState {
    return {
      ...state,
      undoStack: [...state.undoStack, state.nodeList],
      redoStack: []
    };
  }

  // Helper function to parse text into nodes
  function parseTextIntoNodes(text: string, startIndex: number): TextNode[] {
    const nodes: TextNode[] = [];
    let currentIndex = startIndex;
    
    interface Match {
      type: CorrectionType;
      text: string;
      correction?: string;
      index: number;
      length: number;
    }
  
    const matches: Match[] = [];
  
    // Find all special syntax matches first
    let match;
    // Corrections: word !correction!
    const correctionRegex = /(\S+)\s+!([^!]+)!/g;
    while ((match = correctionRegex.exec(text)) !== null) {
      matches.push({
        type: 'correction',
        text: match[1],
        correction: match[2],
        index: match.index,
        length: match[0].length
      });
    }
  
    // Deletions: -word-
    const deletionRegex = /-([^-]+)-/g;
    while ((match = deletionRegex.exec(text)) !== null) {
      matches.push({
        type: 'deletion',
        text: match[1],
        index: match.index,
        length: match[0].length
      });
    }
  
    // Additions: [word]
    const additionRegex = /\[([^\]]+)\]/g;
    while ((match = additionRegex.exec(text)) !== null) {
      matches.push({
        type: 'addition',
        text: match[1],
        index: match.index,
        length: match[0].length
      });
    }
  
    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);
  
    let lastIndex = 0;
    
    // Helper function to process normal text
    const processNormalText = (normalText: string) => {
      // Split the text into words and punctuation, preserving order
      // This regex splits on:
      // 1. Spaces (but doesn't create nodes for them)
      // 2. Punctuation marks (creating separate nodes)
      const parts = normalText.split(/(\s+)|([.,!?;:])/).filter(Boolean);
      
      for (const part of parts) {
        // Skip whitespace parts
        if (!/^\s+$/.test(part)) {
          const isPunctuation = /^[.,!?;:]$/.test(part);
          
          nodes.push({
            id: crypto.randomUUID(),
            text: part,
            type: 'normal',
            startIndex: currentIndex,
            endIndex: currentIndex + part.length,
            isPunctuation,
            mispunctuation: false
          });
          
          currentIndex += part.length;
        } else {
          // Just update the index for whitespace
          currentIndex += part.length;
        }
      }
    };
  
    // Process text with special syntax
    for (const match of matches) {
      // Process normal text before the match
      if (match.index > lastIndex) {
        const normalText = text.slice(lastIndex, match.index);
        processNormalText(normalText);
      }
  
      // Add the matched node
      const matchNode: TextNode = {
        id: crypto.randomUUID(),
        text: match.text,
        type: match.type,
        startIndex: currentIndex,
        endIndex: currentIndex + match.text.length,
        isPunctuation: false
      };
  
      if (match.type === 'correction' && match.correction) {
        matchNode.correctionText = match.correction;
        matchNode.hasNextCorrection = false;
      }
  
      nodes.push(matchNode);
      currentIndex += match.length;
      lastIndex = match.index + match.length;
    }
  
    // Process remaining normal text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      processNormalText(remainingText);
    }
  
    // Post-process nodes for adjacent corrections
    for (let i = 0; i < nodes.length - 1; i++) {
      if (nodes[i].type === 'correction' && nodes[i + 1].type === 'correction') {
        nodes[i].hasNextCorrection = true;
      }
      if (nodes[i].type === 'correction' && nodes[i + 1].isPunctuation) {
        nodes[i].hasNextCorrection = true;
      }
    }
  
    return nodes;
  }
  const actions = {
    subscribe,

    parseContent: (content: string) => {
      const nodeList = content.split('\n\n').map((text, index) => ({
        id: crypto.randomUUID(),
        nodes: parseTextIntoNodes(text, index * 1000),
        originalText: text
      }));

      update(state => ({
        ...state,
        nodeList,
        lastSavedContent: content,
        initialState: state.initialState === null ? nodeList : state.initialState
      }));
    },

    insertNodeAfter: (nodeId: string, text: string, type: CorrectionType = 'normal') => {
      update(state => {
        const newState = saveState(state);
        
        let nodeIndex = -1;
        const targetParagraph = state.nodeList.find(para => {
          nodeIndex = para.nodes.findIndex(n => n.id === nodeId);
          return nodeIndex !== -1;
        });

        if (!targetParagraph || nodeIndex === -1) return state;

        const newNode: TextNode = {
          id: crypto.randomUUID(),
          text,
          type,
          startIndex: targetParagraph.nodes[nodeIndex].endIndex + 1,
          endIndex: targetParagraph.nodes[nodeIndex].endIndex + 1 + text.length,
          isPunctuation: false
        };

        const nodeList = state.nodeList.map(para => {
          if (para.id === targetParagraph.id) {
            const newNodes = [...para.nodes];
            newNodes.splice(nodeIndex + 1, 0, newNode);
            return {
              ...para,
              nodes: newNodes
            };
          }
          return para;
        });

        return {
          ...newState,
          nodeList,
          activeNodeId: newNode.id // Set the new node as active
        };
      });
    },

    removeNode: (nodeId: string) => {
      update(state => {
          const newState = saveState(state);
          
          // Filter out paragraphs with no nodes to prevent empty paragraphs
          const nodeList = state.nodeList
              .map(para => ({
                  ...para,
                  nodes: para.nodes.filter(node => node.id !== nodeId)
              }))
              .filter(para => para.nodes.length > 0);  // Remove empty paragraphs
  
          return {
              ...newState,
              nodeList,
              activeNodeId: state.activeNodeId === nodeId ? null : state.activeNodeId
          };
      });
  },

    updateNode: (nodeId: string, newText: string, newCorrectionText?: string, newType?: CorrectionType) => {
      update(state => {
        const newState = saveState(state);
        
        const nodeList = state.nodeList.map(para => ({
          ...para,
          nodes: para.nodes.map(node => 
            node.id === nodeId 
              ? { 
                  ...node, 
                  text: newText,
                  type: newType || node.type,
                  ...(newCorrectionText !== undefined && { correctionText: newCorrectionText })
                }
              : node
          )
        }));

        return {
          ...newState,
          nodeList
        };
      });
    },

    setActiveNode: (nodeId: string | null) => {
      update(state => ({ ...state, activeNodeId: nodeId }));
    },

    undo: () => {
      update(state => {
        if (state.undoStack.length === 0) return state;

        const newUndoStack = [...state.undoStack];
        const lastState = newUndoStack.pop()!;
        
        return {
          ...state,
          nodeList: lastState,
          undoStack: newUndoStack,
          redoStack: [...state.redoStack, state.nodeList]
        };
      });
    },

    redo: () => {
      update(state => {
        if (state.redoStack.length === 0) return state;

        const newRedoStack = [...state.redoStack];
        const nextState = newRedoStack.pop()!;
        
        return {
          ...state,
          nodeList: nextState,
          undoStack: [...state.undoStack, state.nodeList],
          redoStack: newRedoStack
        };
      });
    },

    getContent: () => {
      const state = get({ subscribe });
      return state.nodeList
        .map(para => 
          para.nodes
            .map(node => {
              switch (node.type) {
                case 'deletion':
                  return `-${node.text}-`;
                case 'addition':
                  return `[${node.text}]`;
                case 'correction':
                  return `${node.text} !${node.correctionText}!`;
                default:
                  return node.text;
              }
            })
            .join(' ')
        )
        .join('\n\n');
    }
  };

  return actions;
}

export const editorStore = createEditorStore();
