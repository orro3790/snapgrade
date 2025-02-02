<!-- TextNode.svelte -->
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

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		// Check specifically for right click (button === 2) with ctrl key
		if (event.ctrlKey && event.button === 2) {
			// Remove the node and ensure proper cleanup
			editorStore.removeNode(node.id);
			// Force a re-render of the parent component
			return false;
		}
	}

	function handleClick(event: MouseEvent) {
		// Guard clause for non-left clicks
		if (event.button !== 0) return;

		// Handle Ctrl + Left Click: Insert empty node
		if (event.ctrlKey) {
			editorStore.insertNodeAfter(node.id, '', 'empty');
			return;
		}

		// Handle Alt + Left Click: Toggle deletion state
		if (event.altKey) {
			if (node.type === 'empty') return;

			if (node.type === 'deletion') {
				editorStore.updateNode(node.id, node.text, undefined, 'normal');
			} else {
				editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			}
			return;
		}

		// Handle normal clicks on deletion nodes: Restore to normal
		if (node.type === 'deletion') {
			editorStore.updateNode(node.id, node.text, undefined, 'normal');
			return;
		}

		// Handle active node clicks: Enable editing
		editorStore.setActiveNode(node.id);
		if (isActive) {
			isEditing = true;
		}
	}
	function showSaveEffect() {
		isSaved = true;
		setTimeout(() => {
			isSaved = false;
		}, 300);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === '`' && !isEditing) {
			event.preventDefault();
			editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			return;
		}

		if (event.key === 'Enter') {
			if (event.ctrlKey) {
				handleClick(new MouseEvent('click', { ctrlKey: true }));
			} else {
				isEditing = true;
			}
		}

		if (event.key === 'Delete' && event.ctrlKey) {
			editorStore.removeNode(node.id);
		}
	}

	function handleEditClose() {
		isEditing = false;
		editorStore.setActiveNode(null);
		showSaveEffect();
	}

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

<div
	class={classList}
	onclick={handleClick}
	oncontextmenu={handleContextMenu}
	onkeydown={handleKeydown}
	role="button"
	tabindex="0"
>
	{#if node.type === 'correction'}
		<div class="correction-wrapper">
			<div class="correction-text">{node.correctionText}</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'deletion'}
		<div class="text-content deleted">{node.text}</div>
	{:else if node.type === 'empty'}
		<div class="text-content">+</div>
	{:else}
		<div class="text-content">{node.text}</div>
	{/if}
</div>

{#if isEditing}
	<EditModal {node} onClose={handleEditClose} />
{/if}

<style>
	/* Base text node styling - applies to all node types */
	.text-node {
		/* Use flexbox for better content alignment */
		display: flex;
		position: relative;
		cursor: pointer;

		/* Consistent padding for all nodes */
		padding: 0 0.25em 0 0.25em;
		border-radius: 0.2em;

		/* Smooth transitions for hover/active states */
		transition: all 0.2s ease;

		/* Default border style */
		border: 2px dotted var(--interactive-normal);

		/* Establish minimum dimensions */

		min-width: 1em;
	}

	/* Special node types (deletion, addition) get solid borders */
	.text-node.deletion,
	.text-node.addition {
		border: 2px solid var(--background-secondary);
	}

	.text-node.correction {
		border: 2px solid var(--background-secondary);
		border-bottom: 2px dotted var(--text-error-hover);
	}

	/* Punctuation nodes get special treatment */
	.punctuation {
		min-width: 1.5em;
		border: none;
		border-radius: 0;

		/* We can style bottom border to help distinguish between commas and periods if helpful */
		/* border-bottom: 2px dotted var(--interactive-accent); */

		/* Center punctuation marks */
		display: flex;
		justify-content: center;
	}

	/* Hover state for all nodes */
	.text-node:hover {
		background-color: var(--interactive-hover);
	}

	/* Active (selected) node state */
	.text-node.active {
		background-color: var(--interactive-active);
	}

	/* Currently editing node state */
	.text-node.highlighted {
		border: 2px dotted var(--interactive-highlight);
		z-index: 1; /* Ensure highlighted node appears above others */
	}

	/* Animation for save confirmation */
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

	/* Correction node specific styling */
	.correction-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		min-width: max-content;
		justify-content: center;
	}

	.correction-text {
		color: var(--text-accent);
		font-weight: bold;
		white-space: nowrap;
		min-width: max-content;
	}

	/* Base text content styling */
	.text-content {
		display: flex;
		align-items: end;
	}

	/* Highlight states for different node types */
	.text-node.highlight-correction,
	.text-node.highlight-deletion,
	.text-node.highlight-addition,
	.text-node.highlight-normal {
		border: 2px solid var(--text-accent);
		transition: border-color 0.2s ease;
	}

	/* Deleted text styling */
	.deleted {
		color: var(--text-error);
		opacity: 0.75;
		position: relative;
		min-width: min-content;
	}

	/* Strikethrough line for deleted text */
	.deleted::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(100%, 1.75em);
		height: 1px;
		background: var(--text-error);
		transform: translate(-50%, 0) rotate(135deg);
		transform-origin: center;
	}

	/* Special case for punctuation deletion */
	.punctuation .deleted::before {
		width: 1.75em;
		left: 0%;
	}

	/* Added text styling */
	.addition {
		color: var(--background-modifier-success);
	}

	/* Empty node styling */
	.empty {
		width: 2em;
		border: 2px dotted var(--interactive-success);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--interactive-success);
	}

	/* Print-specific styles */
	@media print {
		* {
			color: #000000 !important;
		}
	}
</style>
