# Revised FormattingModal.svelte Refactoring Plan

## Overview

This document outlines a revised plan to refactor the `FormattingModal.svelte` component based on feedback about the initial proposal. The refactoring will address several key requirements:

1. Fix the "Make paragraph" button functionality
2. Fix the "Add indent" button functionality
3. Add a title toggle button
4. Implement list functionality
5. Implement header button functionality
6. Add text alignment options

## Current Implementation Analysis

### Text Node Architecture

The current implementation uses a flexbox-based layout where:

- Text nodes are rendered in a flex container that wraps
- Spacer nodes control layout with two subtypes:
  - `paragraphBreak`: Full-width spacers that force line breaks
  - `paragraphIndent`: Fixed-width spacers for indentation
- Nodes have structural roles (title, subtitle, heading, paragraph)
- The editor uses a node-based approach rather than traditional contenteditable

### Current Limitations

1. **Paragraph Button**: Currently adds spacer AFTER the selected node, but should add BEFORE
2. **Indent Button**: Similar issue with insertion position
3. **Title Handling**: No dedicated button for toggling title status
4. **List Functionality**: Basic implementation without proper grouping or indentation
5. **Header Functionality**: Not fully implemented
6. **Alignment Options**: Not implemented at all

## Revised Implementation Plan

### 1. Fix "Make Paragraph" Button

The current implementation adds a paragraph spacer node AFTER the selected node. We need to modify it to add spacers BEFORE the selected node.

#### Current Code:
```javascript
function handleMakeParagraph() {
  // Add newline before paragraph
  const newlineId = crypto.randomUUID();
  editorStore.insertNodeAfter(node.id, '', 'spacer');
  
  // Find the newly created spacer node
  const spacerNode = editorStore.nodes.find(
    (n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
  );
  
  if (spacerNode) {
    // Update it with newline subtype
    editorStore.updateNode(
      spacerNode.id,
      '',
      undefined,
      { subtype: 'newline' },
      'spacer'
    );
    
    // Update the node with paragraph role
    editorStore.updateNode(
      node.id,
      node.text,
      undefined,
      undefined,
      'normal',
      'paragraphStart'
    );
  }
}
```

#### Revised Solution:

We'll modify the function to insert spacers BEFORE the selected node by finding the previous node and inserting after it, or handling the case where the selected node is the first node.

```javascript
function handleMakeParagraph() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Find the node before the current node
  const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === node.id);
  
  if (currentNodeIndex > 0) {
    // There is a node before this one, insert after that node
    const previousNode = editorStore.nodes[currentNodeIndex - 1];
    
    // Add paragraph break spacer (forces line break)
    editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
    
    // Find the newly created spacer node
    const breakSpacerNode = editorStore.nodes.find(
      (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < node.metadata.position
    );
    
    if (breakSpacerNode) {
      // Update it with paragraph break subtype
      editorStore.updateNode(
        breakSpacerNode.id,
        '',
        undefined,
        { subtype: 'paragraphBreak' },
        'spacer'
      );
      
      // Add indent spacer after the paragraph break
      editorStore.insertNodeAfter(breakSpacerNode.id, '', 'spacer');
      
      // Find the newly created indent spacer
      const indentSpacerNode = editorStore.nodes.find(
        (n) => n.type === 'spacer' && n.metadata.position > breakSpacerNode.metadata.position && n.metadata.position < node.metadata.position
      );
      
      if (indentSpacerNode) {
        // Update it with indent subtype
        editorStore.updateNode(
          indentSpacerNode.id,
          '',
          undefined,
          { subtype: 'paragraphIndent' },
          'spacer'
        );
      }
    }
  } else {
    // This is the first node, we need to insert at the beginning
    // Save current state for undo
    editorStore.undoStack = [...editorStore.undoStack, editorStore.nodes];
    editorStore.redoStack = [];
    
    // Create paragraph break spacer
    const breakSpacerId = crypto.randomUUID();
    const breakSpacerNode = {
      id: breakSpacerId,
      text: '',
      type: 'spacer' as const,
      spacerData: { subtype: 'paragraphBreak' as const },
      metadata: {
        position: 0,
        isPunctuation: false,
        isWhitespace: true,
        startIndex: 0,
        endIndex: 0,
      }
    };
    
    // Create indent spacer
    const indentSpacerId = crypto.randomUUID();
    const indentSpacerNode = {
      id: indentSpacerId,
      text: '',
      type: 'spacer' as const,
      spacerData: { subtype: 'paragraphIndent' as const },
      metadata: {
        position: 1,
        isPunctuation: false,
        isWhitespace: true,
        startIndex: 0,
        endIndex: 0,
      }
    };
    
    // Insert both spacers at the beginning
    const newNodes = [breakSpacerNode, indentSpacerNode, ...editorStore.nodes];
    
    // Update positions for all nodes
    const updatedNodes = newNodes.map((n, index) => ({
      ...n,
      metadata: { ...n.metadata, position: index }
    }));
    
    // Update the store
    editorStore.batchUpdateNodes(updatedNodes);
  }
  
  // Update the node with paragraph role
  editorStore.updateNode(
    node.id,
    node.text,
    undefined,
    undefined,
    'normal',
    'paragraph'
  );
  
  onClose();
  isProcessingEdit = false;
}
```

