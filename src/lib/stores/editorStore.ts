// stores/editorStore.ts
import { writable, get } from 'svelte/store';

// Core node types - simplified to just the essential types
export type CorrectionType = 'normal' | 'deletion' | 'addition' | 'correction' | 'empty';

// Tags for metadata and categorization
export type CorrectionTag = 
  // Grammar & Usage
  | 'plural'
  | 'verb-tense'
  | 'subject-verb'
  | 'article'
  // Formatting
  | 'capital'
  | 'spacing'
  | 'punctuation'
  // Organization & References
  | 'paragraph'
  | 'merge'
  | 'reference'
  // Additional Types
  | 'wordchoice'
  | 'redundant';

interface CorrectionNode {
  id: string;
  text: string;
  type: CorrectionType;
  tag?: CorrectionTag;
  correctionText?: string;
  hasNextCorrection?: boolean;
  startIndex: number;
  endIndex: number;
  isPunctuation?: boolean;
  mispunctuation?: boolean;
  // Enhanced correction properties
  grammarNote?: string;    // For grammar annotations
  formatType?: string;     // For format corrections
  suggestionType?: string; // For organizational suggestions
  footnotes?: string[];    // For comments as footnotes
}

interface DocumentParagraph {
  id: string;
  content: string;
  corrections: CorrectionNode[];
  metadata?: {
    comments: string[];     // Footnote comments for this paragraph
    indentLevel?: number;   // For future nested paragraph support
    type?: 'text' | 'heading' | 'quote';  // For future paragraph types
  };
}

interface EditorState {
  paragraphs: DocumentParagraph[];
  activeCorrection: string | null;
  documentId: string | null;
  documentName: string | null;
  studentId: string | null;
  studentName: string | null;
  className: string | null;
  status: 'staged' | 'editing' | 'completed' | null;
  sourceType: 'telegram' | 'manual' | null;
  undoHistory: DocumentParagraph[][];
  redoHistory: DocumentParagraph[][];
  isSaving: boolean;
  lastSavedContent: string;
  initialContent: DocumentParagraph[] | null;
}

