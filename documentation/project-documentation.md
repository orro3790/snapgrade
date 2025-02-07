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
	hasNextCorrection: z.boolean().optional(),
	mispunctuation: z.boolean().optional()
});

type Node = z.infer<typeof nodeSchema>;
type NodeType = z.infer<typeof nodeTypeEnum>;
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

```typescript
// stores/editorStore.ts
export function createEditorStore() {
	const { subscribe, update } = writable({
		nodes: [] as Node[],
		activeNodeId: null as string | null,
		undoStack: [] as Node[][],
		redoStack: [] as Node[][],
		isSaving: false,
		lastSavedContent: '',
		initialState: null as Node[] | null
	});

	return {
		subscribe,

		parseContent: (content: string) => {
			update((state) => {
				const nodeList = parseTextIntoNodes(content);
				return {
					...state,
					nodes: nodeList,
					lastSavedContent: content,
					initialState: state.initialState === null ? nodeList : state.initialState
				};
			});
		},

		updateNode: (nodeId: string, changes: Partial<Node>) => {
			update((state) => {
				const newState = saveStateForUndo(state);
				const nodes = state.nodes.map((node) =>
					node.id === nodeId ? { ...node, ...changes } : node
				);
				return { ...newState, nodes };
			});
		},

		insertNode: (position: number, node: Node) => {
			update((state) => {
				const newState = saveStateForUndo(state);
				const nodes = [...state.nodes];
				nodes.splice(position, 0, node);
				return { ...newState, nodes };
			});
		},

		deleteNode: (nodeId: string) => {
			update((state) => {
				const newState = saveStateForUndo(state);
				return {
					...newState,
					nodes: state.nodes.filter((node) => node.id !== nodeId)
				};
			});
		},

		undo: () => {
			update((state) => {
				if (state.undoStack.length === 0) return state;

				const newUndoStack = [...state.undoStack];
				const previousNodes = newUndoStack.pop()!;

				return {
					...state,
					nodes: previousNodes,
					undoStack: newUndoStack,
					redoStack: [state.nodes, ...state.redoStack]
				};
			});
		},

		redo: () => {
			update((state) => {
				if (state.redoStack.length === 0) return state;

				const newRedoStack = [...state.redoStack];
				const nextNodes = newRedoStack.shift()!;

				return {
					...state,
					nodes: nextNodes,
					undoStack: [...state.undoStack, state.nodes],
					redoStack: newRedoStack
				};
			});
		}
	};
}

// stores/patternStore.ts
export function createPatternStore() {
	const { subscribe, update } = writable({
		patterns: new Map<string, Pattern>(),
		recentPatterns: [] as string[],
		categoryFilters: [] as string[],
		searchQuery: '',
		activeCategory: null as PatternCategory | null
	});

	return {
		subscribe,

		addPattern: (pattern: Pattern) => {
			update((state) => {
				const patterns = new Map(state.patterns);
				patterns.set(pattern.id, pattern);
				return { ...state, patterns };
			});
		},

		filterPatterns: (filters: string[]) => {
			update((state) => ({
				...state,
				categoryFilters: filters
			}));
		},

		searchPatterns: (query: string) => {
			update((state) => ({
				...state,
				searchQuery: query
			}));
		},

		updateFrequency: (patternId: string) => {
			update((state) => {
				const pattern = state.patterns.get(patternId);
				if (!pattern) return state;

				const patterns = new Map(state.patterns);
				patterns.set(patternId, {
					...pattern,
					frequency: pattern.frequency + 1
				});

				return { ...state, patterns };
			});
		}
	};
}

// stores/statsStore.ts
export function createStatsStore() {
	const { subscribe, update } = writable({
		totalCorrections: 0,
		patternFrequency: new Map<string, number>(),
		mostCommonErrors: [] as string[],
		studentProgress: {
			improvedPatterns: [] as string[],
			persistentErrors: [] as string[]
		}
	});

	return {
		subscribe,

		updateStats: (nodes: Node[]) => {
			update((state) => {
				const patternFrequency = new Map<string, number>();
				let totalCorrections = 0;

				nodes.forEach((node) => {
					if (node.type === 'correction' && node.correctionData?.pattern) {
						totalCorrections++;
						const pattern = node.correctionData.pattern;
						patternFrequency.set(pattern, (patternFrequency.get(pattern) || 0) + 1);
					}
				});

				const mostCommonErrors = Array.from(patternFrequency.entries())
					.sort(([, a], [, b]) => b - a)
					.slice(0, 5)
					.map(([pattern]) => pattern);

				return {
					...state,
					totalCorrections,
					patternFrequency,
					mostCommonErrors
				};
			});
		},

		trackPatternUsage: (pattern: string) => {
			update((state) => {
				const patternFrequency = new Map(state.patternFrequency);
				patternFrequency.set(pattern, (patternFrequency.get(pattern) || 0) + 1);
				return { ...state, patternFrequency };
			});
		}
	};
}
```