### 2. Fix "Add Indent" Button

Similar to the paragraph button, we need to modify the indent button to add the indent spacer BEFORE the selected node.

#### Current Code:
```javascript
function handleAddIndent() {
  // Add indent spacer before node
  const indentId = crypto.randomUUID();
  editorStore.insertNodeAfter(node.id, '', 'spacer');
  
  // Find the newly created spacer node
  const spacerNode = editorStore.nodes.find(
    (n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
  );
  
  if (spacerNode) {
    // Update it with indent subtype
    editorStore.updateNode(
      spacerNode.id,
      '',
      undefined,
      { subtype: 'indent' },
      'spacer'
    );
  }
}
```

#### Revised Solution:

```javascript
function handleAddIndent() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Find the node before the current node
  const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === node.id);
  
  if (currentNodeIndex > 0) {
    // There is a node before this one, insert after that node
    const previousNode = editorStore.nodes[currentNodeIndex - 1];
    
    // Add indent spacer
    editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
    
    // Find the newly created spacer node
    const spacerNode = editorStore.nodes.find(
      (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < node.metadata.position
    );
    
    if (spacerNode) {
      // Update it with indent subtype
      editorStore.updateNode(
        spacerNode.id,
        '',
        undefined,
        { subtype: 'paragraphIndent' },
        'spacer'
      );
    }
  } else {
    // This is the first node, we need to insert at the beginning
    // Save current state for undo
    editorStore.undoStack = [...editorStore.undoStack, editorStore.nodes];
    editorStore.redoStack = [];
    
    // Create indent spacer
    const indentSpacerId = crypto.randomUUID();
    const indentSpacerNode = {
      id: indentSpacerId,
      text: '',
      type: 'spacer' as const,
      spacerData: { subtype: 'paragraphIndent' as const },
      metadata: {
        position: 0,
        isPunctuation: false,
        isWhitespace: true,
        startIndex: 0,
        endIndex: 0,
      }
    };
    
    // Insert spacer at the beginning
    const newNodes = [indentSpacerNode, ...editorStore.nodes];
    
    // Update positions for all nodes
    const updatedNodes = newNodes.map((n, index) => ({
      ...n,
      metadata: { ...n.metadata, position: index }
    }));
    
    // Update the store
    editorStore.batchUpdateNodes(updatedNodes);
  }
  
  onClose();
  isProcessingEdit = false;
}
```

### 3. Add Title Toggle Button

We need to add a new button that allows users to tag nodes as title/not title for proper formatting.

#### Proposed Solution:

1. Add a new icon component for the title button
2. Add the button to the FormattingModal
3. Implement the toggle functionality

First, create a new icon component at `src/lib/icons/Title.svelte`:

```svelte
<script lang="ts">
  export let size = 24;
  export let stroke = 'currentColor';
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 4v16"></path>
  <path d="M18 4v16"></path>
  <path d="M6 12h12"></path>
</svg>
```

Then, add the title toggle button to FormattingModal.svelte:

