<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import type { Node as TextNodeType } from '$lib/schemas/textNode';
	import { hoveredNodeTypeStore, statsStore } from '$lib/stores/statsStore.svelte';
	import EditModal from './EditModal.svelte';
	import FormattingModal from './FormattingModal.svelte';
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
	{:else if node.type === 'spacer' && node.spacerData?.subtype === 'lineBreak'}
		<div class="spacer-content line-break-spacer">&nbsp;</div>
	{:else if node.type === 'spacer' && node.spacerData?.subtype === 'indent'}
		<div class="spacer-content indent-spacer">&nbsp;</div>
	{:else if node.type === 'spacer' && node.spacerData?.subtype === 'alignment'}
		<div class="spacer-content alignment-spacer">&nbsp;</div>
	{:else if node.type === 'spacer'}
		<div class="spacer-content">&nbsp;</div>
	{:else if node.type === 'heading'}
		<div class="text-content heading">{node.text}</div>
	{:else if node.type === 'list'}
		<div class="text-content list-item">• {node.text}</div>
	{:else}
		<div class="text-content">{node.text}</div>
	{/if}
</div>

{#if isEditing}
	{#if editorStore.mode === 'formatting'}
		<FormattingModal {node} position={modalPosition} onClose={handleEditClose} />
	{:else}
		<EditModal {node} position={modalPosition} onClose={handleEditClose} />
	{/if}
{/if}

<style>
	/* Selection styling */
	.group-selected {
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	/* Spacer node styles */
	/* Line break spacer - fills entire row */
	.text-node[data-subtype='lineBreak'] {
		width: 100%;
		height: var(--font-size-base);
		border: none;
		display: block;
		flex-basis: 100%; /* Force line break in flex container */
	}

	/* Indent spacer - fixed width for indentation */
	.text-node[data-subtype='indent'] {
		width: 2em;
		min-width: 2em;
		border: none;
	}

	/* Alignment spacer - flexible width for text alignment */
	.text-node[data-subtype='alignment'] {
		flex: 1;
		min-width: 0;
		border: none;
	}

	.spacer-content {
		width: 100%;
		height: 100%;
	}
	
	.line-break-spacer {
		display: block;
		width: 100%;
		height: 1.5em;
		margin-bottom: var(--spacing-2);
		flex-basis: 100%; /* Force line break in flex container */
	}
	
	.indent-spacer {
		display: inline-block;
		width: 2em;
		min-width: 2em;
	}
	
	.alignment-spacer {
		display: inline-block;
		flex: 1;
	}
	
	/* Large spacing variant for line breaks */
	.text-node[data-subtype='lineBreak'][data-spacing='large'] {
		margin-bottom: var(--spacing-4); /* More spacing for section breaks */
	}

	/* Base text node styling */
	.text-node {
		display: flex;
		justify-content: center;
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

	/* Heading styling */
	.heading {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--text-accent);
	}

	/* List item styling */
	.list-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
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

