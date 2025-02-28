# Final Spacer Subtype Enum Refactoring Plan

## Overview

This document outlines a simplified plan to refactor the `spacerSubtypeEnum` in `src/lib/schemas/textNode.ts` to make it more descriptive and better aligned with its actual usage in the application.

## Current Implementation

In `textNode.ts`, the spacerSubtypeEnum is currently defined with just two values:

```typescript
export const spacerSubtypeEnum = z.enum([
    'paragraphBreak',
    'paragraphIndent',
]);
```

## Issues with Current Implementation

1. **Unclear Naming**: The term 'paragraphBreak' doesn't clearly communicate that this spacer fills the entire row width to force content onto a new line.

2. **Limited Scope**: The current enum is too paragraph-focused and doesn't account for other formatting needs.

3. **Inconsistent with Usage**: In our FormattingModal refactoring, we introduced the concept of an 'alignmentSpacer' for text alignment, but this isn't reflected in the schema.

## Proposed Refactoring

### New Enum Definition

```typescript
export const spacerSubtypeEnum = z.enum([
    'lineBreak',       // Forces content to next line (fills entire row width)
    'indent',          // Creates indentation at start of text
    'alignment'        // Used for text alignment (flexible width)
]);
```

### Rationale for New Names

1. **lineBreak** instead of paragraphBreak:
   - More clearly indicates its purpose - to force content onto a new line by filling the entire row width
   - More generic and can be used for any content that needs to start on a new line, not just paragraphs
   - Aligns better with CSS concepts (line breaks vs paragraph breaks)
   - Can be used for both paragraph breaks and block spacing (vertical spacing between elements)

2. **indent** instead of paragraphIndent:
   - Simpler and more generic
   - Indentation can be used for paragraphs, list items, code blocks, etc.
   - Removes the paragraph-specific connotation

3. **alignment** (new):
   - For spacers used to align text (left, center, right)
   - Supports the text alignment functionality discussed in our formatting modal refactoring
   - Provides a clear purpose for flexible-width spacers

### Removed Considerations

- **listBullet**: Since the list formatting approach hasn't been finalized yet, we'll defer adding a specific spacer type for list bullets. When the list formatting strategy is decided, we can revisit this if needed.

## Implementation Steps

### 1. Update the Schema in textNode.ts

```typescript
// Update the enum definition
export const spacerSubtypeEnum = z.enum([
    'lineBreak',
    'indent',
    'alignment'
]);
```

### 2. Update TextNode.svelte Component

The CSS styling for spacer nodes needs to be updated to handle the new subtypes:

```svelte
<!-- In TextNode.svelte -->
<style>
  /* Line break spacer - fills entire row */
  .text-node[data-subtype='lineBreak'] {
    width: 100%;
    height: var(--font-size-base);
    border: none;
    display: block;
    flex-basis: 100%; /* Force line break in flex container */
    margin-bottom: var(--spacing-2);
  }
  
  /* Indent spacer - fixed width for indentation */
  .text-node[data-subtype='indent'] {
    width: 2em;
    min-width: 2em;
    border: none;
  }
  
  /* Alignment spacer - flexible width for text alignment */
  .text-node[data-subtype='alignment'] {
    flex: 1;
    min-width: 0;
    border: none;
  }
  
  /* We can create variations of lineBreak for different spacing needs */
  .text-node[data-subtype='lineBreak'][data-spacing='large'] {
    margin-bottom: var(--spacing-4); /* More spacing for section breaks */
  }
</style>
```

### 3. Update FormattingModal.svelte

Update the functions that create spacer nodes to use the new subtypes:

```typescript
// Example for paragraph formatting
function handleMakeParagraph() {
  // ...existing code...
  
  // Update with new subtype names
  editorStore.updateNode(
    breakSpacerNode.id,
    '',
    undefined,
    { subtype: 'lineBreak' }, // Changed from 'paragraphBreak'
    'spacer'
  );
  
  // ...
  
  editorStore.updateNode(
    indentSpacerNode.id,
    '',
    undefined,
    { subtype: 'indent' }, // Changed from 'paragraphIndent'
    'spacer'
  );
  
  // ...
}

// Example for alignment
function handleAlignCenter() {
  // ...existing code...
  
  editorStore.updateNode(
    spacerNode.id,
    '',
    undefined,
    { subtype: 'alignment' }, // New subtype
    'spacer'
  );
  
  // ...
}
```

### 4. Update Claude Instructions in claude.ts

Update the instructions to Claude to reflect the new spacer subtypes:

```typescript
// In claude.ts
const response = await client.messages.create({
  // ...existing code...
  system: "You are a document structure analyzer that identifies structural elements in text and generates compressed TextNodes for the editor. Be precise and thorough in your analysis. NEVER truncate your response, even for large documents. If the document is too large, focus on providing accurate structural analysis for the content you can process. IMPORTANT: Do not create spacer nodes for regular whitespace between words or for line breaks within the same paragraph - only create spacer nodes for specific formatting purposes.",
  messages: [{
    role: "user",
    content: `Analyze this text and identify its structural elements. Also generate compressed TextNodes for the editor:

${text}

For the compressed nodes, create a JSON array where each node uses the compact format:
{
  "i": "unique-id", // id
  "t": "normal", // type (normal, spacer, correction)
  "x": "word", // text (optional for spacers)
  "s": "lineBreak", // spacer subtype (optional)
  "r": "title", // structural role (optional)
  "m": { // metadata
    "p": 0, // position
    "w": false, // isWhitespace
    "u": false, // isPunctuation
    "s": 0, // startIndex
    "e": 0 // endIndex
  }
}

IMPORTANT SPACER RULES: DO NOT create spacer nodes for:
1. Regular whitespace between words
2. Line breaks within the same paragraph
3. Large gaps between words mid-sentence

Only create spacer nodes for:
1. Line breaks (with subtype "lineBreak") - forces content to the next line by filling the entire row width
2. Indentation (with subtype "indent") - creates indentation at the start of text

IMPORTANT: For EVERY paragraph, including the very first paragraph in the document:
1. Create a line_break spacer node (with subtype "lineBreak")
2. Followed by an indent spacer node (with subtype "indent")

This means even the first paragraph should have these two spacer nodes before its content begins.

Example of correct paragraph handling:
- For a document starting with "This is paragraph one."
  The nodes should be in this order:
  1. { "t": "spacer", "s": "lineBreak", "m": { ... } }  // Line break
  2. { "t": "spacer", "s": "indent", "m": { ... } } // Indentation
  3. { "x": "This", "t": "normal", "m": { ... } }
  4. { "x": "is", "t": "normal", "m": { ... } }
  ...

Regular spaces between words should be handled by CSS spacing in the UI, not as separate nodes.`
  }],
  // ...rest of the code...
});
```

### 5. Update Any Other References

Search for any other references to the old spacer subtypes in the codebase and update them:

```typescript
// Example search patterns:
// - 'paragraphBreak'
// - 'paragraphIndent'
// - node.spacerData?.subtype === 'paragraphBreak'
// - node.spacerData?.subtype === 'paragraphIndent'
```


## Conclusion

This simplified refactoring focuses on the essential spacer types needed right now:

1. **lineBreak**: For forcing content to the next line (replacing paragraphBreak)
2. **indent**: For creating indentation (replacing paragraphIndent)
3. **alignment**: For text alignment (new)

These changes will make the spacer subtype enum more descriptive and better aligned with its actual usage in the application. The new names are more intuitive and provide a clearer understanding of each spacer's purpose.

As the application evolves and formatting requirements become more defined (particularly for lists), we can revisit the enum and add additional spacer types as needed.