<!-- file: src/lib/components/TextEditor.svelte -->
<script lang="ts">
	import { editorStore, EditorMode } from '$lib/stores/editorStore.svelte';
	import { sidebarStore } from '$lib/stores/sidebarStore.svelte';
	import TextNode from './TextNode.svelte';

	// Props and state
	const {
		initialContent = '',
		compressedNodes = null,
	} = $props<{
		initialContent?: string;
		compressedNodes?: string | null;
		onContentChange?: (content: string) => void;
	}>();

	// Derive state from store
	let nodes = $derived(editorStore.nodes);
	let activeNodeId = $derived(editorStore.activeNode);
	let editorContent = $derived(editorStore.getContent());
	let currentMode = $derived(editorStore.mode);

	// Initialize content from props or localStorage
	$effect(() => {
		if (!editorContent) {
			// First check props
			if (compressedNodes) {
				editorStore.loadCompressedContent(compressedNodes);
			} else if (initialContent) {
				editorStore.parseContent(initialContent);
			}
			// Then check localStorage if no content was loaded from props
			else {
				// Check for saved document in localStorage
				const useCompressed = localStorage.getItem('snapgrade_editor_use_compressed');
				const editorData = localStorage.getItem('snapgrade_editor_data');
				
				if (editorData) {
					const parsedData = JSON.parse(editorData);
					
					// Set editor mode if saved
					if (parsedData.mode) {
						editorStore.mode = parsedData.mode;
					}
					
					// Load content based on storage type
					if (useCompressed === 'true') {
						const savedNodes = localStorage.getItem('snapgrade_editor_compressed_nodes');
						if (savedNodes) {
							// First set document name
							editorStore.setDocument('', parsedData.documentName || 'Saved Document');
							// Then load compressed nodes
							editorStore.loadCompressedContent(savedNodes);
						}
					} else {
						const rawContent = localStorage.getItem('snapgrade_editor_raw_content');
						if (rawContent) {
							editorStore.setDocument(rawContent, parsedData.documentName || 'Saved Document');
						}
					}
				}
			}
		}
	});

	// Handle keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		// Undo: Ctrl+Z
		if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
			event.preventDefault();
			editorStore.undo();
		}
		// Redo: Ctrl+Y
		else if (event.ctrlKey && event.key === 'y') {
			event.preventDefault();
			editorStore.redo();
		}
		// Toggle Mode: Ctrl+M
		else if (event.ctrlKey && event.key === 'm') {
			event.preventDefault();
			editorStore.toggleMode();
		}
	}
</script>

<div
	class="editor-wrapper"
	onkeydown={handleKeyDown}
	onclick={(event) => {
		// Clear selection when clicking on background areas
		const target = event.target as HTMLElement;
		if (
			target.classList.contains('editor-wrapper') ||
			target.classList.contains('a4-content') ||
			target.classList.contains('main-content')
		) {
			// Always clear selection regardless of mode
			editorStore.clearSelection();
		}
	}}
	tabindex="-1"
	aria-multiline="true"
	aria-label="Text editor content"
	role="textbox"
>
	<div class="main-content" class:sidebar-expanded={sidebarStore.state.state === 'expanded'}>
		<div class="a4-content" role="complementary" aria-label="Preview">
			<div class="content-wrapper">
				{#each nodes as node (node.id)}
					<TextNode {node} isActive={node.id === activeNodeId} />
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	/* Base layout */
	.editor-wrapper {
		width: 100%;
		min-height: 100vh;
		display: flex;
		background-color: var(--background-secondary);
	}

	.main-content {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: var(--spacing-4);
		gap: var(--spacing-4);
	}

	.content-wrapper {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		width: 100%;
	}

	/* Preview section */
	.a4-content {
		background-color: var(--background-primary);
		width: 210mm; /* A4 width */
		min-height: 297mm; /* A4 height */
		padding: 20mm; /* A4 margins */
		box-shadow: var(--shadow-lg);
		border-radius: var(--radius-lg);
		color: var(--text-normal);
		font-size: var(--font-size-base);
	}

	/* Print styles */
	@media print {
		.editor-wrapper {
			background-color: transparent;
		}

		.main-content {
			padding: 0;
			gap: 0;
		}

		.a4-content {
			margin: 0;
			padding: 20mm;
			box-shadow: none;
			border-radius: 0;
		}
	}
</style>
