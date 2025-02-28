// src/lib/utils/nodeSerializer.ts
import type { Node, NodeType, CompressedNode } from '$lib/schemas/textNode';

/**
 * Serializes an array of nodes into a compressed JSON string for storage
 * Compression schema:
 * i: id
 * t: type
 * x: text (optional)
 * s: spacer subtype (optional)
 * c: correction data (optional)
 *   o: original text
 *   f: fixed/corrected text
 *   p: pattern
 *   e: explanation
 */
export function serializeNodes(nodes: Node[]): string {
    const compressed = nodes.map(node => ({
        i: node.id,
        t: node.type,
        ...(node.text && { x: node.text }),
        ...(node.spacerData && { s: node.spacerData.subtype }),
        ...(node.correctionData && {
            c: {
                f: node.correctionData.correctedText,
                p: node.correctionData.pattern,
                ...(node.correctionData.explanation && { e: node.correctionData.explanation }),
                ...(node.correctionData.teacherNotes && { n: node.correctionData.teacherNotes }),
                ...(node.correctionData.relatedCorrections && { r: node.correctionData.relatedCorrections })
            }
        })
    }));
    return JSON.stringify(compressed);
}

/**
 * Deserializes a compressed JSON string back into an array of nodes
 */
export function deserializeNodes(documentBody: string): Node[] {
    const compressed = JSON.parse(documentBody) as CompressedNode[];
    return deserializeCompressedNodes(compressed);
}

/**
 * Recursively deserializes compressed nodes
 */
function deserializeCompressedNodes(compressed: CompressedNode[]): Node[] {
    return compressed.map((c: CompressedNode) => {
        // Create the node without groupedNodes first
        const node: Node = {
            id: c.i,
            type: c.t as NodeType,
            text: c.x || '',
            ...(c.s && { spacerData: { subtype: c.s } }),
            ...(c.r && { structuralRole: c.r }),
            ...(c.c && {
                correctionData: {
                    correctedText: c.c.f,
                    pattern: c.c.p,
                    ...(c.c.e && { explanation: c.c.e }),
                    ...(c.c.n && { teacherNotes: c.c.n }),
                    ...(c.c.r && { relatedCorrections: c.c.r })
                }
            }),
            metadata: {
                position: 0,  // Will be calculated on load
                isPunctuation: c.m?.u || false,
                isWhitespace: c.t === 'spacer',
                startIndex: c.m?.s || 0,
                endIndex: c.m?.e || 0
            }
        };
        
        // Add groupedNodes if they exist
        if (c.m?.g) {
            node.metadata.groupedNodes = deserializeCompressedNodes(c.m.g);
        }
        
        return node;
    });
}