// Create the editor store with a complete set of operations
export function createEditorStore() {
  const { subscribe, update } = writable<EditorState>({
    paragraphs: [],
    activeCorrection: null,
    documentId: null,
    documentName: null,
    studentId: null,
    studentName: null,
    className: null,
    status: null,
    sourceType: null,
    undoHistory: [],
    redoHistory: [],
    isSaving: false,
    lastSavedContent: '',
    initialContent: null
  });

  // Helper function to save state for undo/redo
  function saveState(state: EditorState): EditorState {
    return {
      ...state,
      undoHistory: [...state.undoHistory, state.paragraphs],
      redoHistory: []
    };
  }

  // Helper function to parse text into nodes
  function parseTextIntoNodes(text: string, startIndex: number): CorrectionNode[] {
    const nodes: CorrectionNode[] = [];
    let currentIndex = startIndex;
    
    interface Match {
      type: CorrectionType;
      tag?: CorrectionTag;
      text: string;
      correction?: string;
      index: number;
      length: number;
      grammarNote?: string;
      formatType?: string;
      suggestionType?: string;
      footnotes?: string[];
    }
  
    const matches: Match[] = [];
    let match;

    // Basic Corrections
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
  
    const deletionRegex = /-([^-]+)-/g;
    while ((match = deletionRegex.exec(text)) !== null) {
      matches.push({
        type: 'deletion',
        text: match[1],
        index: match.index,
        length: match[0].length,
        tag: 'redundant' // All deletions are now tagged as redundant
      });
    }
  
    const additionRegex = /\[([^\]]+)\]/g;
    while ((match = additionRegex.exec(text)) !== null) {
      matches.push({
        type: 'addition',
        text: match[1],
        index: match.index,
        length: match[0].length,
        tag: 'wordchoice' // All additions are now tagged as word choice
      });
    }

    // Grammar & Usage (now as correction type with tags)
    const grammarRegex = /(\S+)\s+#(pl|vt|sv|art)#/g;
    while ((match = grammarRegex.exec(text)) !== null) {
      const grammarType = match[2];
      const tag = {
        'pl': 'plural',
        'vt': 'verb-tense',
        'sv': 'subject-verb',
        'art': 'article'
      }[grammarType] as CorrectionTag;
      
      matches.push({
        type: 'correction',
        tag,
        text: match[1],
        grammarNote: grammarType,
        index: match.index,
        length: match[0].length
      });
    }

    // Formatting (now as correction type with tags)
    const formatRegex = /(\S+)\s+#(cap|sp|punc)#/g;
    while ((match = formatRegex.exec(text)) !== null) {
      const formatType = match[2];
      const tag = {
        'cap': 'capital',
        'sp': 'spacing',
        'punc': 'punctuation'
      }[formatType] as CorrectionTag;
      
      matches.push({
        type: 'correction',
        tag,
        text: match[1],
        formatType,
        index: match.index,
        length: match[0].length
      });
    }

    // Organization (now as correction type with tags)
    const organizationRegex = /#(para|merge)#/g;
    while ((match = organizationRegex.exec(text)) !== null) {
      const tag = match[1] === 'para' ? 'paragraph' : 'merge' as CorrectionTag;
      matches.push({
        type: 'correction',
        tag,
        text: '',
        suggestionType: match[1],
        index: match.index,
        length: match[0].length
      });
    }

    // References (now as correction type with tag)
    const referenceRegex = /(\S+)\s+#ref#/g;
    while ((match = referenceRegex.exec(text)) !== null) {
      matches.push({
        type: 'correction',
        tag: 'reference',
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
      const parts = normalText.split(/(\s+)|([.,!?;:])/).filter(Boolean);
      
      for (const part of parts) {
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
          currentIndex += part.length;
        }
      }
    };
  
    // Process text with special syntax
    for (const match of matches) {
      if (match.index > lastIndex) {
        const normalText = text.slice(lastIndex, match.index);
        processNormalText(normalText);
      }
  
      const matchNode: CorrectionNode = {
        id: crypto.randomUUID(),
        text: match.text,
        type: match.type,
        tag: match.tag,
        startIndex: currentIndex,
        endIndex: currentIndex + match.text.length,
        isPunctuation: false,
        ...(match.correction && { correctionText: match.correction }),
        ...(match.grammarNote && { grammarNote: match.grammarNote }),
        ...(match.formatType && { formatType: match.formatType }),
        ...(match.suggestionType && { suggestionType: match.suggestionType }),
        ...(match.footnotes && { footnotes: match.footnotes }),
        hasNextCorrection: false
      };
  
      nodes.push(matchNode);
      currentIndex += match.length;
      lastIndex = match.index + match.length;
    }
  
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
      const paragraphs = content.split('\n\n').map((text, index) => {
        const nodes = parseTextIntoNodes(text, index * 1000);
        return {
          id: crypto.randomUUID(),
          content: text,
          corrections: nodes,
          metadata: {
            comments: [],
            type: 'text' as const
          }
        };
      });

      update(state => ({
        ...state,
        paragraphs,
        lastSavedContent: content,
        initialContent: state.initialContent === null ? paragraphs : state.initialContent
      }));
    },

    insertNodeAfter: (nodeId: string, text: string, type: CorrectionType = 'normal') => {
      update(state => {
        const newState = saveState(state);
        
        let nodeIndex = -1;
        const targetParagraph = state.paragraphs.find((para: DocumentParagraph) => {
          nodeIndex = para.corrections.findIndex(n => n.id === nodeId);
          return nodeIndex !== -1;
        });

        if (!targetParagraph || nodeIndex === -1) return state;

        const newNode: CorrectionNode = {
          id: crypto.randomUUID(),
          text,
          type,
          startIndex: targetParagraph.corrections[nodeIndex].endIndex + 1,
          endIndex: targetParagraph.corrections[nodeIndex].endIndex + 1 + text.length,
          isPunctuation: false
        };

        const paragraphs = state.paragraphs.map((para: DocumentParagraph) => {
          if (para.id === targetParagraph.id) {
            const newCorrections = [...para.corrections];
            newCorrections.splice(nodeIndex + 1, 0, newNode);
            return { ...para, corrections: newCorrections };
          }
          return para;
        });

        return {
          ...newState,
          paragraphs,
          activeCorrection: newNode.id
        };
      });
    },

    removeNode: (nodeId: string) => {
      update(state => {
        const newState = saveState(state);
        const paragraphs = state.paragraphs
          .map((para: DocumentParagraph) => ({
            ...para,
            corrections: para.corrections.filter(node => node.id !== nodeId)
          }))
          .filter(para => para.corrections.length > 0);
  
        return {
          ...newState,
          paragraphs,
          activeCorrection: state.activeCorrection === nodeId ? null : state.activeCorrection
        };
      });
    },

    updateNode: (nodeId: string, newText: string, newCorrectionText?: string, newType?: CorrectionType) => {
      update(state => {
        const newState = saveState(state);
        
        const paragraphs = state.paragraphs.map((para: DocumentParagraph) => ({
          ...para,
          corrections: para.corrections.map((node: CorrectionNode) => 
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
          paragraphs
        };
      });
    },

    setActiveNode: (nodeId: string | null) => {
      update(state => ({ ...state, activeCorrection: nodeId }));
    },

    undo: () => {
      update(state => {
        if (state.undoHistory.length === 0) return state;
        const newUndoHistory = [...state.undoHistory];
        const lastState = newUndoHistory.pop()!;
        return {
          ...state,
          paragraphs: lastState,
          undoHistory: newUndoHistory,
          redoHistory: [...state.redoHistory, state.paragraphs]
        };
      });
    },

    redo: () => {
      update(state => {
        if (state.redoHistory.length === 0) return state;
        const newRedoHistory = [...state.redoHistory];
        const nextState = newRedoHistory.pop()!;
        return {
          ...state,
          paragraphs: nextState,
          undoHistory: [...state.undoHistory, state.paragraphs],
          redoHistory: newRedoHistory
        };
      });
    },

    getContent: () => {
      const state = get({ subscribe });
      return state.paragraphs
        .map((para: DocumentParagraph) => 
          para.corrections
            .map(node => {
              if (node.type === 'normal') return node.text;
              
              // Handle core types
              switch (node.type) {
                case 'deletion':
                  return `-${node.text}-`;
                case 'addition':
                  return `[${node.text}]`;
                case 'correction':
                  if (node.tag) {
                    // Handle tagged corrections
                    const tagMap: Record<CorrectionTag, string> = {
                      'plural': 'pl',
                      'verb-tense': 'vt',
                      'subject-verb': 'sv',
                      'article': 'art',
                      'capital': 'cap',
                      'spacing': 'sp',
                      'punctuation': 'punc',
                      'paragraph': 'para',
                      'merge': 'merge',
                      'reference': 'ref',
                      'wordchoice': 'wc',
                      'redundant': 'red'
                    };
                    return `${node.text} #${tagMap[node.tag]}#`;
                  }
                  // Regular correction with correction text
                  return node.correctionText ? `${node.text} !${node.correctionText}!` : node.text;
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
