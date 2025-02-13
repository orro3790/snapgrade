import { describe, it, expect, beforeEach } from 'vitest';
import { editorStore } from '$lib/stores/editorStore.svelte';
import { get } from 'svelte/store';
import { tick } from 'svelte';

describe('editorStore', () => {
    beforeEach(() => {
        // Reset store before each test
        editorStore.parseContent('');
    });

    describe('parseContent', () => {
        /**
         * Tests basic text parsing functionality
         * Verifies that text is correctly split into nodes with proper types
         * and metadata, ignoring whitespace
         */
        it('parses simple text into nodes, ignoring whitespace', () => {
            editorStore.parseContent('Hello world');
            const nodes = get({ subscribe: editorStore.subscribe });
            
            expect(nodes).toHaveLength(2); // Just "Hello" and "world"
            expect(nodes[0].text).toBe('Hello');
            expect(nodes[1].text).toBe('world');
        });

        /**
         * Tests that whitespace is properly ignored during parsing
         * Verifies that multiple spaces and other whitespace characters
         * are not converted into nodes
         */
        it('ignores all whitespace during parsing', () => {
            editorStore.parseContent('Hello  \t  world');
            const nodes = get({ subscribe: editorStore.subscribe });
            
            expect(nodes).toHaveLength(2); // Just text nodes
            expect(nodes[0].text).toBe('Hello');
            expect(nodes[1].text).toBe('world');
        });

        /**
         * Tests that newlines are ignored during parsing
         * Verifies that newline characters are not automatically
         * converted to spacer nodes
         */
        it('ignores newlines during parsing', () => {
            editorStore.parseContent('Hello\nworld');
            const nodes = get({ subscribe: editorStore.subscribe });
            
            expect(nodes).toHaveLength(2); // Just text nodes
            expect(nodes[0].text).toBe('Hello');
            expect(nodes[1].text).toBe('world');
        });

        /**
         * Tests punctuation detection
         * Verifies that punctuation marks are properly identified in the
         * node metadata
         */
        it('identifies punctuation correctly', async () => {
            editorStore.parseContent('Hello, world!');
            await tick();
            const nodes = get({ subscribe: editorStore.subscribe });

            console.log("Nodes:", nodes);

            expect(nodes).toHaveLength(4); // "Hello", ",", "world", "!"
            expect(nodes[1].metadata['isPunctuation']).toBe(true); // comma
            expect(nodes[3].metadata['isPunctuation']).toBe(true); // exclamation mark
        });
    });

    describe('node manipulation', () => {
        /**
         * Tests node update functionality
         * Verifies that existing nodes can be modified while maintaining
         * the document structure
         */
        it('updates existing node', () => {
            editorStore.parseContent('Hello');
            const nodes = get({ subscribe: editorStore.subscribe });
            const nodeId = nodes[0].id;
            
            editorStore.updateNode(nodeId, 'Hi', undefined, { subtype: 'newline' }, 'normal');
            const updatedNodes = get({ subscribe: editorStore.subscribe });
            
            expect(updatedNodes[0].text).toBe('Hi');
            expect(updatedNodes[0].type).toBe('normal');
        });

        /**
         * Tests node insertion functionality
         * Verifies that new nodes can be inserted at specific positions
         * while maintaining document integrity
         */
        it('inserts node after specified node', () => {
            editorStore.parseContent('Hello');
            const nodes = get({ subscribe: editorStore.subscribe });
            const nodeId = nodes[0].id;
            
            editorStore.insertNodeAfter(nodeId, 'world');
            const updatedNodes = get({ subscribe: editorStore.subscribe });
            
            expect(updatedNodes).toHaveLength(2);
            expect(updatedNodes[1].text).toBe('world');
            expect(updatedNodes[1].metadata.position).toBe(1);
        });

        /**
         * Tests node removal functionality
         * Verifies that nodes can be removed while maintaining
         * document structure and metadata
         */
        it('removes node correctly', () => {
            editorStore.parseContent('Hello world');
            const nodes = get({ subscribe: editorStore.subscribe });
            const nodeId = nodes[0].id;
            
            editorStore.removeNode(nodeId);
            const updatedNodes = get({ subscribe: editorStore.subscribe });
            
            expect(updatedNodes).toHaveLength(1); // Just "world" remains
            expect(updatedNodes[0].text).toBe('world');
        });
    });

    describe('undo/redo functionality', () => {
        /**
         * Tests basic undo functionality
         * Verifies that changes can be undone and the document returns
         * to its previous state
         */
        it('can undo node updates', () => {
            editorStore.parseContent('Hello');
            const nodes = get({ subscribe: editorStore.subscribe });
            const nodeId = nodes[0].id;
            
            editorStore.updateNode(nodeId, 'Hi');
            editorStore.undo();
            
            const undoneNodes = get({ subscribe: editorStore.subscribe });
            expect(undoneNodes[0].text).toBe('Hello');
        });

        /**
         * Tests basic redo functionality
         * Verifies that undone changes can be redone
         */
        it('can redo undone changes', () => {
            editorStore.parseContent('Hello');
            const nodes = get({ subscribe: editorStore.subscribe });
            const nodeId = nodes[0].id;
            
            editorStore.updateNode(nodeId, 'Hi');
            editorStore.undo();
            editorStore.redo();
            
            const redoneNodes = get({ subscribe: editorStore.subscribe });
            expect(redoneNodes[0].text).toBe('Hi');
        });

        /**
         * Tests that the redo stack is cleared when a new change is made
         * after an undo operation
         */
        it('clears redo stack on new change after undo', () => {
            editorStore.parseContent('Hello');
            const nodes = get({ subscribe: editorStore.subscribe });
            const nodeId = nodes[0].id;
            
            editorStore.updateNode(nodeId, 'Hi');
            editorStore.undo();
            editorStore.updateNode(nodeId, 'Hey');
            editorStore.redo(); // Should do nothing
            
            const finalNodes = get({ subscribe: editorStore.subscribe });
            expect(finalNodes[0].text).toBe('Hey');
        });
    });

    describe('paragraphs handling', () => {
        /**
         * Tests that nodes are correctly grouped into paragraphs
         * based on newline spacers
         */
        it('groups nodes into paragraphs correctly', () => {
            // First create text nodes
            editorStore.parseContent('Hello world test');
            const nodes = get({ subscribe: editorStore.subscribe });
            
            // Then manually insert newline spacers
            // Insert a newline spacer after "Hello"
            // Insert a newline spacer after "Hello"
            editorStore.insertNodeAfter(nodes[0].id, '', 'spacer');
            const nodesWithNewline = get({ subscribe: editorStore.subscribe });
            editorStore.updateNode(nodesWithNewline[1].id, '', undefined, { subtype: 'newline' }, 'spacer');
            
            const paragraphs = get(editorStore.paragraphs);
            expect(paragraphs).toHaveLength(2);
            expect(paragraphs[0].corrections[0].text).toBe('Hello');
            expect(paragraphs[1].corrections[0].text).toBe('world');
            expect(paragraphs[1].corrections[1].text).toBe('test');
        });

        /**
         * Tests that empty paragraphs are handled correctly
         */
        it('handles empty paragraphs', () => {
            // Create text nodes first
            editorStore.parseContent('Hello world');
            const nodes = get({ subscribe: editorStore.subscribe });
            
            // Then manually insert two consecutive newline spacers
            // Insert two consecutive newline spacers
            // Insert two consecutive newline spacers
            editorStore.insertNodeAfter(nodes[0].id, '', 'spacer');
            const nodesWithNewline = get({ subscribe: editorStore.subscribe });
            editorStore.updateNode(nodesWithNewline[1].id, '', undefined, { subtype: 'newline' }, 'spacer');
            editorStore.insertNodeAfter(nodesWithNewline[1].id, '', 'spacer');
            const nodesWithTwoNewlines = get({ subscribe: editorStore.subscribe });
            editorStore.updateNode(nodesWithTwoNewlines[2].id, '', undefined, { subtype: 'newline' }, 'spacer');
            
            const paragraphs = get(editorStore.paragraphs);
            expect(paragraphs).toHaveLength(3);
            expect(paragraphs[1].corrections).toHaveLength(1); // Just the newline spacer
            expect(paragraphs[1].corrections[0].type).toBe('spacer');
        });
    });

    describe('serialization integration', () => {
        /**
         * Tests that the store can properly serialize its content
         * for storage
         */
        it('serializes store content correctly', () => {
            editorStore.parseContent('Hello world');
            const serialized = editorStore.getSerializedContent();
            const parsed = JSON.parse(serialized);
            
            expect(parsed).toHaveLength(2); // Just text nodes
            expect(parsed[0].x).toBe('Hello');
            expect(parsed[1].x).toBe('world');
        });

        /**
         * Tests that the store can properly load serialized content
         */
        it('loads serialized content correctly', () => {
            const serialized = JSON.stringify([{
                i: 'test-id',
                t: 'normal',
                x: 'Hello'
            }]);
            
            editorStore.loadSerializedContent(serialized);
            const nodes = get({ subscribe: editorStore.subscribe });
            
            expect(nodes).toHaveLength(1);
            expect(nodes[0].text).toBe('Hello');
            expect(nodes[0].type).toBe('normal');
        });
    });
});
