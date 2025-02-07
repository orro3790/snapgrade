<!-- file: src/lib/components/EditModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import type { Node } from '$lib/schemas/textNode';

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

		try {
			editorStore.updateNode(node.id, node.text, undefined, 'deletion');
		} finally {
			isProcessingEdit = false;
			onClose();
		}
	}

	function handleAddAfter() {
		if (isProcessingEdit || !editableText.trim()) return;
		isProcessingEdit = true;

		try {
			editorStore.insertNodeAfter(node.id, editableText.trim(), 'addition');
		} finally {
			isProcessingEdit = false;
			onClose();
		}
	}

	function handleCorrect() {
		if (isProcessingEdit || !editableText.trim() || editableText.trim() === node.text) return;
		isProcessingEdit = true;

		try {
			editorStore.updateNode(
				node.id,
				node.text,
				{
					originalText: node.text,
					correctedText: editableText.trim(),
					pattern: '' // Will be set via pattern selector
				},
				'correction'
			);
		} finally {
			isProcessingEdit = false;
			onClose();
		}
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

	// Handle click outside to close
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.modal-content')) {
			onClose();
		}
	}
</script>

<div
	class="modal-overlay"
	onclick={handleClickOutside}
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<div class="modal-content" role="document">
		<h2 id="modal-title" class="sr-only">Edit Text</h2>
		<div class="input-wrapper">
			<textarea
				bind:this={inputRef}
				bind:value={editableText}
				onkeydown={handleKeyDown}
				aria-label="Edit text"
				placeholder="Type to edit..."
				rows="3"
			></textarea>
		</div>
		<div class="actions-grid">
			<button onclick={handleDelete} type="button" class="action delete" title="Delete text">
				Delete
			</button>
			<button
				onclick={handleAddAfter}
				type="button"
				class="action add"
				title="Add after current text"
			>
				Add After
			</button>
			<button
				onclick={handleCorrect}
				type="button"
				class="action correct"
				title="Mark as correction"
			>
				Correct
			</button>
		</div>
		<div class="modal-footer">
			<button onclick={onClose} type="button" class="secondary"> Cancel </button>
			<button onclick={handleSave} type="button" class="primary"> Save </button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--background-modifier-cover);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--background-primary);
		padding: 1.5rem;
		border-radius: 0.5rem;
		min-width: 400px;
		box-shadow: 0 2px 10px var(--background-modifier-box-shadow);
	}

	.input-wrapper {
		margin-bottom: 1rem;
	}

	textarea {
		width: 100%;
		min-height: 80px;
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background: var(--background-modifier-form-field);
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.25rem;
		font-family: var(--brand);
		line-height: 1.5;
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--interactive-accent-hover);
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.action {
		padding: 0.5rem;
		border: none;
		border-radius: 0.25rem;
		font-family: var(--brand);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--text-on-accent);
	}

	.action:hover {
		transform: translateY(-1px);
	}

	.action.delete {
		background: var(--text-error);
	}

	.action.delete:hover {
		background: var(--text-error-hover);
	}

	.action.add {
		background: var(--background-modifier-success);
	}

	.action.add:hover {
		background: var(--interactive-success);
	}

	.action.correct {
		background: var(--interactive-accent);
	}

	.action.correct:hover {
		background: var(--interactive-accent-hover);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1rem;
		border-top: 1px solid var(--background-modifier-border);
		padding-top: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-family: var(--brand);
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	button.secondary {
		background: var(--interactive-normal);
		color: var(--text-normal);
	}

	button.primary {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	button:hover {
		transform: translateY(-1px);
	}

	button.secondary:hover {
		background: var(--interactive-hover);
	}

	button.primary:hover {
		background: var(--interactive-accent-hover);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
