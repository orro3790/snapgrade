<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { CreateDocument } from '$lib/schemas/document';
	import { modalStore } from '$lib/stores/modalStore.svelte';

	let { data } = $props<{ data: SuperValidated<CreateDocument> }>();
	let isSubmitting = $state(false);

	const { form, errors, enhance, message } = superForm(data, {
		onSubmit: () => {
			isSubmitting = true;
		},
		onResult: ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				closeModal();
			}
			isSubmitting = false;
		}
	});

	function closeModal() {
		modalStore.close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<!-- Backdrop -->
<div class="modal-backdrop" role="presentation" onclick={closeModal}></div>

<!-- Modal -->
<dialog class="form-modal" aria-labelledby="upload-title" tabindex="-1">
	<div class="modal-header">
		<h2 id="upload-title">Upload Document</h2>
		<button type="button" class="close-button" onclick={closeModal} aria-label="Close upload form">
			×
		</button>
	</div>
	<form method="POST" action="?/uploadDocument" use:enhance>
		<div class="form-group">
			<label for="studentName">Student Name</label>
			<input
				id="studentName"
				name="studentName"
				type="text"
				bind:value={$form.studentName}
				aria-invalid={$errors.studentName ? 'true' : undefined}
			/>
			{#if $errors.studentName}
				<span class="error">{$errors.studentName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="className">Class Name</label>
			<input
				id="className"
				name="className"
				type="text"
				bind:value={$form.className}
				aria-invalid={$errors.className ? 'true' : undefined}
			/>
			{#if $errors.className}
				<span class="error">{$errors.className}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="documentName">Document Title</label>
			<input
				id="documentName"
				name="documentName"
				type="text"
				bind:value={$form.documentName}
				aria-invalid={$errors.documentName ? 'true' : undefined}
			/>
			{#if $errors.documentName}
				<span class="error">{$errors.documentName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="documentBody">Document Content</label>
			<textarea
				id="documentBody"
				name="documentBody"
				bind:value={$form.documentBody}
				aria-invalid={$errors.documentBody ? 'true' : undefined}
			></textarea>
			{#if $errors.documentBody}
				<span class="error">{$errors.documentBody}</span>
			{/if}
		</div>

		<button type="submit" disabled={isSubmitting}>
			{#if isSubmitting}
				<span class="spinner"></span>
				Uploading...
			{:else}
				Submit
			{/if}
		</button>
	</form>

	{#if $message}
		<div class="form-message" role="status">
			{$message}
		</div>
	{/if}
</dialog>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--background-modifier-cover);
		z-index: var(--z-modal);
		backdrop-filter: blur(2px);
	}

	.form-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		padding: var(--spacing-6);
		border-radius: var(--radius-lg);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-modal);
		width: 90%;
		max-width: 32rem;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-6);
		padding-bottom: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--text-normal);
		font-family: var(--font-family-base);
		font-weight: var(--font-weight-medium);
	}

	.close-button {
		background: none;
		border: none;
		font-size: var(--font-size-xl);
		cursor: pointer;
		padding: var(--spacing-2);
		color: var(--text-muted);
		transition: var(--transition-all);
		line-height: var(--line-height-none);
		border-radius: var(--radius-base);
	}

	.close-button:hover {
		color: var(--text-normal);
		background: var(--background-modifier-hover);
	}

	form {
		display: grid;
		gap: var(--spacing-5);
	}

	.form-group {
		display: grid;
		gap: var(--spacing-2);
	}

	label {
		color: var(--text-normal);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	input,
	textarea {
		padding: var(--spacing-3);
		background: var(--background-modifier-form);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-base);
		font-size: var(--font-size-sm);
		color: var(--text-normal);
		transition: var(--transition-all);
	}

	textarea {
		min-height: 8rem;
		resize: vertical;
	}

	input:hover,
	textarea:hover {
		background: var(--background-modifier-form-hover);
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--interactive-accent-secondary);
	}

	input[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: var(--status-error);
	}

	.error {
		color: var(--status-error);
		font-size: var(--font-size-xs);
		margin-top: var(--spacing-1);
	}

	button[type='submit'] {
		padding: var(--spacing-3) var(--spacing-4);
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-base);
		cursor: pointer;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		transition: var(--transition-all);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
	}

	button[type='submit']:hover:not(:disabled) {
		background: var(--interactive-accent-hover);
	}

	button[type='submit']:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: var(--font-size-base);
		height: var(--font-size-base);
		border: 2px solid var(--text-on-accent);
		border-top: 2px solid transparent;
		border-radius: var(--radius-full);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.form-message {
		margin-top: var(--spacing-4);
		padding: var(--spacing-3);
		border-radius: var(--radius-base);
		background: var(--background-primary);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		color: var(--text-normal);
		font-size: var(--font-size-sm);
	}
</style>