```javascript
// Import the new icon
import Title from '$lib/icons/Title.svelte';

// Add the title toggle function
function handleToggleTitle() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Check if the node already has a title role
  const isTitle = node.structuralRole === 'title';
  
  // Toggle the title role
  editorStore.updateNode(
    node.id,
    node.text,
    undefined,
    undefined,
    'normal',
    isTitle ? undefined : 'title'
  );
  
  onClose();
  isProcessingEdit = false;
}
```

Add the button to the UI:

```svelte
<button
  onclick={handleToggleTitle}
  type="button"
  title={node.structuralRole === 'title' ? "Remove title" : "Make title"}
>
  <span class="button-icon">
    <Title />
  </span>
</button>
```

### 4. Implement List Functionality

The list functionality is complex and requires careful consideration. After analyzing the options and considering the feedback about maintaining individual node editability, I propose a solution that:

1. Uses a combination of spacer nodes and structural roles
2. Adds a bullet point character as a separate node
3. Uses CSS classes to maintain proper indentation for wrapped lines

#### Revised Solution:

First, we need to modify the TextNode.svelte component to add a CSS class for list items:

```svelte
<!-- In TextNode.svelte -->
<script>
  // Add list item class to derived class list
  let classList = $derived(
    [
      'text-node',
      node.type,
      isActive ? 'active' : '',
      node.hasNextCorrection ? 'has-next-correction' : '',
      isEditing ? 'highlighted' : '',
      node.metadata.isPunctuation ? 'punctuation' : '',
      $hoveredNodeTypeStore === node.type ? `highlight-${node.type}` : '',
      isGroupSelected ? 'group-selected' : '',
      node.structuralRole === 'listItem' ? 'list-item-node' : ''
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

<style>
  /* Add list item styles */
  .list-item-node {
    margin-left: 0; /* Remove default margin */
  }
  
  /* This ensures that when a list item wraps to a new line, 
     the text aligns with the text above, not with the bullet point */
  .content-wrapper .list-item-node {
    padding-left: 0.5em;
  }
  
  /* Create a container for list items that maintains indentation on wrap */
  .list-item-container {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    padding-left: 2em; /* Indentation for the entire list item */
  }
  
  /* Style for the bullet point node */
  .bullet-point {
    margin-right: 0.5em;
  }
</style>
```

Then, implement the list functionality in FormattingModal.svelte:

```javascript
function handleMakeList() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Check if we're dealing with a group selection or single node
  const isGroupSelection = editorStore.isNodeInGroupSelection(node.id);
  const nodesToProcess = isGroupSelection 
    ? editorStore.nodes.filter(n => editorStore.isNodeInGroupSelection(n.id))
    : [node];
  
  // Process each node
  nodesToProcess.forEach((currentNode, index) => {
    // Find the node before the current node
    const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === currentNode.id);
    
    // If this is not the first node in the list, add a paragraph break
    if (index > 0) {
      // Add paragraph break before this list item
      const previousNode = nodesToProcess[index - 1];
      editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
      
      // Find the newly created spacer node
      const breakSpacerNode = editorStore.nodes.find(
        (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < currentNode.metadata.position
      );
      
      if (breakSpacerNode) {
        // Update it with paragraph break subtype
        editorStore.updateNode(
          breakSpacerNode.id,
          '',
          undefined,
          { subtype: 'paragraphBreak' },
          'spacer'
        );
      }
    }
    
    // Add indent spacer before the node
    if (currentNodeIndex > 0) {
      // There is a node before this one, insert after that node
      const previousNode = editorStore.nodes[currentNodeIndex - 1];
      
      // Add indent spacer
      editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
      
      // Find the newly created spacer node
      const indentSpacerNode = editorStore.nodes.find(
        (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < currentNode.metadata.position
      );
      
      if (indentSpacerNode) {
        // Update it with indent subtype
        editorStore.updateNode(
          indentSpacerNode.id,
          '',
          undefined,
          { subtype: 'paragraphIndent' },
          'spacer'
        );
      }
      
      // Add bullet point as a separate node
      editorStore.insertNodeAfter(indentSpacerNode ? indentSpacerNode.id : previousNode.id, '• ', 'normal');
    } else {
      // This is the first node, we need to insert at the beginning
      // Save current state for undo
      editorStore.undoStack = [...editorStore.undoStack, editorStore.nodes];
      editorStore.redoStack = [];
      
      // Create indent spacer
      const indentSpacerId = crypto.randomUUID();
      const indentSpacerNode = {
        id: indentSpacerId,
        text: '',
        type: 'spacer' as const,
        spacerData: { subtype: 'paragraphIndent' as const },
        metadata: {
          position: 0,
          isPunctuation: false,
          isWhitespace: true,
          startIndex: 0,
          endIndex: 0,
        }
      };
      
      // Create bullet point node
      const bulletPointId = crypto.randomUUID();
      const bulletPointNode = {
        id: bulletPointId,
        text: '• ',
        type: 'normal' as const,
        metadata: {
          position: 1,
          isPunctuation: false,
          isWhitespace: false,
          startIndex: 0,
          endIndex: 0,
        }
      };
      
      // Insert both nodes at the beginning
      const newNodes = [indentSpacerNode, bulletPointNode, ...editorStore.nodes];
      
      // Update positions for all nodes
      const updatedNodes = newNodes.map((n, index) => ({
        ...n,
        metadata: { ...n.metadata, position: index }
      }));
      
      // Update the store
      editorStore.batchUpdateNodes(updatedNodes);
    }
    
    // Update the node with list item role
    editorStore.updateNode(
      currentNode.id,
      currentNode.text,
      undefined,
      undefined,
      'normal',
      'listItem'
    );
  });
  
  onClose();
  isProcessingEdit = false;
}
```

