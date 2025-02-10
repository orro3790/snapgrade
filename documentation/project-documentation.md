# ESL Text Editor Implementation Guide

## Core Concept

Our text editor helps teachers provide clear, actionable feedback on student essays. Rather than focusing on exhaustive error categorization, we emphasize patterns students can learn from. The system uses tokens (nodes) representing words or punctuation that teachers can modify to provide corrections.

## Component Architecture

### Key Components

#### TextEditor.svelte

The main editor component that:

- Handles document loading and saving
- Manages the A4 page-like layout
- Coordinates between nodes and stores
- Manages keyboard interactions
- Handles undo/redo operations
- Generates printable output

#### TextNode.svelte

Individual node component that:

- Renders different node types (normal, correction, deletion, etc.)
- Handles node-specific interactions
- Manages node editing states
- Provides visual feedback

#### StatsDisplay.svelte

Shows real-time statistics about:

- Total corrections
- Pattern frequencies
- Word counts
- Document progress

#### EditModal.svelte

Modal component for:

- Node text editing
- Pattern selection
- Correction explanations
- Quick corrections

#### StagingArea.svelte

Component for reviewing and correcting OCR output from LLMWHisperer:

- Displays raw text with basic formatting.
- Allows manual correction of OCR errors.
- Provides UI for identifying title, subtitle, and headings.
- Prepares the document for LLM correction (if used) or direct import.

## Schema Definitions

### Document Schema (Existing)

```typescript
// schemas/document.ts
export const documentSchema = z.object({
	studentId: z.string(),
	studentName: z.string(),
	className: z.string().optional(),
	documentName: z.string(),
	documentBody: z.string(),
	userId: z.string(),
	status: z.enum(['staged', 'editing', 'completed']),
	sourceType: z.enum(['telegram', 'manual']),
	id: z.string(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	sourceMetadata: z
		.object({
			telegramMessageId: z.string().optional(),
			telegramChatId: z.string().optional(),
			telegramFileId: z.string().optional()
		})
		.optional()
});

type Document = z.infer<typeof documentSchema>;
```

### Node Schema

```typescript
// schemas/node.ts
export const nodeTypeEnum = z.enum([
	'normal',
	'correction',
	'addition',
	'deletion',
	'empty',
	'spacing'
]);

export const nodeMetadataSchema = z.object({
	position: z.number(),
	lineNumber: z.number(),
	isPunctuation: z.boolean(),
	isWhitespace: z.boolean(),
	startIndex: z.number(),
	endIndex: z.number()
});

export const correctionDataSchema = z.object({
	originalText: z.string(),
	correctedText: z.string(),
	pattern: z.string(),
	explanation: z.string().optional(),
	teacherNotes: z.string().optional()
});

export const nodeSchema = z.object({
	id: z.string(),
	text: z.string(),
	type: nodeTypeEnum,
	correctionData: correctionDataSchema.optional(),
	metadata: nodeMetadataSchema,
	hasNextCorrection: z.boolean().optional()
});

type Node = z.infer<typeof nodeSchema>;
type NodeType = z.infer<typeof nodeTypeEnum>;
```

Note: The `isWhitespace` property within `metadata` will be `true` only for nodes of type `spacer`. For `normal` nodes, it will always be `false`, as whitespace is not included in the text content of regular nodes.

#### Example Node

```typescript
const correctionNode = {
	id: 'node_uuid_here',
	text: 'misstake', // Original text is preserved in the node
	type: 'correction', // Indicates this is a correction node
	correctionData: {
		originalText: 'misstake',
		correctedText: 'mistake',
		pattern: 'form.modify', // Based on your pattern system in documentation
		explanation: "Common spelling error: 'mistake' has one 's'",
		teacherNotes: 'Review basic spelling patterns' // Optional
	},
	metadata: {
		position: 42, // Example position in document
		lineNumber: 3, // Example line number
		isPunctuation: false,
		isWhitespace: false,
		startIndex: 156, // Character index in original text
		endIndex: 164 // End index in original text
	}
};
```

### Pattern Schema

