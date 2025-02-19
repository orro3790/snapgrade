/**
 * @fileoverview Centralized command pattern implementation for editor operations.
 * Provides a type-safe, extensible system for managing all editor interactions.
 * Each command is self-contained with its own validation, execution, and state management.
 *
 * Key features:
 * - Type-safe command definitions using Zod schemas
 * - Command state tracking and validation
 * - Atomic operations with proper undo/redo support
 * - Group operation handling with node preservation
 *
 * @module editorCommands
 */
import { editorStore } from '$lib/stores/editorStore.svelte';
import { z } from 'zod';
/**
 * Command schemas define the structure and type constraints for different command types.
 * All commands share common properties (id, shortcuts, description) but have different
 * execution and validation parameter types.
 *
 * Four main command types:
 * 1. Basic commands - Single node operations (e.g., DELETE, UPDATE)
 * 2. Group commands - Multi-node operations (e.g., GROUP_DELETE)
 * 3. Correction commands - Text modification operations
 * 4. Group correction commands - Multi-node text modifications
 */
/**
 * Schema for basic single-node commands.
 * Used for operations that affect one node at a time.
 *
 * @example
 * // DELETE command
 * {
 *   id: 'delete',
 *   execute: (nodeId: string) => void,
 *   canExecute: (nodeId: string) => boolean,
 *   shortcuts: ['Alt + Click', 'Delete'],
 *   description: 'Mark node for deletion'
 * }
 */
/**
 * Schema for basic single-node commands.
 * Defines operations that work on individual nodes.
 *
 * @property {string} id - Unique command identifier
 * @property {function} execute - Single node operation function
 * @property {function} canExecute - Validation function
 * @property {string[]} shortcuts - Available keyboard/mouse shortcuts
 * @property {string} description - Human-readable command description
 */
export const basicCommandSchema = z.object({
    id: z.string(),
    execute: z.function()
        .args(z.string())
        .returns(z.void()),
    canExecute: z.function()
        .args(z.string())
        .returns(z.discriminatedUnion('allowed', [
        z.object({ allowed: z.literal(true) }),
        z.object({ allowed: z.literal(false), reason: z.string() })
    ])),
    shortcuts: z.array(z.string()),
    description: z.string()
});
/**
 * Schema for multi-node group commands.
 * Defines operations that work on multiple nodes simultaneously.
 *
 * @property {string} id - Unique command identifier
 * @property {function} execute - Multi-node operation function
 * @property {function} canExecute - Group validation function
 * @property {string[]} shortcuts - Available keyboard/mouse shortcuts
 * @property {string} description - Human-readable command description
 */
export const groupCommandSchema = z.object({
    id: z.string(),
    execute: z.function()
        .args(z.array(z.string()))
        .returns(z.void()),
    canExecute: z.function()
        .args(z.array(z.string()))
        .returns(z.discriminatedUnion('allowed', [
        z.object({ allowed: z.literal(true) }),
        z.object({ allowed: z.literal(false), reason: z.string() })
    ])),
    shortcuts: z.array(z.string()),
    description: z.string()
});
/**
 * Schema for correction commands.
 * Defines operations that modify node text and type.
 * Takes a tuple of [nodeId, correctionText].
 *
 * @property {string} id - Unique command identifier
 * @property {function} execute - Correction operation function
 * @property {function} canExecute - Node validation function
 * @property {string[]} shortcuts - Available keyboard/mouse shortcuts
 * @property {string} description - Human-readable command description
 */
export const correctionCommandSchema = z.object({
    id: z.string(),
    execute: z.function()
        .args(z.tuple([z.string(), z.string()]))
        .returns(z.void()),
    canExecute: z.function()
        .args(z.string())
        .returns(z.discriminatedUnion('allowed', [
        z.object({ allowed: z.literal(true) }),
        z.object({ allowed: z.literal(false), reason: z.string() })
    ])),
    shortcuts: z.array(z.string()),
    description: z.string()
});
/**
 * Schema for group correction commands.
 * Defines operations that create corrections from multiple nodes.
 * Takes a tuple of [nodeIds[], correctionText].
 *
 * @property {string} id - Unique command identifier
 * @property {function} execute - Group correction operation function
 * @property {function} canExecute - Group validation function
 * @property {string[]} shortcuts - Available keyboard/mouse shortcuts
 * @property {string} description - Human-readable command description
 */
