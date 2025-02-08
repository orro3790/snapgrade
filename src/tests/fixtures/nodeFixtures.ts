import type { Node } from '$lib/schemas/textNode';

export const basicNode: Node = {
    id: 'test-id-1',
    text: 'Hello',
    type: 'normal',
    metadata: {
        position: 0,
        lineNumber: 1,
        isPunctuation: false,
        isWhitespace: false,
        startIndex: 0,
        endIndex: 5
    }
};

export const spacerNode: Node = {
    id: 'test-id-2',
    text: '',
    type: 'spacer',
    spacerData: {
        subtype: 'tab'
    },
    metadata: {
        position: 1,
        lineNumber: 1,
        isPunctuation: false,
        isWhitespace: true,
        startIndex: 5,
        endIndex: 6
    }
};

export const correctionNode: Node = {
    id: 'test-id-3',
    text: 'color',
    type: 'correction',
    correctionData: {
        originalText: 'color',
        correctedText: 'colour',
        pattern: 'AmE to BrE',
        explanation: 'British spelling'
    },
    metadata: {
        position: 2,
        lineNumber: 1,
        isPunctuation: false,
        isWhitespace: false,
        startIndex: 6,
        endIndex: 11
    }
};

export const complexDocument: Node[] = [
    basicNode,
    spacerNode,
    correctionNode,
    {
        id: 'test-id-4',
        text: '',
        type: 'spacer',
        spacerData: {
            subtype: 'newline'
        },
        metadata: {
            position: 3,
            lineNumber: 1,
            isPunctuation: false,
            isWhitespace: true,
            startIndex: 11,
            endIndex: 12
        }
    }
];
