<!-- file: src/lib/components/TextEditor.svelte -->
<script lang="ts">
	import {
		editorStore,
		activeCorrection,
		paragraphs,
		selectedNodes
	} from '$lib/stores/editorStore';
	import { sidebarStore } from '$lib/stores/sidebarStore.svelte';
	import TextNode from './TextNode.svelte';

	// Props and state
	const { initialContent = '', onContentChange = (content: string) => {} } = $props<{
		initialContent?: string;
		onContentChange?: (content: string) => void;
	}>();

	// Subscribe to stores
	let paragraphsList = $derived($paragraphs);
	let activeNodeId = $derived($activeCorrection);
	let editorContent = $derived(editorStore.getContent());

	// Initialize content
	$effect(() => {
		if (initialContent && !editorContent) {
			editorStore.parseContent(initialContent);
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
	}
</script>

<div
	class="editor-wrapper"
	onkeydown={handleKeyDown}
	onclick={(event) => {
		// Only clear selection if clicking directly on the editor wrapper or a4-content
		const target = event.target as HTMLElement;
		if (
			target.classList.contains('editor-wrapper') ||
			target.classList.contains('a4-content') ||
			target.classList.contains('main-content')
		) {
			console.log('Clearing selection from click on:', target.className);
			editorStore.clearSelection();
		}
	}}
	tabindex="-1"
	aria-multiline="true"
	aria-label="Text editor content"
	role="textbox"
>
	<div class="main-content" class:sidebar-expanded={sidebarStore.state.state === 'expanded'}>
		<!-- Wrap the a4-content in a print-only container -->
		<div class="print-container">
			<div class="a4-content" role="complementary" aria-label="Preview">
				{#each paragraphsList as paragraph (paragraph.id)}
					<div class="paragraph">
						{#each paragraph.corrections as node (node.id)}
							<TextNode {node} isActive={node.id === activeNodeId} />
						{/each}
					</div>
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
		background-color: var(--background-primary);
	}

	.main-content {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		background-color: var(--background-secondary);
	}

	.paragraph {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
	}

	/* Preview section */
	.a4-content {
		background-color: var(--background-primary);
		width: 210mm; /* A4 width */
		min-height: 297mm; /* A4 height */
		padding: 20mm; /* A4 margins */
		box-shadow: var(--shadow-lg);
		border-radius: var(--radius-lg);
		margin: var(--spacing-8) auto;
		color: var(--text-normal);
		font-size: var(--font-size-base);
	}
</style>