export const groupCorrectionCommandSchema = z.object({
    id: z.string(),
    execute: z.function()
        .args(z.tuple([z.array(z.string()), z.string()]))
        .returns(z.void()),
    canExecute: z.function()
        .args(z.array(z.string()))
        .returns(z.discriminatedUnion('allowed', [
        z.object({ allowed: z.literal(true) }),
        z.object({ allowed: z.literal(false), reason: z.string() })
    ])),
    shortcuts: z.array(z.string()),
    description: z.string()
});
export const commandSchema = z.union([
    basicCommandSchema,
    groupCommandSchema,
    correctionCommandSchema,
    groupCorrectionCommandSchema
]);
/**
 * Command state store for tracking command execution.
 * Manages active commands and execution history.
 * Used for preventing command conflicts and enabling undo/redo.
 *
 * @property {string | null} lastExecuted - ID of the last executed command
 * @property {Set<string>} activeCommands - Set of currently executing command IDs
 */
const commandState = $state({
    lastExecuted: null,
    activeCommands: new Set()
});
/**
 * Command store interface for managing command execution state.
 * Provides methods for tracking and controlling command execution.
 * Ensures proper command lifecycle management and state tracking.
 */
const commandStore = {
    /**
     * Get the current command state.
     * Returns the full state object for external use.
     * Used for command state inspection and debugging.
     *
     * @returns {typeof commandState} Current command state
     */
    get state() {
        return commandState;
    },
    /**
     * Check if a command is currently active.
     * Used to prevent conflicting command execution.
     * Helps maintain command execution integrity.
     *
     * @param {string} commandId - ID of the command to check
     * @returns {boolean} True if command is active
     */
    isActive: (commandId) => commandState.activeCommands.has(commandId),
    /**
     * Get the ID of the last executed command.
     * Used for command history and undo/redo operations.
     * Helps track command execution sequence.
     *
     * @returns {string | null} ID of last executed command
     */
    getLastExecuted: () => commandState.lastExecuted,
    /**
     * Start execution of a command.
     * Marks command as active and updates execution history.
     * Must be paired with endCommand to maintain state integrity.
     *
     * @param {string} commandId - ID of the command being executed
     */
    startCommand: (commandId) => {
        commandState.lastExecuted = commandId;
        commandState.activeCommands.add(commandId);
    },
    /**
     * End execution of a command.
     * Removes command from active set.
     * Should be called even if command execution fails.
     * Ensures proper cleanup of command state.
     *
     * @param {string} commandId - ID of the command being executed
     */
    endCommand: (commandId) => {
        commandState.activeCommands.delete(commandId);
    }
};
/**
 * Get the current state of a command
 * @param commandId The ID of the command to check
 * @returns Object containing command state information
 */
export function getCommandState(commandId) {
    return {
        isActive: commandState.activeCommands.has(commandId),
        lastExecuted: commandState.lastExecuted === commandId
    };
}
/**
 * Centralized editor commands
 * Each command includes:
 * - Unique identifier
 * - Execute function
 * - Validation function
 * - Keyboard/mouse shortcuts
 * - Description
 */
