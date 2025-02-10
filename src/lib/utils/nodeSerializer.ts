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
                o: node.correctionData.originalText,
                f: node.correctionData.correctedText,
                p: node.correctionData.pattern,
                ...(node.correctionData.explanation && { e: node.correctionData.explanation })
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
    return compressed.map((c: CompressedNode) => ({
        id: c.i,
        type: c.t as NodeType,
        text: c.x || '',
        ...(c.s && { spacerData: { subtype: c.s } }),
        ...(c.c && {
            correctionData: {
                originalText: c.c.o,
                correctedText: c.c.f,
                pattern: c.c.p,
                ...(c.c.e && { explanation: c.c.e })
            }
        }),
        metadata: {
            position: 0,  // Will be calculated on load
            lineNumber: 1,
            isPunctuation: false,
            isWhitespace: c.t === 'spacer',
            startIndex: 0,
            endIndex: 0
        }
    }));
}
