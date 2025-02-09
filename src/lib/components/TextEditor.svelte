<!-- file: src/lib/components/TextEditor.svelte -->
<script lang="ts">
	import { editorStore, activeCorrection, paragraphs } from '$lib/stores/editorStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';
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

	// Add inspections for key store values
	$inspect(editorContent).with((type, content) => {
		console.group('Editor Content Update');
		console.log(`Type: ${type}`);
		console.log('Content:', content);
		console.groupEnd();
	});

	$inspect(paragraphsList).with((type, paragraphs) => {
		console.group('Paragraphs Update');
		console.log(`Type: ${type}`);
		console.log('Paragraphs:', paragraphs);
		console.groupEnd();
	});

	// Add trace to effects to debug reactivity
	$effect(() => {
		$inspect.trace('Content Change Effect');
		if (editorContent !== initialContent) {
			onContentChange(editorContent);
		}
	});

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
	tabindex="-1"
	aria-multiline="true"
	aria-label="Text editor content"
	role="textbox"
>
	<div class="main-content" class:sidebar-expanded={$sidebarStore.state === 'expanded'}>
		<!-- Wrap the a4-content in a print-only container -->
		<div class="print-container">
			<div class="a4-content" role="complementary" aria-label="Preview">
				{#each paragraphsList as paragraph (paragraph.id)}
					<div class="paragraph-row">
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

	.paragraph-row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		min-height: var(--spacing-8); /* Ensures consistent height for empty rows */
		margin-bottom: var(--spacing-4); /* Space between paragraphs */
		gap: 0;
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
		line-height: var(--line-height-relaxed);
	}
</style>