To handle the issue of list items wrapping to new lines while maintaining indentation, we need to modify the TextEditor.svelte component to wrap list items in a container:

```svelte
<!-- In TextEditor.svelte -->
<div class="content-wrapper">
  {#each nodes as node, index (node.id)}
    {#if node.structuralRole === 'listItem' && (index === 0 || nodes[index-1].structuralRole !== 'listItem')}
      <!-- Start of a list item -->
      <div class="list-item-container">
        <TextNode {node} isActive={node.id === activeNodeId} />
      </div>
    {:else if node.structuralRole === 'listItem' && nodes[index-1].structuralRole === 'listItem'}
      <!-- Continuation of a list item -->
      <TextNode {node} isActive={node.id === activeNodeId} />
    {:else}
      <!-- Regular node -->
      <TextNode {node} isActive={node.id === activeNodeId} />
    {/if}
  {/each}
</div>
```

This approach ensures that:
1. Each node remains individually editable
2. List items maintain proper indentation when they wrap to new lines
3. The structure is preserved in the flexbox layout

### 5. Implement Header Button Functionality

The header button should place the selected node on its own row.

#### Revised Solution:

```javascript
function handleMakeHeading() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Find the node before the current node
  const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === node.id);
  
  if (currentNodeIndex > 0) {
    // There is a node before this one, insert after that node
    const previousNode = editorStore.nodes[currentNodeIndex - 1];
    
    // Add paragraph break spacer
    editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
    
    // Find the newly created spacer node
    const breakSpacerNode = editorStore.nodes.find(
      (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < node.metadata.position
    );
    
    if (breakSpacerNode) {
      // Update it with paragraph break subtype
      editorStore.updateNode(
        breakSpacerNode.id,
        '',
        undefined,
        { subtype: 'paragraphBreak' },
        'spacer'
      );
    }
  } else {
    // This is the first node, we need to insert at the beginning
    // Save current state for undo
    editorStore.undoStack = [...editorStore.undoStack, editorStore.nodes];
    editorStore.redoStack = [];
    
    // Create paragraph break spacer
    const breakSpacerId = crypto.randomUUID();
    const breakSpacerNode = {
      id: breakSpacerId,
      text: '',
      type: 'spacer' as const,
      spacerData: { subtype: 'paragraphBreak' as const },
      metadata: {
        position: 0,
        isPunctuation: false,
        isWhitespace: true,
        startIndex: 0,
        endIndex: 0,
      }
    };
    
    // Insert spacer at the beginning
    const newNodes = [breakSpacerNode, ...editorStore.nodes];
    
    // Update positions for all nodes
    const updatedNodes = newNodes.map((n, index) => ({
      ...n,
      metadata: { ...n.metadata, position: index }
    }));
    
    // Update the store
    editorStore.batchUpdateNodes(updatedNodes);
  }
  
  // Update the node with heading role
  editorStore.updateNode(
    node.id,
    node.text,
    undefined,
    undefined,
    'normal',
    'heading'
  );
  
  onClose();
  isProcessingEdit = false;
}
```

