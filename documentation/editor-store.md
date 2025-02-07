# Editor Store Documentation

## Overview

The Editor Store is a Svelte store that manages the state and operations for the text editor. It handles parsing, storing, and manipulating text corrections in a structured format.

## Core Concepts

### Node Types

- **normal**: Regular text without any corrections
- **deletion**: Text marked for removal
- **addition**: Text to be added
- **correction**: Text that needs to be changed
- **empty**: Empty placeholder node
- **indent**: Indentation marker for nested content

### Correction Tags

#### Grammar & Usage

- **plural (pl)**: Plural form corrections
  - Example: "dogs #pl:dog#"
- **verb-tense (vt)**: Verb tense corrections
  - Example: "running #vt:ran#"
- **subject-verb (sv)**: Subject-verb agreement
  - Example: "they runs #sv:run#"
- **article (art)**: Article usage
  - Example: "a #art:the#" or "[the] book"
- **pronoun (pron)**: Pronoun corrections
  - Example: "him #pron:he#"
- **preposition (prep)**: Preposition usage
  - Example: "in #prep:on#"
- **conjunction (conj)**: Conjunction usage
  - Example: "and #conj:but#"

#### Structure

- **fragment (frag)**: Sentence fragment markers
  - Example: "Running fast #frag#"
- **paragraph (para)**: Paragraph breaks
  - Example: "[¶]"

#### Formatting

- **capital (cap)**: Capitalization corrections
  - Example: "john #cap#"
- **punctuation (punc)**: Punctuation corrections
  - Example: "hello #punc#"

#### Additional Types

- **wordchoice (wc)**: Word choice suggestions
  - Example: "big !large!"
- **redundant (red)**: Redundant text markers
  - Example: "-very very-"

## Syntax Guide

### Basic Corrections

- **Simple correction**: word !correction!
  - Example: "recieve !receive!"

### Deletions

- **Mark text for deletion**: -text-
  - Example: "-very very-"

### Additions

- **Add new text**: [text]
  - Example: "[the] book"
- **Add paragraph break**: [¶]

### Grammar Corrections

- **With correction text**: word #tag:correction#
  - Example: "dogs #pl:dog#"
- **Without correction**: word #tag#
  - Example: "hello #punc#"

### Indentation

- **Single level**: >text
- **Multiple levels**: >>text
  - Used for nested content

## Store Actions

### parseContent(content: string)

Parses raw text content into structured nodes with corrections.

### insertNodeAfter(nodeId: string, text: string, type?: TextNodeType)

Inserts a new node after the specified node.

### removeNode(nodeId: string)

Removes a node from the document.

### updateNode(nodeId: string, newText: string, newCorrectionText?: string, newType?: TextNodeType)

Updates an existing node's properties.

### setActiveNode(nodeId: string | null)

Sets the currently active node for editing.

### undo()

Reverts the last change.

### redo()

Reapplies a previously undone change.

### getContent()

Converts the structured nodes back into text format.

## Example Usage

```typescript
// Initialize store
const editorStore = createEditorStore();

// Parse content
editorStore.parseContent(`
Last week, I visited my friend's house #punc#

>The first paragraph needed revisions. We found several errors in it #punc# For example, me and him !we! were #sv# using wrong pronouns #pron:we#.

[¶]

The conclusion needed work too #punc# -In conclusion- [Finally], we decided to focus in !on# the environmental impact.
`);

// Get formatted content
const content = editorStore.getContent();
```
