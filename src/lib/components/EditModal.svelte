<!-- file: src/lib/components/EditModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';

	const { node, onClose } = $props<{
		node: {
			id: string;
			text: string;
			type: 'normal' | 'deletion' | 'addition' | 'correction' | 'empty';
			correctionText?: string;
			hasNextCorrection?: boolean;
			isWhitespace?: boolean;
		};
		onClose: () => void;
	}>();

	let editableText = $state(node.text);
	let inputRef = $state<HTMLInputElement>();
	let isProcessingEdit = $state(false);

	// Focus input on mount
	$effect(() => {
		if (inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			finishEditing();
		} else if (event.key === 'Escape') {
			onClose();
		}
	}

	function finishEditing() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		const trimmedText = editableText.trim();

		// Handle empty nodes differently
		if (node.type === 'empty') {
			if (trimmedText) {
				editorStore.updateNode(node.id, trimmedText, undefined, 'addition');
			} else {
				editorStore.removeNode(node.id);
			}
			onClose();
			return;
		}

		// Handle empty submission for non-empty nodes - revert to normal text
		if (!trimmedText) {
			editorStore.updateNode(node.id, node.text, undefined, 'normal');
			onClose();
			return;
		}

		// Handle special character submissions
		if (trimmedText.startsWith('`')) {
			// Mark as deletion without changing text
			editorStore.updateNode(node.id, node.text, undefined, 'deletion');
		} else if (trimmedText.startsWith('@')) {
			// Create a new node after this one
			const newText = trimmedText.slice(1);
			if (newText) {
				// First update the current node back to its original text
				editorStore.updateNode(node.id, node.text);
				// Then create a new node after this one
				editorStore.insertNodeAfter(node.id, newText);
			}
		} else if (trimmedText.startsWith('!')) {
			// Plain text update (no correction)
			const plainText = trimmedText.slice(1);
			editorStore.updateNode(node.id, plainText);
		} else {
			// Default behavior: create correction
			editorStore.updateNode(node.id, node.text, trimmedText, 'correction');
		}

		onClose();
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			finishEditing();
		}
	}
</script>

<div class="modal-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true">
	<div class="modal-content">
		<input
			bind:this={inputRef}
			bind:value={editableText}
			class="edit-input"
			onkeydown={handleKeyDown}
			aria-label="Edit text"
		/>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: var(--background-secondary);
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		min-width: 300px;
	}

	.edit-input {
		width: 100%;
		font-size: 1rem;
		padding: 0.5rem;
		border: 2px solid var(--interactive-accent);
		border-radius: 0.25rem;
		background-color: var(--background-secondary-alt);
		color: var(--text-normal);
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--interactive-accent-hover);
	}
</style>
