# ESL Text Editor Implementation Guide

## Table of Contents

1. [Core Concept](#core-concept)
2. [Component Architecture](#component-architecture)
   - [TextEditor.svelte](#texteditorsvelte)
   - [TextNode.svelte](#textnodesvelte)
   - [EditModal.svelte](#editmodalsvelte)
3. [Command Center Architecture](#command-center-architecture)
   - [Command Structure](#command-structure)
   - [Command Types](#command-types)
   - [Command State Management](#command-state-management)
4. [Store Architecture](#store-architecture)
   - [Document State](#document-state)
   - [Position Caching System](#position-caching-system)
   - [Selection Management](#selection-management)
5. [Node Operations](#node-operations)
   - [Group Node Handling](#group-node-handling)
   - [Node Unpacking](#node-unpacking)
6. [User Interaction Flow](#user-interaction-flow)
   - [Selection System](#selection-system)
   - [Mouse Controls](#mouse-controls)
   - [Correction Flow](#correction-flow)
7. [Testing Strategy](#testing-strategy)
   - [Command Testing](#command-testing)
   - [Store Testing](#store-testing)
8. [Future Considerations](#future-considerations)

## Core Concept

Our text editor helps teachers provide clear, actionable feedback on student essays. Rather than focusing on exhaustive error categorization, we emphasize patterns students can learn from. The system uses tokens (nodes) representing words or punctuation that teachers can modify to provide corrections.

[Rest of the content remains the same as in your previous documentation]
