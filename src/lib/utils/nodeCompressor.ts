// src/lib/utils/nodeCompressor.ts
import type { Node, NodeType, CompressedNode } from '$lib/schemas/textNode';

/**
 * Compresses an array of nodes into a JSON string for storage
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
export function compressNodes(nodes: Node[]): string {
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
 * Decompresses a JSON string back into an array of nodes
 */
export function decompressNodes(compressedJson: string): Node[] {
    // Parse the compressed JSON
    const compressed = JSON.parse(compressedJson) as CompressedNode[];
    
    // Filter out any unwanted spacer nodes before decompressing
    // Only keep spacer nodes with subtype 'lineBreak', 'indent', or 'alignment'
    const filteredCompressed = compressed.filter(node =>
        node.t !== 'spacer' || (node.s === 'lineBreak' || node.s === 'indent' || node.s === 'alignment')
    );
    
    // Decompress the filtered nodes
    return decompressCompressedNodes(filteredCompressed);
}

/**
 * Recursively decompresses compressed nodes
 */
function decompressCompressedNodes(compressed: CompressedNode[]): Node[] {
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
            node.metadata.groupedNodes = decompressCompressedNodes(c.m.g);
        }
        
        return node;
    });
}