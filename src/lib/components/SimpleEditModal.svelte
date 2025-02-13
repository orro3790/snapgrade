<!-- file: src/lib/components/SimpleEditModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import type { Node as TextNodeType } from '$lib/schemas/textNode';

	// Props
	const { node, position, onClose } = $props<{
		node: TextNodeType;
		position: { x: number; y: number };
		onClose: () => void;
	}>();

	// State
	let modalElement: HTMLDivElement;
	let inputElement: HTMLTextAreaElement;
	let text = $state(node.text);
	let isProcessingEdit = $state(false);

	// Handle keyboard events
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (event.ctrlKey) {
				handleAddAfter();
			} else {
				event.preventDefault();
				handleSave();
			}
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}

	// Handle text operations
	function handleSave() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		// Update node text
		editorStore.updateNode(node.id, text.trim());
		onClose();
	}

	function handleDelete() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		editorStore.removeNode(node.id);
		onClose();
	}

	function handleAddAfter() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		editorStore.insertNodeAfter(node.id, '', 'normal');
		onClose();
	}

	// Handle textarea height adjustment
	function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}

	function handleInput(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		adjustTextareaHeight(textarea);
	}

	// Position modal and focus input
	$effect(() => {
		if (!modalElement || !inputElement) return;

		// Position modal
		const rect = modalElement.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let x = position.x;
		let y = position.y;

		// Adjust position to keep modal in viewport
		if (x + rect.width > viewportWidth) {
			x = viewportWidth - rect.width - 10;
		}
		if (y + rect.height > viewportHeight) {
			y = viewportHeight - rect.height - 10;
		}

		modalElement.style.left = `${x}px`;
		modalElement.style.top = `${y}px`;

		// Focus and select text
		inputElement.focus();
		inputElement.select();
		adjustTextareaHeight(inputElement);
	});
</script>

<div class="modal-container" bind:this={modalElement} role="dialog" aria-label="Edit text">
	<textarea
		bind:this={inputElement}
		bind:value={text}
		onkeydown={handleKeyDown}
		oninput={handleInput}
		placeholder="Edit text..."
		rows="1"
		aria-label="Edit text input"
	></textarea>
	<div class="actions" role="toolbar" aria-label="Editing actions">
		<button onclick={handleDelete} type="button" title="Delete node"> Delete </button>
		<button onclick={handleAddAfter} type="button" title="Add node after"> Add After </button>
		<button onclick={handleSave} type="button" title="Save changes"> Save </button>
	</div>
</div>

<style>
	.modal-container {
		position: fixed;
		z-index: var(--z-20);
		background: var(--background-primary);
		border-radius: var(--radius-lg);
		width: min(280px, 90vw);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		outline: 1px solid var(--background-modifier-border);
	}

	textarea {
		width: 100%;
		background: var(--background-modifier-form);
		color: var(--text-normal);
		border: none;
		font-family: var(--font-family-base);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		resize: none;
		padding: var(--spacing-3);
		transition: var(--transition-all);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		min-height: calc(var(--line-height-relaxed) * 1em + var(--spacing-3) * 2);
	}

	textarea:focus {
		outline: none;
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--background-modifier-border);
	}

	button {
		display: grid;
		place-items: center;
		height: 40px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		transition: var(--transition-all);
	}

	button:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	/* Action-specific colors */
	button:first-child:hover {
		color: var(--text-error);
	}

	button:nth-child(2):hover {
		color: var(--background-modifier-success);
	}

	button:last-child:hover {
		color: var(--interactive-accent);
	}
</style>