```typescript
// schemas/pattern.ts
export const patternCategoryEnum = z.enum(['time', 'rel', 'form', 'str', 'clear', 'quant', 'cond']);

export const patternSubcategoryEnum = z.enum([
	'sequence',
	'duration',
	'tense',
	'aspect',
	'prep',
	'article',
	'pairs',
	'refs',
	'plural',
	'modify',
	'agree',
	'compare',
	'order',
	'complete',
	'connect',
	'complex',
	'repeat',
	'formal',
	'specific',
	'active',
	'count',
	'measure',
	'degree',
	'real',
	'unreal',
	'future',
	'mixed'
]);

export const patternExampleSchema = z.object({
	incorrect: z.string(),
	correct: z.string(),
	explanation: z.string()
});

export const patternSchema = z.object({
	id: z.string(),
	category: patternCategoryEnum,
	subcategory: patternSubcategoryEnum,
	examples: z.array(patternExampleSchema),
	frequency: z.number().default(0),
	commonContexts: z.array(z.string()).default([]),
	description: z.string().optional()
});

type Pattern = z.infer<typeof patternSchema>;
type PatternCategory = z.infer<typeof patternCategoryEnum>;
type PatternSubcategory = z.infer<typeof patternSubcategoryEnum>;
```

## Learning Pattern Categories

### Time Expression Patterns

Category: `time`

- `time.sequence`: Before/after relationships, event ordering

  - Example Incorrect: "After finish homework, I play games"
  - Example Correct: "After finishing homework, I play games"

- `time.duration`: For/since usage, length of time

  - Example Incorrect: "I live here since 5 years"
  - Example Correct: "I have lived here for 5 years"

- `time.tense`: Past/present/future matching with time markers

  - Example Incorrect: "Yesterday I go to school"
  - Example Correct: "Yesterday I went to school"

- `time.aspect`: Ongoing vs completed actions
  - Example Incorrect: "I study English since January"
  - Example Correct: "I have been studying English since January"

### Word Relationships

Category: `rel`

- `rel.prep`: Preposition usage and relationships

  - Example Incorrect: "I arrived to the station"
  - Example Correct: "I arrived at the station"

- `rel.article`: A/an/the usage patterns

  - Example Incorrect: "I bought car"
  - Example Correct: "I bought a car"

- `rel.pairs`: Common word combinations

  - Example Incorrect: "Let's make a coffee"
  - Example Correct: "Let's have a coffee"

- `rel.refs`: References and pronouns
  - Example Incorrect: "The book which I read it"
  - Example Correct: "The book which I read"

### Form and Agreement

Category: `form`

- `form.plural`: Regular/irregular plurals, count/non-count

  - Example Incorrect: "I need informations"
  - Example Correct: "I need information"

- `form.modify`: Adjective/adverb formations

  - Example Incorrect: "He drives safe"
  - Example Correct: "He drives safely"

- `form.agree`: Subject-verb matching

  - Example Incorrect: "The children is playing"
  - Example Correct: "The children are playing"

- `form.compare`: Comparisons and superlatives
  - Example Incorrect: "This is more easier"
  - Example Correct: "This is easier"

### Sentence Structure

Category: `str`

- `str.order`: Word order and arrangement

  - Example Incorrect: "I like very much pizza"
  - Example Correct: "I like pizza very much"

- `str.complete`: Complete thought formation

  - Example Incorrect: "Because I was late"
  - Example Correct: "I missed the bus because I was late"

- `str.connect`: Joining ideas appropriately

  - Example Incorrect: "I was tired. I went to sleep"
  - Example Correct: "I was tired, so I went to sleep"

- `str.complex`: Complex sentence formation
  - Example Incorrect: "When rains, I stay home"
  - Example Correct: "When it rains, I stay home"

### Clarity and Style

Category: `clear`

- `clear.repeat`: Unnecessary repetition

  - Example Incorrect: "The completely full box was totally filled"
  - Example Correct: "The box was full"

- `clear.formal`: Register and formality level

  - Example Incorrect: "The boss wants to know what's up with the project"
  - Example Correct: "The manager requests an update on the project"

- `clear.specific`: Precise vs vague language

  - Example Incorrect: "The thing was good"
  - Example Correct: "The presentation was informative"

- `clear.active`: Active/passive voice usage
  - Example Incorrect: "The mistake was made by me"
  - Example Correct: "I made a mistake"

### Quantity Expression

Category: `quant`

