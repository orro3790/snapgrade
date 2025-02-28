<!-- FormattingModal.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { EditorCommands } from '$lib/commands/editorCommands.svelte';
	import type { Node as TextNodeType } from '$lib/schemas/textNode';
	import Paragraph from '$lib/icons/Paragraph.svelte';
	import Indent from '$lib/icons/Indent.svelte';
	import Heading from '$lib/icons/Heading.svelte';
	import List from '$lib/icons/List.svelte';
	import Eraser from '$lib/icons/Eraser.svelte';
	import Replace from '$lib/icons/Replace.svelte';
	
	const { node, position, onClose } = $props<{
		node: TextNodeType;
		position: { x: number; y: number };
		onClose: () => void;
	}>();
	
	let modalElement: HTMLDivElement;
	let inputElement: HTMLTextAreaElement;
	
	// For text correction
	let inputValue = $state(node.text);
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
	
	// Clear timeout on cleanup
	$effect.root(() => {
		return () => {
			if (errorTimeout) {
				clearTimeout(errorTimeout);
			}
		};
	});
	
	// Adjust textarea height
	function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}
	
	// Position the modal
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
	
	// Formatting actions
	function handleMakeParagraph() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;
		
		// Add newline before paragraph
		const newlineId = crypto.randomUUID();
		editorStore.insertNodeAfter(node.id, '', 'spacer');
		
		// Find the newly created spacer node
		const spacerNode = editorStore.nodes.find(
			(n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
		);
		
		if (spacerNode) {
			// Update it with lineBreak subtype
			editorStore.updateNode(
				spacerNode.id,
				'',
				undefined,
				{ subtype: 'lineBreak' },
				'spacer'
			);
			
			// Update the node with paragraph role
			editorStore.updateNode(
				node.id,
				node.text,
				undefined,
				undefined,
				'normal'
			);
		}
		
		onClose();
		isProcessingEdit = false;
	}
	
	function handleAddIndent() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;
		
		// Add indent spacer before node
		const indentId = crypto.randomUUID();
		editorStore.insertNodeAfter(node.id, '', 'spacer');
		
		// Find the newly created spacer node
		const spacerNode = editorStore.nodes.find(
			(n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
		);
		
		if (spacerNode) {
			// Update it with indent subtype
			editorStore.updateNode(
				spacerNode.id,
				'',
				undefined,
				{ subtype: 'indent' },
				'spacer'
			);
		}
		
		onClose();
		isProcessingEdit = false;
	}
	
	function handleMakeHeading() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;
		
		// Add newline before heading
		const newlineId = crypto.randomUUID();
		editorStore.insertNodeAfter(node.id, '', 'spacer');
		
		// Find the newly created spacer node
		const spacerNode = editorStore.nodes.find(
			(n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
		);
		
		if (spacerNode) {
			// Update it with lineBreak subtype
			editorStore.updateNode(
				spacerNode.id,
				'',
				undefined,
				{ subtype: 'lineBreak' },
				'spacer'
			);
			
			// Update the node with heading role
			editorStore.updateNode(
				node.id,
				node.text,
				undefined,
				undefined,
				'normal'
			);
		}
		
		onClose();
		isProcessingEdit = false;
	}
	
	function handleMakeList() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;
		
		// Add indent before list item
		const indentId = crypto.randomUUID();
		editorStore.insertNodeAfter(node.id, '', 'spacer');
		
		// Find the newly created spacer node
		const spacerNode = editorStore.nodes.find(
			(n) => n.type === 'spacer' && n.metadata.position > node.metadata.position
		);
		
		if (spacerNode) {
			// Update it with indent subtype
			editorStore.updateNode(
				spacerNode.id,
				'',
				undefined,
				{ subtype: 'indent' },
				'spacer'
			);
			
			// Update the node with normal type
			// We'll use the normal node type but add a list marker in the UI
			editorStore.updateNode(
				node.id,
				node.text,
				undefined,
				undefined,
				'normal'
			);
		}
		
		onClose();
		isProcessingEdit = false;
	}
	
	function handleCorrectText() {
		if (isProcessingEdit) return;
		isProcessingEdit = true;
		
		const trimmedValue = inputValue.trim();
		
		if (trimmedValue && trimmedValue !== node.text) {
			// Update the node text
			editorStore.updateNode(node.id, trimmedValue);
		}
		
		onClose();
		isProcessingEdit = false;
	}
	
	function handleSubmit() {
		handleCorrectText();
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
	aria-label="Format text"
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
			<div class="actions" role="toolbar" aria-label="Formatting actions">
				<!-- Text Correction Group -->
				<div class="button-group" role="group" aria-label="Text correction actions">
					<button
						onclick={handleCorrectText}
						type="button"
						title="Correct text"
					>
						<span class="button-icon">
							<Replace />
						</span>
					</button>
				</div>
				
				<!-- Separator -->
				<div class="actions-separator" role="separator" aria-hidden="true"></div>
				
				<!-- Formatting Group -->
				<div class="button-group" role="group" aria-label="Formatting actions">
					<button
						onclick={handleMakeParagraph}
						type="button"
						title="Make paragraph"
					>
						<span class="button-icon">
							<Paragraph />
						</span>
					</button>
					
					<button
						onclick={handleAddIndent}
						type="button"
						title="Add indent"
					>
						<span class="button-icon">
							<Indent />
						</span>
					</button>
					
					<button
						onclick={handleMakeHeading}
						type="button"
						title="Make heading"
					>
						<span class="button-icon">
							<Heading />
						</span>
					</button>
					
					<button
						onclick={handleMakeList}
						type="button"
						title="Make list item"
					>
						<span class="button-icon">
							<List />
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
		align-items: center;
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