<!-- src/lib/components/DocumentLoadModal.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import { editorStore } from '$lib/stores/editorStore';

	// Props
	let { documentToLoad, documentName } = $props<{
		documentToLoad: string;
		documentName: string;
	}>();

	function handleConfirm() {
		editorStore.setDocument(documentToLoad, documentName);
		modalStore.close();
	}

	function handleCancel() {
		modalStore.close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<div
	class="modal-container"
	role="button"
	tabindex="0"
	aria-labelledby="dialog-title"
	onkeydown={handleKeydown}
>
	<div class="modal-content">
		<h2 id="dialog-title">Load Document</h2>
		<p>
			Loading a new document will replace the current content in the editor. Do you want to
			continue?
		</p>

		<div class="button-group">
			<button type="button" class="button secondary" onclick={handleCancel}> Cancel </button>
			<button type="button" class="button" onclick={handleConfirm}> Load Document </button>
		</div>
	</div>
</div>

<style>
	.modal-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		border-radius: var(--radius-lg);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		box-shadow: var(--shadow-xl);
		z-index: calc(var(--z-modal) + 10);
		width: 90%;
		max-width: 400px;
		overflow: hidden;
	}

	.modal-content {
		padding: var(--spacing-6);
	}

	h2 {
		font-size: var(--font-size-xl);
		margin-bottom: var(--spacing-4);
		color: var(--text-normal);
	}

	p {
		color: var(--text-muted);
		margin-bottom: var(--spacing-6);
		line-height: var(--line-height-relaxed);
	}

	.button-group {
		display: flex;
		gap: var(--spacing-3);
		justify-content: flex-end;
	}
</style>
