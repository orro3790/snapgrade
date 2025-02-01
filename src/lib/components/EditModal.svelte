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

	$effect(() => {
		if (inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === 'Escape') {
			event.preventDefault();
			finishEditing();
		}
	}

	function finishEditing() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		const trimmedText = editableText.trim();

		try {
			if (node.type === 'empty') {
				if (trimmedText) {
					editorStore.updateNode(node.id, trimmedText, undefined, 'addition');
				} else {
					editorStore.removeNode(node.id);
				}
				return;
			}

			if (!trimmedText || trimmedText === node.text) {
				if (!trimmedText) {
					editorStore.updateNode(node.id, node.text, undefined, 'normal');
				}
				return;
			}

			if (trimmedText.startsWith('`')) {
				editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			} else if (trimmedText.startsWith('@')) {
				const newText = trimmedText.slice(1);
				if (newText) {
					editorStore.updateNode(node.id, node.text);
					editorStore.insertNodeAfter(node.id, newText);
				}
			} else if (trimmedText.startsWith('!')) {
				const plainText = trimmedText.slice(1);
				if (plainText !== node.text) {
					editorStore.updateNode(node.id, plainText);
				}
			} else {
				editorStore.updateNode(node.id, node.text, trimmedText, 'correction');
			}
		} finally {
			isProcessingEdit = false;
			onClose();
		}
	}
</script>

<div
	class="modal-overlay"
	role="dialog"
	aria-modal="true"
	aria-label="Edit text modal"
	tabindex="-1"
>
	<div class="modal-content" role="document">
		<input
			bind:this={inputRef}
			bind:value={editableText}
			class="edit-input"
			onkeydown={handleKeyDown}
			onblur={finishEditing}
			aria-label="Edit text"
			type="text"
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
		border: 2px solid var(--interactive-normal);
		transition: border-color 0.2s ease;
		border-radius: 0.25rem;
		background-color: var(--background-secondary-alt);
		color: var(--text-normal);
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--interactive-accent-hover);
		transition: border-color 0.2s ease;
	}
</style>