export const EditorCommands = {
    /**
     * DELETE Command
     * Toggles deletion state of nodes, handling both single and group nodes.
     *
     * Behavior:
     * 1. For group nodes:
     *    - If already deleted: Restores original nodes to their positions
     *    - If not deleted: Marks as deletion
     * 2. For single nodes:
     *    - Toggles between normal and deletion state
     *
     * @command DELETE
     * @param {string} nodeId - ID of the node to toggle
     * @shortcuts Alt + Click, Delete key
     */
    DELETE: {
        id: 'delete',
        execute: (nodeId) => {
            if (!EditorCommands.DELETE.canExecute(nodeId))
                return;
            commandStore.startCommand('delete');
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                commandStore.endCommand('delete');
                return;
            }
            // Prevent deletion of user-created nodes
            if (node.type === 'addition' || node.type === 'empty' || node.type === 'spacer') {
                commandStore.endCommand('delete');
                return;
            }
            if (node.metadata.groupedNodes?.length) {
                if (node.type === 'deletion') {
                    // If it's already a deletion node, restore the original nodes
                    const groupPosition = node.metadata.position;
                    const restoredNodes = editorStore.unpackGroupNode(node);
                    // Remove the group node and insert restored nodes
                    const newNodes = editorStore.nodes.filter(n => n.id !== nodeId);
                    const insertIndex = newNodes.findIndex(n => n.metadata.position > groupPosition);
                    if (insertIndex === -1) {
                        newNodes.push(...restoredNodes);
                    }
                    else {
                        newNodes.splice(insertIndex, 0, ...restoredNodes);
                    }
                    // Use batch update for atomic operation
                    editorStore.batchUpdateNodes(newNodes);
                }
                else if (node.type === 'correction') {
                    // Convert correction to deletion while preserving original text
                    editorStore.updateNode(nodeId, node.text, undefined, // Clear correction data
                    undefined, 'deletion');
                }
                else {
                    // Toggle deletion for normal nodes
                    editorStore.toggleDeletion(nodeId);
                }
            }
            else {
                if (node.type === 'correction') {
                    // Convert correction to deletion while preserving original text
                    editorStore.updateNode(nodeId, node.text, undefined, // Clear correction data
                    undefined, 'deletion');
                }
                else {
                    // Handle single node deletion
                    editorStore.toggleDeletion(nodeId);
                }
            }
            commandStore.endCommand('delete');
        },
        canExecute: (nodeId) => {
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                return { allowed: false, reason: 'Node not found' };
            }
            if (['addition', 'empty', 'spacer'].includes(node.type)) {
                return { allowed: false, reason: 'Cannot delete user-created nodes' };
            }
            return { allowed: true };
        },
        shortcuts: ['Alt + Click', 'Delete'],
        description: 'Mark node for deletion'
    },
    /**
     * UNPACK_GROUP Command
     * Restores original nodes from a group node.
     * Used by both deletion and correction operations.
     *
     * Behavior:
     * - Extracts original nodes from metadata
     * - Removes group node
     * - Inserts restored nodes at correct positions
     * - Updates all node positions
     *
     * @command UNPACK_GROUP
     * @param {string} nodeId - ID of the group node to unpack
     * @shortcuts Alt + Click on group
     */
    UNPACK_GROUP: {
        id: 'unpack-group',
        execute: (nodeId) => {
            if (!EditorCommands.UNPACK_GROUP.canExecute(nodeId))
                return;
            commandStore.startCommand('unpack-group');
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node?.metadata.groupedNodes) {
                commandStore.endCommand('unpack-group');
                return;
            }
            const restoredNodes = editorStore.unpackGroupNode(node);
            const newNodes = editorStore.nodes.filter(n => n.id !== nodeId);
            const insertIndex = newNodes.findIndex(n => n.metadata.position > node.metadata.position);
            if (insertIndex === -1) {
                newNodes.push(...restoredNodes);
            }
            else {
                newNodes.splice(insertIndex, 0, ...restoredNodes);
            }
            // Update nodes through store method
            const positions = newNodes.map((node, index) => ({
                ...node,
                metadata: { ...node.metadata, position: index }
            }));
            positions.forEach(node => {
                editorStore.updateNode(node.id, node.text, node.correctionData, node.spacerData, node.type);
            });
            commandStore.endCommand('unpack-group');
        },
        canExecute: (nodeId) => {
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                return { allowed: false, reason: 'Node not found' };
            }
            if (!node.metadata.groupedNodes) {
                return { allowed: false, reason: 'Node is not a group node' };
            }
            return { allowed: true };
        },
        shortcuts: ['Alt + Click on group'],
        description: 'Unpack grouped nodes'
    },
    REMOVE: {
        id: 'remove',
        execute: (nodeId) => {
            if (!EditorCommands.REMOVE.canExecute(nodeId))
                return;
            commandStore.startCommand('remove');
            editorStore.removeNode(nodeId);
            commandStore.endCommand('remove');
        },
        canExecute: (nodeId) => {
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                return { allowed: false, reason: 'Node not found' };
            }
            return { allowed: true };
        },
        shortcuts: ['Ctrl + Right Click'],
        description: 'Remove node from editor'
    },
    GROUP_REMOVE: {
        id: 'group-remove',
        execute: (nodeIds) => {
            if (!EditorCommands.GROUP_REMOVE.canExecute(nodeIds))
                return;
            commandStore.startCommand('group-remove');
            editorStore.removeNodes(nodeIds);
            commandStore.endCommand('group-remove');
        },
        canExecute: (nodeIds) => {
            if (nodeIds.length === 0) {
                return { allowed: false, reason: 'No nodes selected' };
            }
            const nodes = nodeIds.map(id => editorStore.nodes.find(n => n.id === id)).filter(Boolean);
            const anyAddition = nodes.some(node => node?.type === 'addition');
            if (anyAddition) {
                return { allowed: false, reason: 'Cannot perform group operations on addition nodes' };
            }
            return { allowed: true };
        },
        shortcuts: ['Ctrl + Right Click on selection'],
        description: 'Remove multiple nodes from editor'
    },
    UPDATE: {
        id: 'update',
        execute: ([nodeId, text]) => {
            if (!EditorCommands.UPDATE.canExecute(nodeId))
                return;
            commandStore.startCommand('update');
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                commandStore.endCommand('update');
                return;
            }
            if (node.type === 'empty' && text) {
                // Convert empty node to addition node when it receives text
                editorStore.updateNode(nodeId, text, undefined, undefined, 'addition');
            }
            else if (node.type === 'addition') {
                // Maintain addition type when updating addition nodes
                editorStore.updateNode(nodeId, text, undefined, undefined, 'addition');
            }
            else {
                editorStore.updateNode(nodeId, text);
            }
            commandStore.endCommand('update');
        },
        canExecute: (nodeId) => {
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                return { allowed: false, reason: 'Node not found' };
            }
            return { allowed: true };
        },
        shortcuts: ['` (backtick)'],
        description: 'Update node text'
    },
    GROUP_UPDATE: {
        id: 'group-update',
        execute: (nodeIds) => {
            if (!EditorCommands.GROUP_UPDATE.canExecute(nodeIds))
                return;
            commandStore.startCommand('group-update');
            nodeIds.forEach(id => {
                const node = editorStore.nodes.find(n => n.id === id);
                if (node) {
                    if (node.type === 'empty' && node.text) {
                        editorStore.updateNode(id, node.text, undefined, undefined, 'addition');
                    }
                    else if (node.type === 'addition') {
                        editorStore.updateNode(id, node.text, undefined, undefined, 'addition');
                    }
                    else {
                        editorStore.updateNode(id, node.text);
                    }
                }
            });
            commandStore.endCommand('group-update');
        },
        canExecute: (nodeIds) => {
            if (nodeIds.length === 0) {
                return { allowed: false, reason: 'No nodes selected' };
            }
            const nodes = nodeIds.map(id => editorStore.nodes.find(n => n.id === id)).filter(Boolean);
            const anyAddition = nodes.some(node => node?.type === 'addition');
            if (anyAddition) {
                return { allowed: false, reason: 'Cannot perform group operations on addition nodes' };
            }
            return { allowed: true };
        },
        shortcuts: ['` (backtick) on selection'],
        description: 'Update multiple nodes text'
    },
    INSERT_EMPTY: {
        id: 'insert-empty',
        execute: (nodeId) => {
            if (!EditorCommands.INSERT_EMPTY.canExecute(nodeId))
                return;
            commandStore.startCommand('insert-empty');
            editorStore.insertNodeAfter(nodeId, '', 'empty');
            commandStore.endCommand('insert-empty');
        },
        canExecute: (nodeId) => {
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                return { allowed: false, reason: 'Node not found' };
            }
            return { allowed: true };
        },
        shortcuts: ['Ctrl + Click'],
        description: 'Insert empty node after current node'
    },
    /**
     * CORRECTION Command
     * Creates or reverts corrections on nodes.
     * Handles both single nodes and group nodes differently.
     *
     * Behavior:
     * 1. For group nodes:
     *    - Empty input: Unpacks group and restores original nodes
     *    - With text: Creates group correction
     * 2. For single nodes:
     *    - Empty input: Reverts to normal node
     *    - With text: Creates correction
     *
     * Implementation details:
     * - Uses batch updates for atomic operations
     * - Preserves node positions during unpacking
     * - Maintains undo/redo history
     *
     * @command CORRECTION
     * @param {[string, string]} args - [nodeId, correctionText]
     * @shortcuts Enter
     */
    CORRECTION: {
        id: 'correction',
        execute: ([nodeId, correctedText]) => {
            if (!EditorCommands.CORRECTION.canExecute(nodeId))
                return;
            commandStore.startCommand('correction');
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                commandStore.endCommand('correction');
                return;
            }
            const trimmedCorrection = correctedText.trim();
            if (node.metadata.groupedNodes?.length) {
                // Handle group node
                if (!trimmedCorrection && node.type === 'correction') {
                    // Unpack group node back to original nodes
                    const groupPosition = node.metadata.position;
                    const restoredNodes = editorStore.unpackGroupNode(node);
                    // Remove the group node and insert restored nodes
                    const newNodes = editorStore.nodes.filter(n => n.id !== nodeId);
                    const insertIndex = newNodes.findIndex(n => n.metadata.position > groupPosition);
                    if (insertIndex === -1) {
                        newNodes.push(...restoredNodes);
                    }
                    else {
                        newNodes.splice(insertIndex, 0, ...restoredNodes);
                    }
                    // Use batch update for atomic operation
                    editorStore.batchUpdateNodes(newNodes);
                }
                else if (trimmedCorrection) {
                    // Apply correction to group node
                    editorStore.updateNode(nodeId, node.text, {
                        correctedText: trimmedCorrection,
                        pattern: '',
                        explanation: ''
                    }, undefined, 'correction');
                }
            }
            else {
                // Handle single node
                if (!trimmedCorrection && node.type === 'correction') {
                    editorStore.updateNode(nodeId, node.text, undefined, undefined, 'normal');
                }
                else if (trimmedCorrection) {
                    editorStore.updateNode(nodeId, node.text, {
                        correctedText: trimmedCorrection,
                        pattern: '',
                        explanation: ''
                    }, undefined, 'correction');
                }
            }
            commandStore.endCommand('correction');
        },
        canExecute: (nodeId) => {
            const node = editorStore.nodes.find(n => n.id === nodeId);
            if (!node) {
                return { allowed: false, reason: 'Node not found' };
            }
            if (node.type === 'empty' || node.type === 'spacer') {
                return { allowed: false, reason: 'Cannot correct empty or spacer nodes' };
            }
            return { allowed: true };
        },
        shortcuts: ['Enter'],
        description: 'Convert node to correction'
    },
    /**
     * GROUP_CORRECTION Command
     * Creates corrections from multiple selected nodes.
     * Combines nodes into a single correction while preserving originals.
     *
     * Behavior:
     * - Combines text of selected nodes with spaces
     * - Stores original nodes in metadata for restoration
     * - Creates single correction node at group's position
     * - Updates positions of subsequent nodes
     *
     * @command GROUP_CORRECTION
     * @param {[string[], string]} args - [nodeIds, correctionText]
     * @shortcuts Enter on selection
     */
    GROUP_CORRECTION: {
        id: 'group-correction',
        execute: ([nodeIds, correctedText]) => {
            if (!EditorCommands.GROUP_CORRECTION.canExecute(nodeIds))
                return;
            commandStore.startCommand('group-correction');
            editorStore.createMultiNodeCorrection(nodeIds, correctedText, '', '');
            commandStore.endCommand('group-correction');
        },
        canExecute: (nodeIds) => {
            if (nodeIds.length === 0) {
                return { allowed: false, reason: 'No nodes selected' };
            }
            const nodes = nodeIds.map(id => editorStore.nodes.find(n => n.id === id)).filter(Boolean);
            const anyAddition = nodes.some(node => node?.type === 'addition');
            const anyNotAllowed = nodes.some(node => node?.type === 'empty' || node?.type === 'spacer');
            if (anyAddition) {
                return { allowed: false, reason: 'Cannot perform group operations on addition nodes' };
            }
            if (anyNotAllowed) {
                return { allowed: false, reason: 'Cannot perform group operations on empty or spacer nodes' };
            }
            return { allowed: true };
        },
        shortcuts: ['Enter on selection'],
        description: 'Convert multiple nodes to correction'
    },
    /**
     * GROUP_DELETE Command
     * Toggles deletion state for multiple nodes.
     * Creates a single deletion node from selection.
     *
     * Behavior:
     * - If nodes not grouped: Creates deletion group
     * - If already deletion: Restores original nodes
     * - Maintains node positions and relationships
     *
     * @command GROUP_DELETE
     * @param {string[]} nodeIds - IDs of nodes to toggle
     * @shortcuts Alt + Click on selection
     */
    GROUP_DELETE: {
        id: 'group-delete',
        execute: (nodeIds) => {
            if (!EditorCommands.GROUP_DELETE.canExecute(nodeIds))
                return;
            commandStore.startCommand('group-delete');
            editorStore.toggleMultiNodeDeletion(nodeIds);
            commandStore.endCommand('group-delete');
        },
        canExecute: (nodeIds) => {
            if (nodeIds.length === 0) {
                return { allowed: false, reason: 'No nodes selected' };
            }
            const nodes = nodeIds.map(id => editorStore.nodes.find(n => n.id === id)).filter(Boolean);
            const anyAddition = nodes.some(node => node?.type === 'addition');
            const anyNotAllowed = nodes.some(node => ['addition', 'empty', 'spacer'].includes(node?.type || ''));
            if (anyAddition) {
                return { allowed: false, reason: 'Cannot perform group operations on addition nodes' };
            }
            if (anyNotAllowed) {
                return { allowed: false, reason: 'Cannot perform group operations on empty or spacer nodes' };
            }
            return { allowed: true };
        },
        shortcuts: ['Alt + Click on selection'],
        description: 'Mark multiple nodes for deletion'
    }
};
/**
 * Export command store functions for external use
 */
export const commandUtils = {
    getState: getCommandState,
    isActive: commandStore.isActive,
    getLastExecuted: commandStore.getLastExecuted
};