- `quant.count`: Many/much, few/little usage

  - Example Incorrect: "I don't have much friends"
  - Example Correct: "I don't have many friends"

- `quant.measure`: Numbers and measurements

  - Example Incorrect: "It takes 5 hours time"
  - Example Correct: "It takes 5 hours"

- `quant.degree`: Intensity and degree words
  - Example Incorrect: "The weather is very very hot"
  - Example Correct: "The weather is extremely hot"

### Conditional and Hypothetical

Category: `cond`

- `cond.real`: Real/possible situations

  - Example Incorrect: "If it will rain, I stay home"
  - Example Correct: "If it rains, I'll stay home"

- `cond.unreal`: Imaginary/impossible situations

  - Example Incorrect: "If I was rich, I buy a house"
  - Example Correct: "If I were rich, I would buy a house"

- `cond.future`: Future possibilities

  - Example Incorrect: "When I will graduate, I work"
  - Example Correct: "When I graduate, I will work"

- `cond.mixed`: Mixed time references
  - Example Incorrect: "If I studied harder, I will pass"
  - Example Correct: "If I had studied harder, I would have passed"

## Store Architecture

## Staging Area

The application incorporates a "staging area" or "loading bay" to handle the initial import and processing of documents, particularly those originating from external sources like Telegram and LLMWHisperer (for OCR of handwritten essays).

**Workflow:**

1.  **Document Arrival:** When a document is received (e.g., via Telegram), it is not immediately loaded into the main text editor. Instead, it is placed in the staging area with a status of `'staged'`.
2.  **User Notification:** The teacher receives a notification in the UI indicating that a new document is available for review.
3.  **Review and Correction:** The teacher opens the staged document in a dedicated `StagingArea.svelte` component. This component:
    - Displays the raw text extracted by LLMWHisperer (with basic formatting to preserve the original layout).
    - Provides a text editing area where the teacher can manually correct any errors made during the OCR process.
    - **Provides _assisted_ structure identification:**
      - Uses heuristics (whitespace, capitalization, keywords) to _suggest_ potential titles, headings, and list items (e.g., by highlighting them).
      - Offers UI elements (buttons, dropdowns, drag-and-drop) for the user to _confirm or modify_ the suggestions.
4.  **Title/Heading/List Item Extraction:** The `StagingArea` component is responsible for extracting the title, subtitle, headings and list items based on the teacher's input (confirming or modifying the suggestions). This ensures accuracy.
5.  **Preparation for LLM:** Once the teacher is satisfied with the corrected text and has identified the structural elements, the `StagingArea` component prepares the document for the next stage:
    - The `documentBody` is extracted (the main text content without the title/headings).
    - Paragraph separators (`<<<>>>`) are inserted into the `documentBody` to maintain paragraph structure.
6.  **LLM Correction (Optional):** The `documentBody` (with paragraph separators) and instructions are sent to an LLM (Language Model) for grammatical correction. The instructions specify the expected output format: a JSON array representing the corrected text, with each element corresponding to a word or punctuation mark.
7.  **Processing LLM Output:** The JSON array returned by the LLM is parsed and validated.
8.  **TextNode Conversion:** The parsed and validated JSON data is converted into the application's internal `TextNode` structure.
9.  **Document Finalization:** A new document is created in the database with a status of `'editing'`, populated with the extracted title, subtitle, headings, and the corrected `TextNode` array. The document is now ready for further refinement and annotation within the main text editor.

## Text Processing

### Serialization and Deserialization Implementation

- Source: `src/lib/utils/nodeSerializer.ts`

#### Whitespace Handling

The text editor handles whitespace in a specific way, optimized for its node-based structure and correction-focused workflow:

- **Parsing:** During the initial text parsing (in `editorStore.ts`, `parseContent` function), whitespace characters (spaces, tabs, newlines) are _ignored_. The input text is split into tokens based on words and punctuation only. Whitespace is _not_ used to create nodes automatically.
- **Spacer Nodes:** Tabs and newlines are represented by explicit "spacer" nodes. These nodes are _not_ created during the initial parsing of the input text. Instead, they are created _explicitly_ by user actions:
  - Users can insert a "tab" spacer node using a designated hotkey (e.g., the Tab key) or a UI button.
  - Users can insert a "newline" spacer node using a designated hotkey (e.g., Ctrl+Enter, or a dedicated "new line" button) or a UI button.
