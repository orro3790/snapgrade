<!-- file: src/lib/components/EditModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import type { Node } from '$lib/schemas/textNode';
	import Add from '$lib/icons/Add.svelte';
	import Correction from '$lib/icons/Correction.svelte';
	import Slash from '$lib/icons/Slash.svelte';

	const { node, onClose } = $props<{
		node: Node;
		onClose: () => void;
	}>();

	let editableText = $state(node.text);
	let inputRef = $state<HTMLTextAreaElement>();
	let isProcessingEdit = $state(false);

	$effect(() => {
		if (inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		} else if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSave();
		}
	}

	function handleDelete() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;
		editorStore.updateNode(node.id, node.text, undefined, undefined, 'deletion');
		onClose();
	}

	function handleAddAfter() {
		if (isProcessingEdit || !editableText.trim()) return;
		isProcessingEdit = true;
		editorStore.insertNodeAfter(node.id, editableText.trim(), 'addition');
		onClose();
	}

	function handleCorrect() {
		if (isProcessingEdit || !editableText.trim() || editableText.trim() === node.text) return;
		isProcessingEdit = true;
		editorStore.updateNode(
			node.id,
			node.text,
			{
				originalText: node.text,
				correctedText: editableText.trim(),
				pattern: ''
			},
			undefined,
			'correction'
		);
		onClose();
	}

	function handleSave() {
		if (isProcessingEdit) return;
		const trimmedText = editableText.trim();
		if (!trimmedText || trimmedText === node.text) {
			onClose();
			return;
		}
		handleCorrect();
	}
</script>

<div
	class="overlay"
	role="button"
	tabindex="0"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<div
		class="modal"
		role="button"
		tabindex="0"
		aria-label="Edit text"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				e.stopPropagation();
			}
		}}
	>
		<textarea
			bind:this={inputRef}
			bind:value={editableText}
			onkeydown={handleKeyDown}
			placeholder="Type to edit..."
			rows="3"
			aria-multiline="true"
		></textarea>
		<div class="actions" aria-label="Editing actions">
			<button onclick={handleDelete} type="button" title="Delete text">
				<Slash />
			</button>
			<button onclick={handleAddAfter} type="button" title="Add after">
				<Add />
			</button>
			<button onclick={handleCorrect} type="button" title="Correct">
				<Correction />
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: var(--background-modifier-cover);
		display: grid;
		place-items: center;
		z-index: var(--z-modal);
	}

	.modal {
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