## Text Processing

### Parser Implementation

```typescript
// utils/parser.ts
export function createParser() {
	// Main parsing function that converts text content into nodes
	function parseContent(content: string): Node[] {
		// First validate the content for proper marker structure
		validateMarkers(content);

		// Initialize state for parsing
		const nodes: Node[] = [];
		let currentPosition = 0;
		let currentLine = 1;

		// Split content into manageable chunks while preserving whitespace
		const chunks = tokenizeContent(content);

		chunks.forEach((chunk) => {
			if (isMarker(chunk)) {
				// Handle special markers (corrections, deletions, etc.)
				const node = parseMarker(chunk, currentPosition, currentLine);
				nodes.push(node);
				currentPosition += chunk.length;
			} else {
				// Handle regular text, including punctuation and spacing
				const textNodes = parseText(chunk, currentPosition, currentLine);
				nodes.push(...textNodes);
				currentPosition += chunk.length;
			}

			// Update line count if needed
			if (chunk.includes('\n')) {
				currentLine += chunk.split('\n').length - 1;
			}
		});

		return nodes;
	}

	// Validates proper nesting and closing of correction markers
	function validateMarkers(text: string): void {
		const stack: string[] = [];
		let inMarker = false;

		for (let i = 0; i < text.length; i++) {
			if (text.slice(i, i + 2) === '{{') {
				if (inMarker) {
					throw new Error('Nested markers are not allowed');
				}
				inMarker = true;
				stack.push('{{');
				i++;
			} else if (text.slice(i, i + 2) === '}}') {
				if (!inMarker) {
					throw new Error('Unexpected closing marker');
				}
				inMarker = false;
				stack.pop();
				i++;
			}
		}

		if (stack.length > 0) {
			throw new Error('Unclosed markers detected');
		}
	}

	// Parses correction markers into structured node data
	function parseMarker(marker: string, position: number, line: number): Node {
		// Extract marker content between {{ and }}
		const content = marker.slice(2, -2);
		const [type, ...parts] = content.split(':');

		switch (type) {
			case 'cor':
				return createCorrectionNode(parts, position, line);
			case 'del':
				return createDeletionNode(parts, position, line);
			case 'add':
				return createAdditionNode(parts, position, line);
			default:
				throw new Error(`Unknown marker type: ${type}`);
		}
	}

	// Creates a correction node from marker parts
	function createCorrectionNode(parts: string[], position: number, line: number): Node {
		const [pattern, originalText, correctedText] = parts;

		return {
			id: crypto.randomUUID(),
			type: 'correction',
			text: originalText,
			correctionData: {
				originalText,
				correctedText,
				pattern,
				explanation: '' // Can be filled in later
			},
			metadata: {
				position,
				lineNumber: line,
				isPunctuation: isPunctuationMark(originalText),
				isWhitespace: false,
				startIndex: position,
				endIndex: position + originalText.length
			}
		};
	}

	return {
		parseContent,
		validateMarkers,
		parseMarker
	};
}

// utils/tokenizer.ts
export function createTokenizer() {
	function tokenizeContent(text: string): string[] {
		const tokens: string[] = [];
		let currentToken = '';
		let inMarker = false;

		for (let i = 0; i < text.length; i++) {
			if (text.slice(i, i + 2) === '{{') {
				// If we have accumulated any text, save it
				if (currentToken) {
					tokens.push(currentToken);
					currentToken = '';
				}
				inMarker = true;
				currentToken = '{{';
				i++;
			} else if (text.slice(i, i + 2) === '}}') {
				inMarker = false;
				currentToken += '}}';
				tokens.push(currentToken);
				currentToken = '';
				i++;
			} else {
				// If we're in a marker, accumulate everything
				// If not, split on whitespace and punctuation
				if (inMarker) {
					currentToken += text[i];
				} else {
					if (isPunctuationOrWhitespace(text[i])) {
						if (currentToken) {
							tokens.push(currentToken);
							currentToken = '';
						}
						tokens.push(text[i]);
					} else {
						currentToken += text[i];
					}
				}
			}
		}

		// Don't forget any remaining token
		if (currentToken) {
			tokens.push(currentToken);
		}

		return tokens;
	}

	return {
		tokenizeContent
	};
}
```

