# JSDoc Updates Plan

## editorCommands.svelte.ts

### Module Documentation

```typescript
/**
 * @module editorCommands
 * @description Centralized command pattern implementation for editor operations.
 * Provides a type-safe, extensible system for managing all editor interactions.
 * Each command is self-contained with its own validation, execution, and state management.
 */
```

### Command Schemas

```typescript
/**
 * Command schemas for editor operations.
 * Each schema defines the structure and type constraints for different command types.
 * All commands share common properties (id, shortcuts, description) but have different
 * execution and validation parameter types.
 */

/**
 * Schema for basic single-node commands.
 * Used for operations that affect one node at a time.
 * @example DELETE, UPDATE, INSERT_EMPTY
 */
export const basicCommandSchema = ...

/**
 * Schema for multi-node group commands.
 * Used for operations that affect multiple nodes simultaneously.
 * @example GROUP_DELETE, GROUP_UPDATE
 */
export const groupCommandSchema = ...

/**
 * Schema for correction commands.
 * Used for operations that modify node text and type.
 * Takes a tuple of [nodeId, correctionText].
 * @example CORRECTION
 */
export const correctionCommandSchema = ...

/**
 * Schema for group correction commands.
 * Used for operations that create corrections from multiple nodes.
 * Takes a tuple of [nodeIds[], correctionText].
 * @example GROUP_CORRECTION
 */
export const groupCorrectionCommandSchema = ...
```

### Command State Management

```typescript
/**
 * Command state store for tracking command execution.
 * Manages active commands and execution history.
 * Used for preventing command conflicts and enabling undo/redo.
 * @property {string | null} lastExecuted - ID of the last executed command
 * @property {Set<string>} activeCommands - Set of currently executing command IDs
 */
```

### Individual Commands

```typescript
/**
 * DELETE Command
 * Toggles deletion state of nodes, handling both single and group nodes.
 * For group nodes:
 * - If already deleted, restores original nodes
 * - If not deleted, marks as deletion
 * For single nodes:
 * - Toggles between normal and deletion state
 * @command DELETE
 * @param {string} nodeId - ID of the node to toggle
 * @shortcuts Alt + Click, Delete key
 */

/**
 * CORRECTION Command
 * Creates or reverts corrections on nodes.
 * For group nodes:
 * - Empty input: Unpacks group and restores original nodes
 * - With text: Creates group correction
 * For single nodes:
 * - Empty input: Reverts to normal node
 * - With text: Creates correction
 * @command CORRECTION
 * @param {[string, string]} args - [nodeId, correctionText]
 * @shortcuts Enter
 */
```

## editorStore.svelte.ts

### Store State Management

```typescript
/**
 * Core editor state management.
 * Handles all document content, selection, and editing operations.
 * Uses Svelte 5 runes ($state, $derived) for reactive state management.
 *
 * Key features:
 * - Document content management
 * - Node position caching
 * - Selection state tracking
 * - Undo/redo history
 *
 * @module editorStore
 */
```

### Node Operations

```typescript
/**
 * Updates a node's properties atomically.
 * Handles type transitions and maintains undo history.
 * Special cases:
 * - Deletion toggle: Handles reversion to normal
 * - Empty nodes: Can only become additions
 * - Addition nodes: Type is preserved
 *
 * @param {string} nodeId - Node to update
 * @param {string} text - New text content
 * @param {CorrectionData} [correctionData] - Optional correction info
 * @param {{ subtype: SpacerSubtype }} [spacerData] - Optional spacer info
 * @param {NodeType} [type='normal'] - Target node type
 */

/**
 * Performs batch update of multiple nodes.
 * Updates all nodes in a single atomic operation.
 * Recalculates positions and triggers single rerender.
 * Used for group operations like unpacking nodes.
 *
 * @param {Node[]} nodes - Nodes to update
 */
```

### Selection System

```typescript
/**
 * Manages drag selection state.
 * Tracks selection bounds and validation.
 * Updates in real-time during drag operations.
 * Syncs with group selection system.
 *
 * @property {boolean} isDragging - Active drag operation
 * @property {boolean} isSelected - Selection complete
 * @property {string?} startNodeId - First selected node
 * @property {string?} endNodeId - Last selected node
 * @property {number} generation - Selection version
 */

/**
 * Manages group selection state.
 * Maintains set of selected node IDs.
 * Validates selection against cache version.
 * Used for group operations.
 *
 * @property {Set<string>} selectedNodeIds - Selected nodes
 * @property {boolean} isGroupMode - Group selection active
 * @property {number} generation - Selection version
 */
```