### 6. Add Text Alignment Options

For text alignment, instead of modifying the node schema, we'll use flexbox properties and spacer nodes to achieve the desired alignment. This approach is more in line with the current architecture and avoids breaking changes.

#### Revised Solution:

First, create alignment icons in `src/lib/icons/`:

```svelte
<!-- AlignLeft.svelte -->
<script lang="ts">
  export let size = 24;
  export let stroke = 'currentColor';
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="6" x2="21" y2="6"></line>
  <line x1="3" y1="12" x2="15" y2="12"></line>
  <line x1="3" y1="18" x2="18" y2="18"></line>
</svg>

<!-- AlignCenter.svelte -->
<script lang="ts">
  export let size = 24;
  export let stroke = 'currentColor';
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="6" x2="21" y2="6"></line>
  <line x1="6" y1="12" x2="18" y2="12"></line>
  <line x1="4" y1="18" x2="20" y2="18"></line>
</svg>

<!-- AlignRight.svelte -->
<script lang="ts">
  export let size = 24;
  export let stroke = 'currentColor';
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="6" x2="21" y2="6"></line>
  <line x1="9" y1="12" x2="21" y2="12"></line>
  <line x1="6" y1="18" x2="21" y2="18"></line>
</svg>
```

Then, add alignment functions to FormattingModal.svelte:

```javascript
// Import alignment icons
import AlignLeft from '$lib/icons/AlignLeft.svelte';
import AlignCenter from '$lib/icons/AlignCenter.svelte';
import AlignRight from '$lib/icons/AlignRight.svelte';

// Add alignment functions
function handleAlignLeft() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Remove any existing alignment spacers
  removeAlignmentSpacers(node.id);
  
  // Left alignment is the default, so we don't need to add spacers
  
  onClose();
  isProcessingEdit = false;
}

function handleAlignCenter() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Remove any existing alignment spacers
  removeAlignmentSpacers(node.id);
  
  // Find the node before the current node
  const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === node.id);
  
  if (currentNodeIndex > 0) {
    // There is a node before this one, insert after that node
    const previousNode = editorStore.nodes[currentNodeIndex - 1];
    
    // Add flexible spacer before the node (for centering)
    editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
    
    // Find the newly created spacer node
    const leftSpacerNode = editorStore.nodes.find(
      (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < node.metadata.position
    );
    
    if (leftSpacerNode) {
      // Update it with a custom subtype for alignment
      editorStore.updateNode(
        leftSpacerNode.id,
        '',
        undefined,
        { subtype: 'alignmentSpacer' },
        'spacer'
      );
    }
  }
  
  // Add flexible spacer after the node (for centering)
  editorStore.insertNodeAfter(node.id, '', 'spacer');
  
  // Find the newly created spacer node
  const rightSpacerNode = editorStore.nodes.find(
    (n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
  );
  
  if (rightSpacerNode) {
    // Update it with a custom subtype for alignment
    editorStore.updateNode(
      rightSpacerNode.id,
      '',
      undefined,
      { subtype: 'alignmentSpacer' },
      'spacer'
    );
  }
  
  onClose();
  isProcessingEdit = false;
}

function handleAlignRight() {
  if (isProcessingEdit) return;
  isProcessingEdit = true;
  
  // Remove any existing alignment spacers
  removeAlignmentSpacers(node.id);
  
  // Find the node before the current node
  const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === node.id);
  
  if (currentNodeIndex > 0) {
    // There is a node before this one, insert after that node
    const previousNode = editorStore.nodes[currentNodeIndex - 1];
    
    // Add flexible spacer before the node (for right alignment)
    editorStore.insertNodeAfter(previousNode.id, '', 'spacer');
    
    // Find the newly created spacer node
    const spacerNode = editorStore.nodes.find(
      (n) => n.type === 'spacer' && n.metadata.position > previousNode.metadata.position && n.metadata.position < node.metadata.position
    );
    
    if (spacerNode) {
      // Update it with a custom subtype for alignment
      editorStore.updateNode(
        spacerNode.id,
        '',
        undefined,
        { subtype: 'alignmentSpacer' },
        'spacer'
      );
    }
  }
  
  onClose();
  isProcessingEdit = false;
}

// Helper function to remove alignment spacers
function removeAlignmentSpacers(nodeId) {
  // Find the current node
  const currentNodeIndex = editorStore.nodes.findIndex((n) => n.id === nodeId);
  if (currentNodeIndex === -1) return;
  
  // Check for alignment spacers before the node
  if (currentNodeIndex > 0) {
    const previousNode = editorStore.nodes[currentNodeIndex - 1];
    if (previousNode.type === 'spacer' && previousNode.spacerData?.subtype === 'alignmentSpacer') {
      editorStore.removeNode(previousNode.id);
    }
  }
  
  // Check for alignment spacers after the node
  if (currentNodeIndex < editorStore.nodes.length - 1) {
    const nextNode = editorStore.nodes[currentNodeIndex + 1];
    if (nextNode.type === 'spacer' && nextNode.spacerData?.subtype === 'alignmentSpacer') {
      editorStore.removeNode(nextNode.id);
    }
  }
}
```

