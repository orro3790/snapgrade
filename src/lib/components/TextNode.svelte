<!-- TextNode.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import { hoveredNodeTypeStore } from '$lib/stores/statsStore';
	import type { Node } from '$lib/schemas/textNode';
	import EditModal from './EditModal.svelte';

	const { node, isActive = false } = $props<{
		node: Node;
		isActive?: boolean;
	}>();

	let isEditing = $state(false);
	let modalPosition = $state({ x: 0, y: 0 });

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
				editorStore.updateNode(node.id, node.text);
			} else {
				editorStore.updateNode(node.id, node.text);
			}
			return;
		}

		// Handle normal clicks on deletion nodes: Restore to normal
		if (node.type === 'deletion') {
			editorStore.updateNode(node.id, node.text);
			return;
		}

		// Handle active node clicks: Enable editing
		editorStore.setActiveNode(node.id);
		if (isActive) {
			modalPosition = {
				x: event.clientX,
				y: event.clientY
			};
			isEditing = true;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === '`' && !isEditing) {
			event.preventDefault();
			editorStore.updateNode(node.id, node.text);
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
	}

	let classList = $derived(
		[
			'text-node',
			node.type,
			isActive ? 'active' : '',
			node.hasNextCorrection ? 'has-next-correction' : '',
			isEditing ? 'highlighted' : '',
			node.metadata.isPunctuation ? 'punctuation' : '',
			$hoveredNodeTypeStore === node.type ? `highlight-${node.type}` : ''
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
	data-subtype={node.type === 'spacer' ? node.spacerData?.subtype : undefined}
>
	{#if node.type === 'correction' && node.correctionData}
		<div class="correction-wrapper">
			<div class="correction-text">{node.correctionData.correctedText}</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'deletion'}
		<div class="text-content deleted">{node.text}</div>
	{:else if node.type === 'empty'}
		<div class="text-content">+</div>
	{:else if node.type === 'spacer'}
		<div class="spacer-content"></div>
	{:else}
		<div class="text-content">{node.text}</div>
	{/if}
</div>

{#if isEditing}
	<EditModal {node} position={modalPosition} onClose={handleEditClose} />
{/if}

<style>
	/* Spacer node styles */
	.text-node[data-subtype='tab'] {
		width: 2vw;
		min-width: 2vw;
		border: none;
	}

	.text-node[data-subtype='newline'] {
		width: 100%;
		height: var(--font-size-base);
		border: none;
	}

	.text-node[data-subtype='list'] {
		width: 3vw;
		min-width: 3vw;
		border: none;
	}

	.text-node[data-subtype='nestedlist'] {
		width: 5vw;
		min-width: 5vw;
		border: none;
	}

	.spacer-content {
		width: 100%;
		height: 100%;
	}

	/* Base text node styling */
	.text-node {
		display: flex;
		position: relative;
		cursor: pointer;
		margin-right: var(--spacing-1);
		border-radius: var(--radius-sm);
		transition: var(--transition-all);
		min-width: var(--font-size-base);
	}

	.text-node.correction {
		border-bottom: var(--border-width-medium) dotted var(--text-error-hover);
		/* Shift down by border width to maintain alignment */
		transform: translateY(var(--border-width-medium));
	}

	/* Punctuation nodes */
	.punctuation {
		border: none;
		border-radius: 0;
		display: flex;
		justify-content: center;
	}

	/* Interactive states */
	.text-node:hover {
		background-color: var(--interactive-hover);
	}

	.text-node.active {
		background-color: var(--interactive-active);
	}

	/* Correction styling */
	.correction-wrapper {
		display: flex;
		flex-direction: column;
		min-width: max-content;
	}

	.correction-text {
		color: var(--text-accent);
		font-weight: var(--font-weight-bold);
		white-space: nowrap;
		min-width: max-content;
		margin-bottom: -0.5em; /* Pull text closer to base text */
	}

	.text-content {
		display: flex;
		align-items: end;
	}

	/* Deleted text */
	.deleted {
		color: var(--text-error);
		opacity: 0.75;
		position: relative;
		min-width: min-content;
	}
	.deleted::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(100%, 1.75em);
		height: var(--border-width-thin);
		border: 1px solid var(--text-error); /* Use border instead of background */
		transform: translate(-50%, 0) rotate(135deg);
		transform-origin: center;
	}

	.punctuation .deleted::before {
		width: 1.75em;
		left: 0%;
	}

	/* Added text */
	.addition {
		color: var(--background-modifier-success);
	}

	/* Empty node */
	.empty {
		width: 2em;
		border: var(--border-width-medium) dotted var(--interactive-success);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--interactive-success);
	}
</style>
