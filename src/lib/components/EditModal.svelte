<!-- file: src/lib/components/EditModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { EditorCommands } from '$lib/commands/editorCommands.svelte';
	import type { Node as TextNodeType } from '$lib/schemas/textNode';
	import Add from '$lib/icons/Add.svelte';
	import Correction from '$lib/icons/Correction.svelte';
	import Slash from '$lib/icons/Slash.svelte';
	import Eraser from '$lib/icons/Eraser.svelte';

	let { node, position, onClose } = $props<{
		node: TextNodeType;
		position: { x: number; y: number };
		onClose: () => void;
	}>();

	let modalElement: HTMLDivElement;
	let inputElement: HTMLTextAreaElement;

	// Get selected nodes for multi-node correction
	let isMultiNodeCorrection = $derived(editorStore.groupSelect.isGroupMode);
	let selectedNodesList = $derived(
		isMultiNodeCorrection
			? editorStore.nodes.filter((n) => editorStore.isNodeInGroupSelection(n.id))
			: [node]
	);

	// For multi-node correction, combine texts with spaces
	let originalText = $derived(
		isMultiNodeCorrection
			? selectedNodesList.map((n) => n.text).join(' ')
			: node.type === 'correction'
				? node.text
				: node.text
	);

	let inputValue = $state(
		(() => {
			if (node.type === 'correction') {
				return node.correctionData?.correctedText || originalText;
			}
			return originalText;
		})()
	);
	let isProcessingEdit = $state(false);

	// Add a derived value to check if correction is possible
	let canCorrect = $derived(inputValue.trim() !== originalText);

	// Add this function to adjust textarea height
	function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}

	// Modify the effect to include height adjustment
	$effect(() => {
		if (!modalElement || !inputElement) return;

		const rect = modalElement.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let x = position.x;
		let y = position.y;

		x += 10;
		y += 10;

		if (x + rect.width > viewportWidth) {
			x = viewportWidth - rect.width - 10;
		}
		if (y + rect.height > viewportHeight) {
			y = viewportHeight - rect.height - 10;
		}

		modalElement.style.left = `${x}px`;
		modalElement.style.top = `${y}px`;

		// Focus and adjust height
		inputElement.focus();
		inputElement.select();
		adjustTextareaHeight(inputElement);
	});

	// Add input handler for dynamic height adjustment
	function handleInput(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		adjustTextareaHeight(textarea);
	}

	// Handle click outside
	function handleClickOutside(event: MouseEvent) {
		if (modalElement && !modalElement.contains(event.target as HTMLElement)) {
			handleSubmit();
		}
	}

	// Cleanup
	$effect.root(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});

	function handleSubmit() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		const trimmedValue = inputValue.trim();

		if (isMultiNodeCorrection) {
			// Handle multi-node correction using GROUP_CORRECTION command
			const selectedIds = editorStore.groupSelect.selectedNodeIds;
			const groupNode = selectedNodesList.find(
				(n) => n.type === 'correction' && n.metadata.groupedNodes
			);

			if (!trimmedValue && groupNode) {
				// For empty submission on group correction, unpack the nodes
				EditorCommands.UNPACK_GROUP.execute(groupNode.id);
			} else if (trimmedValue && trimmedValue !== originalText) {
				// For addition nodes, update each node individually
				if (selectedNodesList.every((n) => n.type === 'addition')) {
					selectedNodesList.forEach((node) => {
						EditorCommands.UPDATE.execute([node.id, trimmedValue]);
					});
				} else {
					// Use GROUP_CORRECTION command for creating new corrections
					EditorCommands.GROUP_CORRECTION.execute([selectedIds, trimmedValue]);
				}
			}
		} else {
			if (!trimmedValue && node.type === 'correction') {
				// For empty submission on single correction, revert to normal
				EditorCommands.CORRECTION.execute([node.id, '']);
			} else if (!isMultiNodeCorrection && (node.type === 'empty' || node.type === 'addition')) {
				// Handle single empty and addition nodes using UPDATE command with the trimmed text
				EditorCommands.UPDATE.execute([node.id, trimmedValue]);
			} else if (isMultiNodeCorrection && selectedNodesList.every((n) => n.type === 'addition')) {
				// Handle multiple addition nodes - update each one individually
				selectedNodesList.forEach((node) => {
					EditorCommands.UPDATE.execute([node.id, trimmedValue]);
				});
			} else if (trimmedValue && trimmedValue !== originalText) {
				// Use CORRECTION command for single node corrections
				EditorCommands.CORRECTION.execute([node.id, trimmedValue]);
			}
		}

		onClose();
	}

	function handleRemove() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		if (isMultiNodeCorrection) {
			// Use GROUP_REMOVE command for multiple nodes
			EditorCommands.GROUP_REMOVE.execute(editorStore.groupSelect.selectedNodeIds);
		} else {
			// Use REMOVE command for single node
			EditorCommands.REMOVE.execute(node.id);
		}
		onClose();
	}

	function handleDelete() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;

		if (isMultiNodeCorrection) {
			// Use GROUP_DELETE command for multiple nodes
			EditorCommands.GROUP_DELETE.execute(editorStore.groupSelect.selectedNodeIds);
		} else if (node.type !== 'empty') {
			// Use DELETE command for single node
			EditorCommands.DELETE.execute(node.id);
		} else {
			isProcessingEdit = false;
			return;
		}
		onClose();
	}

	function handleAddAfter() {
		if (isProcessingEdit || !inputValue.trim()) return;
		isProcessingEdit = true;

		// Use INSERT_EMPTY command followed by UPDATE
		EditorCommands.INSERT_EMPTY.execute(node.id);
		const newNode = editorStore.nodes.find(
			(n) => n.type === 'empty' && n.metadata.position > node.metadata.position
		);
		if (newNode) {
			EditorCommands.UPDATE.execute([newNode.id, inputValue.trim()]);
		}

		onClose();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSubmit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}
</script>

<div
	class="overlay"
	role="textbox"
	tabindex="0"
	aria-label="Edit text"
	onkeydown={handleKeyDown}
	onclick={onClose}
>
	<div
		class="modal-container"
		bind:this={modalElement}
		role="button"
		tabindex="0"
		aria-label="Modal container"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
			}
		}}
	>
		<textarea
			bind:this={inputElement}
			bind:value={inputValue}
			onkeydown={handleKeyDown}
			oninput={handleInput}
			aria-label="Edit text input"
			placeholder="Type to edit..."
			rows="1"
			aria-multiline="true"
		></textarea>
		<div class="actions" role="toolbar" aria-label="Editing actions">
			<button onclick={handleDelete} type="button" title="Mark for deletion">
				<Slash />
			</button>
			<button onclick={handleAddAfter} type="button" title="Add after">
				<Add />
			</button>
			<button
				onclick={handleSubmit}
				type="button"
				title="Correct"
				disabled={!canCorrect}
				class:disabled={!canCorrect}
			>
				<Correction />
			</button>
			<button onclick={handleRemove} type="button" title="Remove node">
				<Eraser />
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
		border: none;
		padding: 0;
		margin: 0;
		width: 100%;
		cursor: default;
	}

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
		overflow-y: hidden; /* Hide scrollbar */
	}

	textarea:focus {
		outline: none;
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
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

	button:nth-child(3):hover {
		color: var(--interactive-accent);
	}

	button:last-child:hover {
		color: var(--text-error-hover);
	}

	button.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	button.disabled:hover {
		background: none;
		color: var(--text-muted);
	}
</style>