Add the alignment buttons to the UI:

```svelte
<!-- Alignment Group -->
<div class="button-group" role="group" aria-label="Alignment actions">
  <button
    onclick={handleAlignLeft}
    type="button"
    title="Align left"
  >
    <span class="button-icon">
      <AlignLeft />
    </span>
  </button>
  
  <button
    onclick={handleAlignCenter}
    type="button"
    title="Align center"
  >
    <span class="button-icon">
      <AlignCenter />
    </span>
  </button>
  
  <button
    onclick={handleAlignRight}
    type="button"
    title="Align right"
  >
    <span class="button-icon">
      <AlignRight />
    </span>
  </button>
</div>
```

Finally, update the TextNode.svelte component to style the alignment spacers:

```svelte
<!-- In TextNode.svelte -->
<style>
  /* Alignment spacer styling */
  .text-node[data-subtype='alignmentSpacer'] {
    flex: 1;
    min-width: 0;
    border: none;
  }
</style>
```

This approach uses flexbox properties and spacer nodes to achieve alignment without modifying the node schema. The spacers with `flex: 1` will expand to fill available space, pushing the text node to the desired position.

## Implementation Considerations

### 1. List Item Indentation

The challenge with list items is maintaining indentation when they wrap to new lines while preserving individual node editability. The proposed solution addresses this by:

1. Using a container div with appropriate padding for list items
2. Keeping each node individually editable
3. Using CSS to ensure proper indentation when text wraps

This approach avoids the need for a complex nested structure while still providing the desired visual appearance.

### 2. Performance Implications

The proposed solutions involve more complex node manipulation, which could impact performance. We should:
- Ensure all node operations are batched when possible
- Use the `batchUpdateNodes` method for multi-node operations
- Consider adding a debounce to rapid formatting operations

### 3. User Experience

The new formatting options will improve the user experience, but we should:
- Add visual feedback when formatting is applied
- Consider adding keyboard shortcuts for common formatting operations
- Ensure the modal UI is intuitive and accessible

## Testing Plan

1. **Unit Tests**:
   - Test each formatting function in isolation
   - Verify correct node creation and positioning
   - Test edge cases (first node, last node, etc.)

2. **Integration Tests**:
   - Test formatting operations in the context of the full editor
   - Verify that undo/redo works correctly with formatting operations
   - Test interaction between different formatting options

3. **User Testing**:
   - Gather feedback on the usability of the new formatting options
   - Verify that the formatting behaves as expected in real-world scenarios

## Conclusion

This revised refactoring plan addresses the feedback about alignment implementation and list item indentation. The key changes from the original plan are:

1. Using flexbox properties and spacer nodes for alignment instead of modifying the node schema
2. Implementing a container-based approach for list items to maintain indentation when text wraps
3. Keeping all nodes individually editable while preserving the visual structure

These changes maintain compatibility with the existing flexbox-based architecture while adding the requested functionality and fixing current issues.