/**
 * @module nodeParsingService
 * @description Service for parsing text into TextNodes and applying structural analysis
 */

import type { Node, SpacerSubtype, StructuralRole } from '$lib/schemas/textNode';
import type { StructuralAnalysis } from '$lib/schemas/documentProcessing';
import { serializeNodes } from '$lib/utils/nodeSerializer';

/**
 * Parse text content into an array of nodes
 * @param content Text content to parse
 * @returns Array of parsed nodes
 */
export const parseTextToNodes = (content: string): Node[] => {
  const nodes: Node[] = [];
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
    nodes.push({
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

  return nodes;
};

/**
 * Apply structural analysis to nodes
 * @param nodes Array of nodes to process
 * @param analysis Structural analysis from Claude
 * @returns Array of nodes with structural roles applied
 */
export const applyStructuralAnalysis = (
  nodes: Node[],
  analysis: StructuralAnalysis
): Node[] => {
  // Create a copy of the nodes to avoid mutating the original
  const processedNodes = [...nodes];
  
  // Apply structural roles to nodes based on analysis
  for (const element of analysis) {
    // Find the node at the specified position
    const nodeIndex = processedNodes.findIndex(
      node => node.metadata.position === element.position
    );
    
    if (nodeIndex !== -1) {
      // Update the node with the structural role
      processedNodes[nodeIndex] = {
        ...processedNodes[nodeIndex],
        structuralRole: element.type as StructuralRole
      };
      
      // Add appropriate spacer nodes based on structural role
      switch (element.type) {
        case 'title':
        case 'subtitle':
        case 'heading':
          // Add line breaks before and after
          insertSpacerNode(processedNodes, nodeIndex, 'lineBreak');
          insertSpacerNode(processedNodes, nodeIndex + 2, 'lineBreak');
          break;
          
        case 'paragraph':
          // Add line break and indent
          insertSpacerNode(processedNodes, nodeIndex, 'lineBreak');
          insertSpacerNode(processedNodes, nodeIndex + 1, 'indent');
          break;
      }
    }
  }
  
  // Recalculate positions for all nodes
  return processedNodes.map((node, index) => ({
    ...node,
    metadata: {
      ...node.metadata,
      position: index
    }
  }));
};

/**
 * Insert a spacer node at the specified position
 * @param nodes Array of nodes to modify
 * @param position Position to insert the spacer node
 * @param subtype Type of spacer to insert
 */
const insertSpacerNode = (
  nodes: Node[],
  position: number,
  subtype: SpacerSubtype
): void => {
  const spacerNode: Node = {
    id: crypto.randomUUID(),
    text: '',
    type: 'spacer',
    spacerData: { subtype },
    metadata: {
      position,
      isPunctuation: false,
      isWhitespace: true,
      startIndex: 0,
      endIndex: 0
    }
  };
  
  nodes.splice(position, 0, spacerNode);
};

/**
 * Process text with structural analysis and return serialized nodes
 * @param text Raw text content
 * @param analysis Structural analysis from Claude
 * @returns Serialized nodes as JSON string
 */
export const processTextWithAnalysis = (
  text: string,
  analysis: StructuralAnalysis
): { nodes: Node[], serialized: string } => {
  // Parse text into nodes
  const nodes = parseTextToNodes(text);
  
  // Apply structural analysis
  const processedNodes = applyStructuralAnalysis(nodes, analysis);
  
  // Serialize nodes for storage
  const serialized = serializeNodes(processedNodes);
  
  return { nodes: processedNodes, serialized };
};