- **Indentation:** Users can achieve indentation by adding multiple "tab" spacer nodes. There is no concept of "double tabs" or other special whitespace combinations.

This approach simplifies the parsing logic and gives users precise control over spacing within the document.

## User Interaction Flow

### Node Manipulation

The text editor supports several ways to manipulate nodes:

#### Mouse Controls

1.  **Basic Selection**

    - Single Click: start editing a node

2.  **Correction Actions**
    - Ctrl + Left Click: Insert empty node after selection
    - Alt + Left Click: Toggle deletion state
    - Ctrl + Right Click: Remove node
3.  **Correction Flow**
    When editing a node:
    - Type new text and press Enter or click outside the modal to create correction

#### Keyboard Navigation

1.  **Movement**

    - Tab: Move to next node
    - Shift + Tab: Move to previous node
    - Arrow keys: Navigate between nodes

2.  **Editing**

    - Enter: Start editing selected node
    - Escape: Cancel editing
    - Ctrl + Z: Undo last change
    - Ctrl + Y: Redo last undone change

3.  **Special Functions**
    - Ctrl + S: Save document
    - Ctrl + P: Print view
    - Alt + H: Toggle help overlay

#### Adding Whitespace

Since the editor is node-based and designed for correcting existing text, users do _not_ type spaces, tabs, and newlines directly into a continuous text flow. Instead:

- **Spaces:** Regular spaces between words are automatically handled when parsing text into nodes. Users do not need to add spaces manually.
- **Tabs:** Users can insert a "tab" spacer node by using a designated hotkey (e.g., the Tab key itself, but _not_ while editing a text node) or by clicking a UI button specifically for adding tabs.
- **Newlines:** Users can insert a "newline" spacer node by using a designated hotkey (e.g., Ctrl+Enter, or a dedicated "new line" button) or by clicking a UI button specifically for adding newlines.

### Staging and Review Workflow (New)

1.  **Document Import:** Documents received from external sources (Telegram/LLMWHisperer) are initially placed in a "staging area" with a status of `'staged'`.
2.  **User Review:** The teacher reviews the document in the `StagingArea.svelte` component, correcting any OCR errors and identifying the title, subtitle, and headings.
3.  **Document Preparation:** The `StagingArea` component extracts the `documentBody` and prepares it for LLM correction (optional) or direct import.
4.  **Document Finalization:** Once the review is complete, the document is moved to the `'editing'` state, and the `TextNode` array is created.

### Correction Workflow

1.  **Pattern Selection**
    After creating a correction:

    - Pattern selector opens automatically
    - Navigate categories with arrow keys
    - Quick search with keyboard
    - Recent patterns shown first
    - Custom patterns can be created

2.  **Adding Explanations**
    Teachers can:
    - Add custom explanations
    - Select from pattern examples
    - Use AI-suggested explanations
    - Save explanations as templates
    - Allow students to scan QR code on printed rubric to access interactive feedback UI
    - Each correction node contains explanation that displays in tooltip or header
    - List menu of explanations on left of content, hover over to see explanation, snaps view on node
    - Explanations persist with nodes and sync to database
    - Mobile-friendly feedback view optimized for QR code access

### Document Management

1.  **Auto-saving**

    ```typescript
    // Example auto-save implementation
    function setupAutoSave(interval: number = 30000) {
    	let saveTimeout: number;

    	return function triggerAutoSave() {
    		clearTimeout(saveTimeout);
    		saveTimeout = setTimeout(async () => {
    			const content = editorStore.getContent();
    			if (content !== editorStore.lastSavedContent) {
    				try {
    					await saveDocument({
    						...currentDocument,
    						documentBody: content,
    						updatedAt: new Date()
    					});
    					editorStore.update((state) => ({
    						...state,
    						lastSavedContent: content
    					}));
    				} catch (error) {
    					console.error('Auto-save failed:', error);
    				}
    			}
    		}, interval);
    	};
    }
    ```

2.  **Version History**

    - All changes tracked in undo/redo stack
    - Document versions saved periodically
    - Restoration points available
    - Change summary for each version

3.  **Export Options**
    - Clean print version
    - Annotated version with corrections
    - Statistical summary
    - Progress report

