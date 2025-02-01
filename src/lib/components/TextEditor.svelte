<!-- file: src/lib/components/TextEditor.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';
	import TextNode from './TextNode.svelte';
	import Sidebar from './Sidebar.svelte';
	import EditModal from './EditModal.svelte';
	import StatsDisplay from './StatsDisplay.svelte';
	import KeycapA from '$lib/icons/CtrlCap.svelte';
	import Mouse from '$lib/icons/Mouse.svelte';
	import PlusCap from '$lib/icons/PlusCap.svelte';

	// Props and state
	const { initialContent = '', onContentChange = (content: string) => {} } = $props<{
		initialContent?: string;
		onContentChange?: (content: string) => void;
	}>();

	// Use derived values for reactive state
	let paragraphs = $derived($editorStore.paragraphs);
	let activeNodeId = $derived($editorStore.activeNodeId);
	let editorContent = $derived(editorStore.getContent());

	// Initialize content
	$effect(() => {
		if (initialContent && !editorContent) {
			editorStore.parseContent(initialContent);
		}
	});

	// Notify parent of changes
	$effect(() => {
		if (editorContent !== initialContent) {
			onContentChange(editorContent);
		}
	});

	// Generate clean HTML for preview and printing
	function generatePrintableHTML(paragraphs: typeof $editorStore.paragraphs): string {
		return paragraphs
			.map((paragraph) => {
				const nodeHTML = paragraph.nodes
					.map((node) => {
						switch (node.type) {
							case 'deletion':
								return `<span class="deleted">${node.text}</span>`;
							case 'addition':
								return `<span class="added">${node.text}</span>`;
							case 'correction':
								const spacingClass = node.hasNextCorrection ? 'has-next-correction' : '';
								return `
					<span class="correction-container ${spacingClass}">
					  <span class="correction-text">${node.correctionText}</span>
					  <span class="underlined">${node.text}</span>
					</span>`;
							default:
								return node.text;
						}
					})
					.join(' ');
				return `<p>${nodeHTML}</p>`;
			})
			.join('\n');
	}

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

	// Print handling with proper A4 formatting
	function handlePrint() {
		const printContent = generatePrintableHTML(paragraphs);
		const printDiv = document.createElement('div');
		printDiv.className = 'print-only a4-content';
		printDiv.innerHTML = printContent;
		document.body.appendChild(printDiv);

		window.print();

		document.body.removeChild(printDiv);
	}

	// Track unsaved changes
	$effect(() => {
		const hasUnsavedChanges = editorStore.getContent() !== $editorStore.lastSavedContent;
		// You could implement auto-save or warning before navigation here
	});
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
	<div class="control-instructions">
		<div id="ctrl-left-click" class="command-row">
			<KeycapA />
			<PlusCap />
			<!-- <Mouse isLeftActive={true} /> -->
		</div>
		<div id="ctrl-right-click" class="command-row">
			<KeycapA />
			<PlusCap />
			<!-- <Mouse isRightActive={true} /> -->
		</div>
		<div id="click-to-edit" class="command-row">
			<KeycapA />
			<PlusCap />
			<!-- <Mouse isRightActive={true} /> -->
		</div>
	</div>
	<div class="main-content" class:sidebar-expanded={$sidebarStore.isOpen}>
		<!-- Preview/Print content -->
		<div class="preview-container" role="complementary" aria-label="Preview">
			<div class="a4-content">
				{#each paragraphs as paragraph (paragraph.id)}
					<div class="paragraph">
						{#each paragraph.nodes as node (node.id)}
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
	}

	.paragraph {
		margin-bottom: 1rem;
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

	.command-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	/* Print styles */
	@media print {
		:global(.print-only) {
			display: block !important;
		}

		.preview-container {
			width: 100%;
			min-height: 0;
			padding: 0;
			box-shadow: none;
		}

		@page {
			size: A4;
			margin: 20mm;
		}
	}
</style>
