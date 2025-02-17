# Command Documentation Updates

## Command State Documentation

```typescript
/**
 * Command state store for tracking command execution.
 * Manages active commands and execution history.
 * Used for preventing command conflicts and enabling undo/redo.
 *
 * @property {string | null} lastExecuted - ID of the last executed command
 * @property {Set<string>} activeCommands - Set of currently executing command IDs
 */

/**
 * Command store interface for managing command execution state.
 * Provides methods for tracking and controlling command execution.
 * Ensures proper command lifecycle management and state tracking.
 */
```

## Individual Command Documentation

### DELETE Command

```typescript
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
```

### CORRECTION Command

```typescript
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
```

### GROUP_CORRECTION Command

```typescript
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
```

### UNPACK_GROUP Command

```typescript
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
```

### GROUP_DELETE Command

```typescript
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
```
