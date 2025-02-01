<!-- file: src/lib/components/TextNode.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import { hoveredNodeType } from '$lib/stores/statsStore';
	import EditModal from './EditModal.svelte';

	const { node, isActive = false } = $props<{
		node: {
			id: string;
			text: string;
			type: 'normal' | 'deletion' | 'addition' | 'correction' | 'empty';
			correctionText?: string;
			hasNextCorrection?: boolean;
			isPunctuation?: boolean;
			mispunctuation?: boolean;
		};
		isActive?: boolean;
	}>();

	let isEditing = $state(false);
	let isSaved = $state(false);

	// Prevent context menu on right-click
	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		if (event.ctrlKey) {
			editorStore.removeNode(node.id);
		}
	}

	// Handle node click events
	function handleClick(event: MouseEvent) {
		// Handle CTRL + Click for inserting empty node
		if (event.ctrlKey && !event.button) {
			editorStore.insertNodeAfter(node.id, '', 'empty');
			return;
		}

		// Handle ALT + Click for toggle deletion
		if (event.altKey && !event.button) {
			if (node.type === 'deletion') {
				editorStore.updateNode(node.id, node.text, undefined, 'normal');
			} else {
				editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			}
			return;
		}

		// For deletion nodes, revert to normal on click
		if (node.type === 'deletion') {
			editorStore.updateNode(node.id, node.text, undefined, 'normal');
			return;
		}

		editorStore.setActiveNode(node.id);
		if (isActive) {
			isEditing = true;
		}
	}

	// Function to show save flash effect
	function showSaveEffect() {
		isSaved = true;
		setTimeout(() => {
			isSaved = false;
		}, 300);
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Handle backtick (`) for deletion
		if (event.key === '`' && !isEditing) {
			event.preventDefault();
			editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			return;
		}

		// Handle Enter for editing
		if (event.key === 'Enter') {
			if (event.ctrlKey) {
				handleClick(new MouseEvent('click', { ctrlKey: true }));
			} else {
				isEditing = true;
			}
		}

		// Handle Delete with Ctrl for node removal
		if (event.key === 'Delete' && event.ctrlKey) {
			editorStore.removeNode(node.id);
		}
	}

	// Handle edit modal close
	function handleEditClose() {
		isEditing = false;
		editorStore.setActiveNode(null);
		showSaveEffect();
	}

	// Compute classes based on node type and state
	let classList = $derived(
		[
			'text-node',
			node.type,
			isActive ? 'active' : '',
			node.hasNextCorrection ? 'has-next-correction' : '',
			isEditing ? 'highlighted' : '',
			node.isPunctuation ? 'punctuation' : '',
			isSaved ? 'saved-flash' : '',
			$hoveredNodeType === node.type ? `highlight-${node.type}` : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<span
	class={classList}
	onclick={handleClick}
	oncontextmenu={handleContextMenu}
	onkeydown={handleKeydown}
	role="button"
	tabindex="0"
>
	{#if node.type === 'correction'}
		<span class="correction-text">{node.correctionText}</span>
		<span class="underlined">{node.text}</span>
	{:else if node.type === 'deletion'}
		<span class="deleted">{node.text}</span>
	{:else if node.type === 'addition'}
		<span class="added">{node.text}</span>
	{:else if node.type === 'empty'}
		<span class="empty-placeholder">+</span>
	{:else}
		{node.text || ''}
	{/if}
</span>

{#if isEditing}
	<EditModal {node} onClose={handleEditClose} />
{/if}

<style>
	/* Base container styling */
	.text-node {
		display: inline-flex;
		align-items: center;
		position: relative;
		min-height: 2em;
		margin: 0.5em 0.1em;
		cursor: pointer;
		padding: 0.1em 0.2em;
		border-radius: 0.2em;
		transition: all 0.2s ease;
		border: 2px dotted var(--interactive-normal);
		vertical-align: middle;
	}

	/* Specific node type styling */
	.text-node.correction,
	.text-node.deletion,
	.text-node.addition {
		border: 2px solid var(--background-secondary);
	}

	/* Punctuation styling */
	.punctuation {
		min-width: 1em;
		min-height: 1em;
		border: none;
		border-radius: 0;
		border-bottom: 2px dotted var(--text-accent);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	/* Interactive states */
	.text-node:hover {
		background-color: var(--interactive-hover);
	}

	.text-node.active {
		background-color: var(--interactive-active);
	}

	.text-node.highlighted {
		border: 2px dotted var(--interactive-highlight);
		z-index: 1;
	}

	/* Save flash effect */
	.saved-flash {
		animation: saveFlash 0.3s ease-out;
	}

	@keyframes saveFlash {
		0% {
			background-color: var(--interactive-highlight);
		}
		100% {
			background-color: transparent;
		}
	}

	/* Correction styling */
	.correction-text {
		position: absolute;
		top: -16px;
		left: 4px;
		color: var(--text-accent);
		font-weight: bold;
		white-space: nowrap;
		padding: 0 4px;
		z-index: 2;
	}

	/* Stack corrections when they're adjacent */
	.has-next-correction .correction-text {
		top: -32px; /* Double the offset for adjacent corrections */
	}

	.underlined {
		border-bottom: 1px dashed var(--text-error);
		opacity: 0.7;
		position: relative; /* Ensure proper stacking context */
	}

	/* Highlight states for stats hover */
	.text-node.highlight-correction,
	.text-node.highlight-deletion,
	.text-node.highlight-addition,
	.text-node.highlight-normal {
		border: 2px solid var(--text-accent);
		transition: border-color 0.2s ease;
	}

	/* Deletion and addition styling */
	.deleted {
		color: var(--text-error);
		opacity: 0.75;
		position: relative;
	}

	.deleted::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(100%, 1.75em); /* Limit width to either 100% of text or 2em */
		height: 1px;
		background: var(--text-error);
		transform: translate(-50%, 0) rotate(135deg);
		transform-origin: center;
	}

	/* Special handling for punctuation marks */
	.punctuation .deleted::before {
		width: 1.75em; /* Fixed width for punctuation */
		left: 0%; /* Slightly adjusted position for better visual alignment */
	}

	.added {
		color: var(--background-modifier-success);
		font-weight: bold;
	}

	.has-next-correction {
		margin-right: 1em;
	}

	/* Print styles */
	/* Empty node styling */
	.empty {
		min-width: 1.5em;
		border: 2px dotted var(--interactive-normal);
		display: inline-flex;
		justify-content: center;
		align-items: center;
	}

	.empty-placeholder {
		color: var(--text-muted);
		font-size: 1.2em;
		font-weight: bold;
	}

	@media print {
		* {
			color: #000000 !important;
		}

		.text-node {
			margin: 0;
			padding: 0;
			border: none;
		}
	}
</style>
