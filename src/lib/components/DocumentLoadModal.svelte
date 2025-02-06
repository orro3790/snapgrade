<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import { modalStore } from '$lib/stores/modalStore';

	let { documentBody } = $props<{
		documentBody: string;
	}>();

	function handleConfirm() {
		editorStore.parseContent(documentBody);
		console.log(documentBody);
		modalStore.close();
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

<div class="modal-container" role="dialog" aria-labelledby="modal-title">
	<h2 id="modal-title" class="modal-title">Load Document</h2>
	<p class="modal-message">
		Loading this document will replace your current work. Are you sure you want to continue?
	</p>
	<div class="modal-actions">
		<button
			type="button"
			class="btn-secondary"
			onclick={handleCancel}
			onkeydown={(e) => e.key === 'Enter' && handleCancel()}>Cancel</button
		>
		<button
			type="button"
			class="btn-primary"
			onclick={handleConfirm}
			onkeydown={(e) => e.key === 'Enter' && handleConfirm()}>Continue</button
		>
	</div>
</div>

<style>
	.modal-container {
		background: var(--background-primary);
		border-radius: 0.5rem;
		padding: 1.5rem;
		width: 400px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-title {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-normal);
	}

	.modal-message {
		margin: 0 0 1.5rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: var(--text-accent);
		color: white;
		border: none;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary:hover {
		background: var(--background-secondary);
	}
</style>
