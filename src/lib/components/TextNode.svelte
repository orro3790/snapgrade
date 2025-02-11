<!-- TextNode.svelte -->
<script lang="ts">
	import { editorStore, selectedNodes } from '$lib/stores/editorStore.svelte';
	import { hoveredNodeTypeStore } from '$lib/stores/statsStore.svelte';
	import type { Node } from '$lib/schemas/textNode';
	import EditModal from './EditModal.svelte';
	import Add from '$lib/icons/Add.svelte';

	const { node, isActive = false } = $props<{
		node: Node;
		isActive?: boolean;
	}>();

	let isEditing = $state(false);
	let modalPosition = $state({ x: 0, y: 0 });

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();

		// Get current selection state
		let dragState:
			| { isDragging: boolean; isSelected: boolean; startNodeId: string | null }
			| undefined;
		editorStore.dragSelect.subscribe((state) => {
			dragState = state;
		})();

		// Handle Ctrl + Right Click
		if (event.ctrlKey) {
			if (dragState?.isSelected) {
				// Remove all selected nodes
				let selectedNodeIds: string[] = [];
				selectedNodes.subscribe((nodes) => {
					selectedNodeIds = nodes.map((n) => n.id);
				})();
				editorStore.removeNodes(selectedNodeIds);
			} else {
				// Remove single node
				editorStore.removeNode(node.id);
			}
			return false;
		}
	}

	function handleClick(event: MouseEvent) {
		// Guard clause for non-left clicks
		if (event.button !== 0) return;

		// Get current selection state
		let dragState:
			| { isDragging: boolean; isSelected: boolean; startNodeId: string | null }
			| undefined;
		editorStore.dragSelect.subscribe((state) => {
			dragState = state;
		})();

		// If we have selected nodes, handle multi-node operations
		if (dragState?.isSelected) {
			if (event.altKey) {
				// Handle Alt + Left Click: Toggle deletion for selected nodes
				let selectedNodeIds: string[] = [];
				selectedNodes.subscribe((nodes) => {
					selectedNodeIds = nodes.map((n) => n.id);
				})();
				editorStore.toggleMultiNodeDeletion(selectedNodeIds);
				return;
			} else {
				// Regular click on a selected node: Open edit modal
				modalPosition = {
					x: event.clientX,
					y: event.clientY
				};
				isEditing = true;
				return;
			}
		}

		// Handle single node operations
		if (event.ctrlKey) {
			editorStore.insertNodeAfter(node.id, '', 'empty');
			return;
		}

		if (event.altKey) {
			if (node.type === 'empty' || node.type === 'spacer') return;
			editorStore.toggleDeletion(node.id);
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

	// Track if this node is currently selected
	let isSelected = $derived($selectedNodes.some((n) => n.id === node.id));

	let classList = $derived(
		[
			'text-node',
			node.type,
			isActive ? 'active' : '',
			node.hasNextCorrection ? 'has-next-correction' : '',
			isEditing ? 'highlighted' : '',
			node.metadata.isPunctuation ? 'punctuation' : '',
			$hoveredNodeTypeStore === node.type ? `highlight-${node.type}` : '',
			isSelected ? 'selected' : ''
		]
			.filter(Boolean)
			.join(' ')
	);

	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return; // Only handle left mouse button
		editorStore.startDragSelection(node.id);
	}

	type DragState = {
		isDragging: boolean;
		isSelected: boolean;
		startNodeId: string | null;
		endNodeId: string | null;
	};

	function handleMouseMove(event: MouseEvent) {
		// Update selection if we're dragging
		let dragState: DragState | undefined;
		editorStore.dragSelect.subscribe((state: DragState) => {
			dragState = state;
		})();

		if (dragState?.isDragging) {
			editorStore.updateDragSelection(node.id);
		}
	}

	function handleMouseUp(event: MouseEvent) {
		let dragState: DragState | undefined;
		editorStore.dragSelect.subscribe((state: DragState) => {
			dragState = state;
		})();

		if (!dragState?.isDragging) return;

		editorStore.endDragSelection();

		// Handle Alt + Click for deletion
		if (event.altKey) {
			// Get selected node IDs
			let selectedNodeIds: string[] = [];
			selectedNodes.subscribe((nodes) => {
				selectedNodeIds = nodes.map((n) => n.id);
			})();
			editorStore.toggleMultiNodeDeletion(selectedNodeIds);
		}
	}
</script>

<div
	class={classList}
	onclick={handleClick}
	oncontextmenu={handleContextMenu}
	onkeydown={handleKeydown}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
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
	/* Selection styling */
	.selected {
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

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
		user-select: none;
		margin-right: var(--spacing-1);
		border-radius: var(--radius-sm);
		transition: var(--transition-all);
		min-width: var(--font-size-base);
	}
	/* Add top margin except for corrections, this way, we can essentially have a consistent line-height */
	.text-node:not(.correction) {
		margin-top: var(--spacing-4);
	}

	.correction-wrapper .text-content {
		text-decoration: underline;
		text-decoration-style: solid;
		text-decoration-color: var(--text-error-hover);
		text-decoration-thickness: var(--border-width-medium);
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
		color: var(--text-success);
	}

	/* Empty node */
	.empty {
		display: flex;
		justify-content: center;
		color: var(--interactive-success);
		border: var(--border-width-thin) solid var(--text-success);
		background-color: var(--background-primary);
		width: var(--spacing-6);
		font-weight: var(--font-weight-bold);
	}
</style>
