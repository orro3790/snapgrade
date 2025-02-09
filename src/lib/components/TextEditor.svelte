<!-- file: src/lib/components/TextEditor.svelte -->
<script lang="ts">
	import { editorStore, activeCorrection, paragraphs } from '$lib/stores/editorStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';
	import TextNode from './TextNode.svelte';
	import StatsDisplay from './StatsDisplay.svelte';

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
	<!-- <StatsDisplay /> -->
	<div class="main-content" class:sidebar-expanded={$sidebarStore.state === 'expanded'}>
		<!-- Preview/Print content -->
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
		gap: 0.5rem;
		align-items: end;
		min-height: 2rem; /* Ensures consistent height for empty rows */
		margin-bottom: 1rem; /* Space between paragraphs */
	}

	/* Preview section */
	.a4-content {
		background-color: var(--background-primary);
		width: 210mm; /* A4 width */
		min-height: 297mm; /* A4 height */
		padding: 20mm; /* A4 margins */
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		margin: 2rem auto;
		color: var(--text-normal);
		font-size: 12pt;
		line-height: 1.5;
	}

	/* Print styles */
	@media print {
		:global(*) {
			background-color: transparent !important;
			color: black !important;
			box-shadow: none !important;
		}

		/* Hide UI elements */
		:global(nav),
		:global(header),
		:global(footer),
		:global(.sidebar),
		:global(.stats-container),
		:global(.print-hide) {
			display: none !important;
		}

		/* Reset layout for printing */
		.editor-wrapper {
			min-height: 0;
			background: none;
			display: block !important;
			padding: 0 !important;
			margin: 0 !important;
		}

		.main-content {
			margin: 0 !important;
			padding: 0 !important;
			display: block !important;
			width: 100% !important;
		}

		.a4-content {
			width: 100% !important;
			min-height: 0;
			padding: 0 !important;
			box-shadow: none;
			margin: 0 !important;
			border-radius: 0;
		}

		.a4-content {
			color: black;
		}

		.paragraph-row {
			display: flex;
			gap: 0;
			margin-bottom: 1em;
		}

		@page {
			size: A4;
			margin: 20mm;
		}
	}
</style>
