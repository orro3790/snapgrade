<!-- TextNode.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import type { Node as TextNodeType } from '$lib/schemas/textNode';
	import { hoveredNodeTypeStore, statsStore } from '$lib/stores/statsStore.svelte';
	import EditModal from './EditModal.svelte';
	import { EditorCommands } from '$lib/commands/editorCommands.svelte';

	const { node, isActive = false } = $props<{
		node: TextNodeType;
		isActive?: boolean;
	}>();

	let isEditing = $state(false);
	let modalPosition = $state({ x: 0, y: 0 });

	/**
	 * Handles the context menu event (right click) on a text node.
	 * - Ctrl + Right Click: Removes selected node(s)
	 * @param {MouseEvent} event - The context menu event
	 * @returns {boolean} False to prevent default context menu
	 */
	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();

		if (event.ctrlKey) {
			if (editorStore.isNodeInGroupSelection(node.id)) {
				editorStore.removeNodes(editorStore.groupSelect.selectedNodeIds);
			} else {
				editorStore.removeNode(node.id);
			}
			return false;
		}
	}

	/**
	 * Handles click events on the text node.
	 * - Left Click: Activates node or opens edit modal
	 * - Alt + Left Click: Toggles deletion state
	 * - Ctrl + Left Click: Inserts empty node
	 * @param {MouseEvent} event - The click event
	 */
	function handleClick(event: MouseEvent) {
		if (event.button !== 0) return;

		if (event.altKey) {
			if (editorStore.isNodeInGroupSelection(node.id)) {
				EditorCommands.GROUP_DELETE.execute(editorStore.groupSelect.selectedNodeIds);
			} else if (EditorCommands.DELETE.canExecute(node.id)) {
				EditorCommands.DELETE.execute(node.id);
			}
			return;
		}

		if (editorStore.isNodeInGroupSelection(node.id)) {
			modalPosition = {
				x: event.clientX,
				y: event.clientY
			};
			isEditing = true;
			return;
		}

		editorStore.clearGroupSelection();
		editorStore.clearSelection();
		editorStore.activeNode = node.id;

		if (event.ctrlKey) {
			editorStore.insertNodeAfter(node.id, '', 'empty');
			return;
		}

		if (isActive) {
			modalPosition = {
				x: event.clientX,
				y: event.clientY
			};
			isEditing = true;
		}
	}

	/**
	 * Handles keyboard events on the text node.
	 * - ` (backtick): Updates node(s) text
	 * - Enter: Opens edit modal
	 * - Ctrl + Enter: Inserts empty node
	 * - Ctrl + Delete: Removes node(s)
	 * @param {KeyboardEvent} event - The keyboard event
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === '`' && !isEditing) {
			event.preventDefault();
			if (editorStore.isNodeInGroupSelection(node.id)) {
				editorStore.groupSelect.selectedNodeIds.forEach((id) => {
					editorStore.updateNode(id, editorStore.nodes.find((n) => n.id === id)?.text || '');
				});
			} else {
				editorStore.updateNode(node.id, node.text);
			}
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
			if (editorStore.isNodeInGroupSelection(node.id)) {
				editorStore.removeNodes(editorStore.groupSelect.selectedNodeIds);
			} else {
				editorStore.removeNode(node.id);
			}
		}
	}

	/**
	 * Closes the edit modal and clears the active node state
	 */
	function handleEditClose() {
		isEditing = false;
		editorStore.activeNode = null;
	}

	let isGroupSelected = $derived(editorStore.isNodeInGroupSelection(node.id));

	let classList = $derived(
		[
			'text-node',
			node.type,
			isActive ? 'active' : '',
			node.hasNextCorrection ? 'has-next-correction' : '',
			isEditing ? 'highlighted' : '',
			node.metadata.isPunctuation ? 'punctuation' : '',
			$hoveredNodeTypeStore === node.type ? `highlight-${node.type}` : '',
			isGroupSelected ? 'group-selected' : ''
		]
			.filter(Boolean)
			.join(' ')
	);

	/**
	 * Initiates drag selection on mouse down.
	 * @param {MouseEvent} event - The mouse down event
	 */
	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;
		editorStore.startDragSelection(node.id);
	}

	/**
	 * Updates drag selection as mouse moves over nodes.
	 * @param {MouseEvent} event - The mouse move event
	 */
	function handleMouseMove(event: MouseEvent) {
		if (editorStore.dragSelect.isDragging) {
			editorStore.updateDragSelection(node.id);
		}
	}

	/**
	 * Finalizes drag selection on mouse up.
	 * @param {MouseEvent} event - The mouse up event
	 */
	function handleMouseUp(event: MouseEvent) {
		if (!editorStore.dragSelect.isDragging) return;
		editorStore.endDragSelection();
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
	.group-selected {
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
