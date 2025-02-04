<!-- file: src/lib/components/TextEditor.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';
	import TextNode from './TextNode.svelte';

	import StatsDisplay from './StatsDisplay.svelte';

	// Props and state
	const { initialContent = '', onContentChange = (content: string) => {} } = $props<{
		initialContent?: string;
		onContentChange?: (content: string) => void;
	}>();

	console.log('initialContent', initialContent);

	// Use derived values for reactive state
	let nodeList = $derived($editorStore.nodeList);
	let activeNodeId = $derived($editorStore.activeNodeId);
	let editorContent = $derived(editorStore.getContent());

	// Initialize content
	$effect(() => {
		if (initialContent && !editorContent) {
			editorStore.parseContent(initialContent);
		}
	});

	// Notify parent of changes (upon text loading), this allows parent to prevent back navigation on unsaved changes
	$effect(() => {
		if (editorContent !== initialContent) {
			onContentChange(editorContent);
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
	<StatsDisplay />
	<div class="main-content" class:sidebar-expanded={$sidebarStore.isOpen}>
		<!-- Preview/Print content -->
		<div class="preview-container" role="complementary" aria-label="Preview">
			<div class="a4-content">
				<div class="line-row">
					{#if nodeList.length > 0}
						{#each nodeList[0].nodes as node (node.id)}
							<TextNode {node} isActive={node.id === activeNodeId} />
						{/each}
					{/if}
				</div>
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
	}

	.line-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: end;
		min-height: 2rem; /* Ensures consistent height for empty rows */
	}

	/* Preview section */
	.preview-container {
		background-color: var(--background-secondary);
		width: 210mm; /* A4 width */
		min-height: 297mm; /* A4 height */
		padding: 20mm; /* A4 margins */
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		margin: 0 auto;
	}

	.a4-content {
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

		.preview-container {
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

		.line-row {
			display: flex;
			gap: 0;
		}

		@page {
			size: A4;
			margin: 20mm;
		}
	}
</style>