## User Interaction Flow

### Node Manipulation

The text editor supports several ways to manipulate nodes:

#### Mouse Controls

1. **Basic Selection**

   - Single Click: start editing a node

2. **Correction Actions**
   - Ctrl + Left Click: Insert empty node after selection
   - Alt + Left Click: Toggle deletion state
   - Ctrl + Right Click: Remove node
3. **Correction Flow**
   When editing a node:
   - Type new text and press Enter or click outside the modal to create correction

#### Keyboard Navigation

1. **Movement**

   - Tab: Move to next node
   - Shift + Tab: Move to previous node
   - Arrow keys: Navigate between nodes

2. **Editing**

   - Enter: Start editing selected node
   - Escape: Cancel editing
   - Ctrl + Z: Undo last change
   - Ctrl + Y: Redo last undone change

3. **Special Functions**
   - Ctrl + S: Save document
   - Ctrl + P: Print view
   - Alt + H: Toggle help overlay

### Correction Workflow

1. **Pattern Selection**
   After creating a correction:

   - Pattern selector opens automatically
   - Navigate categories with arrow keys
   - Quick search with keyboard
   - Recent patterns shown first
   - Custom patterns can be created

2. **Adding Explanations**
   Teachers can:
   - Add custom explanations
   - Select from pattern examples
   - Use AI-suggested explanations
   - Save explanations as templates

### Document Management

1. **Auto-saving**

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

2. **Version History**

   - All changes tracked in undo/redo stack
   - Document versions saved periodically
   - Restoration points available
   - Change summary for each version

3. **Export Options**
   - Clean print version
   - Annotated version with corrections
   - Statistical summary
   - Progress report

## Implementation Priorities

### Phase 1: Core Editor

1. Basic node management

   - Text parsing and tokenization
   - Node creation and editing
   - Basic correction types

2. Essential UI
   - TextEditor component
   - TextNode component
   - Basic keyboard controls
   - Simple pattern selection

### Phase 2: Enhanced Features

1. Advanced corrections

   - Pattern system
   - Explanation templates
   - Multi-node operations

2. User experience
   - Keyboard shortcuts
   - Context menus
   - Visual feedback
   - Help system

### Phase 3: Integration

1. Document management

   - Auto-save
   - Version control
   - Export options

2. Analytics
   - Error patterns
   - Progress tracking
   - Usage statistics

### Phase 4: Optimization

1. Performance

   - Large document handling
   - Lazy loading
   - Batch operations

2. Advanced features
   - AI integration
   - Template system

## Future Considerations

1. **AI Enhancement**

   - Pattern suggestion
   - Automatic error detection
   - Explanation generation
   - Learning from correctionsz

2. **Collaboration**

   - Multiple teacher access
   - Comment system
   - Review workflow
   - Change tracking

3. **Analytics**

   - Student progress tracking
   - Pattern effectiveness
   - Learning analytics
   - Report generation

4. **Integration**
   - LMS integration
   - API access
   - Export formats
   - Mobile support

```

```
