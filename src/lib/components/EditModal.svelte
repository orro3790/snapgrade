<!-- file: src/lib/components/EditModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { EditorCommands } from '$lib/commands/editorCommands.svelte';
	import type { Node as TextNodeType } from '$lib/schemas/textNode';
	import Add from '$lib/icons/Add.svelte';
	import Correction from '$lib/icons/Correction.svelte';
	import Slash from '$lib/icons/Slash.svelte';
	import Eraser from '$lib/icons/Eraser.svelte';
	import Replace from '$lib/icons/Replace.svelte';
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
	let activeError = $state<string | undefined>(undefined);
	let errorTimeout: number | undefined;

	function setError(message: string) {
		// Clear any existing timeout
		if (errorTimeout) {
			clearTimeout(errorTimeout);
		}

		// Set the error message
		activeError = message;

		// Clear the error after 3 seconds
		errorTimeout = window.setTimeout(() => {
			activeError = undefined;
		}, 3000);
	}

	function handleDisabledClick(result: { allowed: boolean; reason?: string }, isSubmit = false) {
		if (!result.allowed) {
			if (isSubmit && inputValue.trim() === originalText) {
				setError('No changes made');
			} else if (result.reason) {
				setError(result.reason);
			}
		}
	}

	// Clear timeout on cleanup
	$effect.root(() => {
		return () => {
			if (errorTimeout) {
				clearTimeout(errorTimeout);
			}
		};
	});

	// Command validation results
	let deleteResult = $derived(
		isMultiNodeCorrection
			? EditorCommands.GROUP_DELETE.canExecute(editorStore.groupSelect.selectedNodeIds)
			: EditorCommands.DELETE.canExecute(node.id)
	);

	let addResult = $derived(EditorCommands.INSERT_EMPTY.canExecute(node.id));

	let removeResult = $derived(
		isMultiNodeCorrection
			? EditorCommands.GROUP_REMOVE.canExecute(editorStore.groupSelect.selectedNodeIds)
			: EditorCommands.REMOVE.canExecute(node.id)
	);
	type ValidationResult = { allowed: boolean; reason?: string };

	// New update validation result
	let updateResult = $derived(
		(() => {
			// Only allow updates for empty and addition nodes
			if (isMultiNodeCorrection) {
				return { allowed: false, reason: 'Cannot update multiple nodes' } as ValidationResult;
			}
			if (node.type !== 'empty' && node.type !== 'addition') {
				return {
					allowed: false,
					reason: 'Can only update empty or addition nodes'
				} as ValidationResult;
			}
			// For empty and addition nodes, require a non-empty value
			return inputValue.trim()
				? ({ allowed: true } as ValidationResult)
				: ({ allowed: false, reason: 'Text cannot be empty' } as ValidationResult);
		})()
	);

	let correctionResult = $derived(
		(() => {
			// Don't allow corrections for empty or addition nodes
			if (node.type === 'empty' || node.type === 'addition') {
				return {
					allowed: false,
					reason: 'Cannot correct empty or addition nodes'
				} as ValidationResult;
			}

			const baseResult = isMultiNodeCorrection
				? EditorCommands.GROUP_CORRECTION.canExecute(editorStore.groupSelect.selectedNodeIds)
				: EditorCommands.CORRECTION.canExecute(node.id);

			if (!baseResult.allowed) {
				return baseResult as ValidationResult;
			}

			return inputValue.trim() !== originalText
				? ({ allowed: true } as ValidationResult)
				: ({ allowed: false } as ValidationResult); // Don't set reason until user tries to submit
		})()
	);

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

		// Handle empty and addition nodes with UPDATE command
		if ((node.type === 'empty' || node.type === 'addition') && updateResult.allowed) {
			EditorCommands.UPDATE.execute([node.id, trimmedValue]);
			onClose();
			isProcessingEdit = false;
			return;
		}

		// Handle corrections for other node types
		if (!correctionResult.allowed) {
			isProcessingEdit = false;
			return;
		}

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
				// Use GROUP_CORRECTION command for creating new corrections
				EditorCommands.GROUP_CORRECTION.execute([selectedIds, trimmedValue]);
			}
		} else {
			if (!trimmedValue && node.type === 'correction') {
				// For empty submission on single correction, revert to normal
				EditorCommands.CORRECTION.execute([node.id, '']);
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
		<div class="actions-container">
			<div class="error-message" class:visible={activeError !== undefined}>
				{activeError}
			</div>
			<div class="actions" role="toolbar" aria-label="Editing actions">
				<!-- Editing Functions Group -->
				<div class="button-group" role="group" aria-label="Text editing actions">
					<button
						onclick={() =>
							deleteResult.allowed ? handleDelete() : handleDisabledClick(deleteResult)}
						type="button"
						title="Mark for deletion"
						class:disabled={!deleteResult.allowed}
					>
						<span class="button-icon">
							<Slash />
						</span>
					</button>

					<button
						onclick={() =>
							correctionResult.allowed
								? handleSubmit()
								: handleDisabledClick(correctionResult, true)}
						type="button"
						title="Correct"
						class:disabled={!correctionResult.allowed}
					>
						<span class="button-icon">
							<Correction />
						</span>
					</button>

					<button
						onclick={() =>
							updateResult.allowed ? handleSubmit() : handleDisabledClick(updateResult, true)}
						type="button"
						title="Replace value"
						class:disabled={!updateResult.allowed}
					>
						<span class="button-icon">
							<Replace />
						</span>
					</button>
				</div>

				<!-- Separator -->
				<div class="actions-separator" role="separator" aria-hidden="true"></div>

				<!-- Node Controls Group -->
				<div class="button-group" role="group" aria-label="Node control actions">
					<button
						onclick={() =>
							removeResult.allowed ? handleRemove() : handleDisabledClick(removeResult)}
						type="button"
						title="Remove node"
						class:disabled={!removeResult.allowed}
					>
						<span class="button-icon">
							<Eraser />
						</span>
					</button>

					<button
						onclick={() => (addResult.allowed ? handleAddAfter() : handleDisabledClick(addResult))}
						type="button"
						title="Insert node"
						class:disabled={!addResult.allowed}
					>
						<span class="button-icon">
							<Add />
						</span>
					</button>
				</div>
			</div>
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

	.actions-container {
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--background-modifier-border);
	}

	.error-message {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		padding: 0;
		text-align: center;
		max-height: 0;
		opacity: 0;
		overflow: hidden;
		transition:
			max-height 300ms ease-out,
			opacity 200ms ease-out,
			padding 300ms ease-out;
	}

	.error-message.visible {
		max-height: var(--spacing-8);
		opacity: 1;
		padding: var(--spacing-1);
		transition:
			max-height 250ms ease-in,
			opacity 300ms ease-in,
			padding 250ms ease-in;
	}

	.actions {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center; /* Added to vertically center the separator */
		gap: var(--spacing-1);
		padding: var(--spacing-2);
	}

	.button-group {
		display: flex;
		gap: var(--spacing-1);
	}

	.actions-separator {
		width: 1px;
		height: var(--spacing-6);
		background: var(--background-modifier-border);
		margin: 0 var(--spacing-2);
	}

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		background: none;
		border: none;
		border-radius: var(--radius-base);
		cursor: pointer;
		color: var(--text-muted);
		transition: var(--transition-all);
		padding: var(--spacing-2);
	}

	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-sm);
		height: var(--icon-sm);
	}

	button:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	button.disabled {
		opacity: 0.5;
		cursor: default;
	}

	button.disabled:hover {
		background: none;
		color: var(--text-muted);
	}
</style>