## Implementation Priorities

### Phase 1: Core Editor (Complete)

1.  Basic node management

    - Text parsing and tokenization
    - Node creation and editing
    - Basic correction types

2.  Essential UI
    - TextEditor component
    - TextNode component
    - Basic keyboard controls
    - Simple pattern selection

### Phase 2: Staging Area and Integration

1.  **Staging Area Implementation:**
    - Create `StagingArea.svelte` component.
    - Implement UI for reviewing and correcting OCR output.
    - Establish API endpoint to receive documents.
    - Implement title/subtitle/heading identification.
    - Implement document finalization and transition to `'editing'` state.
2.  **Telegram/LLMWHisperer Integration:**
    - Establish API endpoint to receive documents.
    - Implement document creation in `'staged'` status.
3.  **Seed Script Updates**:
    - Update the seed script to reflect schema changes (title, subtitle, headings).

### Phase 3: Enhanced Features (Previously Phase 2)

1.  Advanced corrections

    - Pattern system
    - Explanation templates
    - Multi-node operations

2.  User experience
    - Keyboard shortcuts
    - Context menus
    - Visual feedback
    - Help system

### Phase 4: Integration (Previously Phase 3)

1.  Document management

    - Auto-save
    - Version control
    - Export options

2.  Analytics
    - Error patterns
    - Progress tracking
    - Usage statistics

### Phase 5: Optimization (Previously Phase 4)

1.  Performance

    - Large document handling
    - Lazy loading
    - Batch operations

2.  Advanced features
    - AI integration
    - Template system

## Testing Architecture

### Testing Stack

The project uses a comprehensive testing setup with the following tools:

1.  **Vitest**

    - Main testing framework
    - Compatible with Vite and SvelteKit
    - Provides fast, parallel test execution
    - Supports TypeScript out of the box

2.  **@testing-library/svelte**

    - Testing utility for Svelte components
    - Enables component rendering in tests
    - Provides DOM querying and interaction methods
    - Encourages testing from a user's perspective
    - Example usage:

      ```typescript
      import { render, fireEvent } from '@testing-library/svelte';
      import TextNode from '$lib/components/TextNode.svelte';

      test('node enters edit mode on click', async () => {
      	const { getByText } = render(TextNode, { props: { text: 'Hello' } });
      	const node = getByText('Hello');
      	await fireEvent.click(node);
      	// Assert edit mode is active
      });
      ```

3.  **@testing-library/jest-dom**

    - Extends assertion capabilities
    - Provides DOM-specific matchers
    - Makes tests more readable and maintainable
    - Example matchers:

      ```typescript
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('active');
      expect(element).toBeVisible();
      ```

4.  **jsdom**
    - Provides DOM environment for Node.js
    - Enables DOM manipulation in tests
    - Essential for component testing
    - Automatically configured with Vitest

### Test Organization

```typescript
src/
└── tests/
    ├── unit/               // Unit tests
    │   ├── utils/          // Utility function tests
    │   ├── stores/         // Store tests
    │   └── components/     // Component tests
    ├── integration/        // Integration tests
    ├── fixtures/          // Test data and mocks
    └── setup.ts           // Global test configuration
```

### Testing Patterns

1.  **Store Testing**

    - Test store subscriptions
    - Verify state updates
    - Test derived stores
    - Example: editorStore tests for undo/redo

2.  **Component Testing**

    - Render testing
    - Event handling
    - Props validation
    - Slot content
    - Example: TextNode.svelte tests

3.  **Utility Testing**

    - Input validation
    - Edge cases
    - Error handling
    - Example: nodeSerializer tests

4.  **Integration Testing**
    - Component interactions
    - Store integrations
    - User workflows
    - Example: TextEditor with nodes

## Future Considerations

1.  **AI Enhancement**

    - Pattern suggestion
    - Automatic error detection
    - Explanation generation
    - Learning from correctionsz

2.  **Collaboration**

    - Multiple teacher access
    - Comment system
    - Review workflow
    - Change tracking

3.  **Analytics**

    - Student progress tracking
    - Pattern effectiveness
    - Learning analytics
    - Report generation

4.  **Integration**
    - LMS integration
    - API access
    - Export formats
    - Mobile support
