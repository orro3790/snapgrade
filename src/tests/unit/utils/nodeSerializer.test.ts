import { describe, it, expect } from 'vitest';
import { serializeNodes, deserializeNodes } from '$lib/utils/nodeSerializer';
import { basicNode, spacerNode, correctionNode, complexDocument } from '../../fixtures/nodeFixtures';

describe('nodeSerializer', () => {
    describe('serializeNodes', () => {
        /**
         * Tests the serialization of a basic text node.
         * Verifies that:
         * - The node is compressed into the minimal format (i, t, x)
         * - The id is preserved
         * - The type is correctly abbreviated
         * - The text content is maintained
         */
        it('serializes a basic text node correctly', () => {
            const serialized = serializeNodes([basicNode]);
            const parsed = JSON.parse(serialized);
            
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toEqual({
                i: 'test-id-1',
                t: 'normal',
                x: 'Hello'
            });
        });

        /**
         * Tests the serialization of a spacer node (whitespace, newlines, etc.).
         * Verifies that:
         * - Spacer nodes are correctly compressed
         * - The subtype is preserved in the 's' field
         * - Empty text is not included in the serialized output
         */
        it('serializes a spacer node correctly', () => {
            const serialized = serializeNodes([spacerNode]);
            const parsed = JSON.parse(serialized);
            
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toEqual({
                i: 'test-id-2',
                t: 'spacer',
                s: 'tab'
            });
        });

        /**
         * Tests the serialization of a correction node with all its associated data.
         * Verifies that:
         * - Correction data is properly compressed into the 'c' field
         * - All correction properties are preserved with abbreviated keys
         * - Optional fields (explanation) are included when present
         */
        it('serializes a correction node correctly', () => {
            const serialized = serializeNodes([correctionNode]);
            const parsed = JSON.parse(serialized);
            
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toEqual({
                i: 'test-id-3',
                t: 'correction',
                x: 'color',
                c: {
                    o: 'color',
                    f: 'colour',
                    p: 'AmE to BrE',
                    e: 'British spelling'
                }
            });
        });

        /**
         * Tests the serialization of a complex document with multiple node types.
         * Verifies that:
         * - Multiple nodes are correctly serialized in sequence
         * - Different node types maintain their specific properties
         * - The document structure is preserved
         */
        it('serializes a complex document with multiple nodes', () => {
            const serialized = serializeNodes(complexDocument);
            const parsed = JSON.parse(serialized);
            
            expect(parsed).toHaveLength(4);
            expect(parsed[0]).toHaveProperty('t', 'normal');
            expect(parsed[1]).toHaveProperty('s', 'tab');
            expect(parsed[2]).toHaveProperty('c');
            expect(parsed[3]).toHaveProperty('s', 'newline');
        });
    });

    describe('deserializeNodes', () => {
        /**
         * Tests the deserialization of a basic text node.
         * Verifies that:
         * - The compressed format is correctly expanded
         * - All required Node properties are restored
         * - The node maintains its original id and text
         */
        it('deserializes a basic text node correctly', () => {
            const serialized = serializeNodes([basicNode]);
            const deserialized = deserializeNodes(serialized);
            
            expect(deserialized).toHaveLength(1);
            expect(deserialized[0]).toMatchObject({
                id: 'test-id-1',
                text: 'Hello',
                type: 'normal'
            });
        });

        /**
         * Tests the deserialization of a spacer node.
         * Verifies that:
         * - Spacer subtypes are correctly restored
         * - The node's type and metadata are properly reconstructed
         * - Empty text is handled correctly
         */
        it('deserializes a spacer node correctly', () => {
            const serialized = serializeNodes([spacerNode]);
            const deserialized = deserializeNodes(serialized);
            
            expect(deserialized).toHaveLength(1);
            expect(deserialized[0]).toMatchObject({
                id: 'test-id-2',
                type: 'spacer',
                spacerData: {
                    subtype: 'tab'
                }
            });
        });

        /**
         * Tests the deserialization of a correction node.
         * Verifies that:
         * - All correction data is properly restored
         * - Optional fields are correctly handled
         * - The node structure matches the original
         */
        it('deserializes a correction node correctly', () => {
            const serialized = serializeNodes([correctionNode]);
            const deserialized = deserializeNodes(serialized);
            
            expect(deserialized).toHaveLength(1);
            expect(deserialized[0]).toMatchObject({
                id: 'test-id-3',
                text: 'color',
                type: 'correction',
                correctionData: {
                    originalText: 'color',
                    correctedText: 'colour',
                    pattern: 'AmE to BrE',
                    explanation: 'British spelling'
                }
            });
        });

        /**
         * Tests the deserialization of a complex document.
         * Verifies that:
         * - Multiple nodes are correctly deserialized in sequence
         * - The document structure is maintained
         * - All node types and their specific data are properly restored
         */
        it('deserializes a complex document correctly', () => {
            const serialized = serializeNodes(complexDocument);
            const deserialized = deserializeNodes(serialized);
            
            expect(deserialized).toHaveLength(4);
            expect(deserialized.map(n => n.type)).toEqual(['normal', 'spacer', 'correction', 'spacer']);
            expect(deserialized[1].spacerData?.subtype).toBe('tab');
            expect(deserialized[2].correctionData?.correctedText).toBe('colour');
            expect(deserialized[3].spacerData?.subtype).toBe('newline');
        });

        /**
         * Tests edge case: empty document
         * Verifies that the serializer/deserializer can handle empty arrays
         * without throwing errors
         */
        it('handles empty nodes array', () => {
            const serialized = serializeNodes([]);
            const deserialized = deserializeNodes(serialized);
            expect(deserialized).toEqual([]);
        });

        /**
         * Tests that metadata is properly preserved during serialization/deserialization.
         * Verifies that all required metadata fields are present in the deserialized node,
         * even though they're not explicitly stored in the serialized format.
         */
        it('preserves metadata structure', () => {
            const serialized = serializeNodes([basicNode]);
            const deserialized = deserializeNodes(serialized);
            
            expect(deserialized[0].metadata).toMatchObject({
                position: 0,
                lineNumber: 1,
                isPunctuation: false,
                isWhitespace: false,
                startIndex: 0,
                endIndex: 0
            });
        });
    });
});
