<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { CreateDocument } from '$lib/schemas/document';
	import { modalStore } from '$lib/stores/modalStore';

	let { data } = $props();
	const { form, errors, enhance, message } = superForm(data);
	let isSubmitting = $state(false);

	function closeModal() {
		modalStore.close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function handleSubmit() {
		isSubmitting = true;
		return async ({ result }) => {
			if (result.type === 'success') {
				closeModal();
			}
			isSubmitting = false;
		};
	}
</script>

<!-- Backdrop -->
<div
	class="modal-backdrop"
	role="presentation"
	onclick={closeModal}
	onkeydown={handleKeydown}
></div>

<!-- Modal -->
<div class="form-modal" role="dialog" aria-labelledby="upload-title" onkeydown={handleKeydown}>
	<div class="modal-header">
		<h2 id="upload-title">Upload Document</h2>
		<button type="button" class="close-button" onclick={closeModal} aria-label="Close upload form">
			×
		</button>
	</div>
	<form method="POST" action="?/uploadDocument" use:enhance={handleSubmit}>
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
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 998;
		backdrop-filter: blur(2px);
	}

	.form-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--background-modifier-border);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 999;
		width: 90%;
		max-width: 32rem;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--text-normal);
		font-family: var(--brand-font);
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		color: var(--text-muted);
		transition: all 0.2s ease;
		line-height: 1;
		border-radius: 0.25rem;
	}

	.close-button:hover {
		color: var(--text-normal);
		background: var(--background-modifier-hover);
	}

	form {
		display: grid;
		gap: 1.25rem;
	}

	.form-group {
		display: grid;
		gap: 0.5rem;
	}

	label {
		color: var(--text-normal);
		font-size: 0.875rem;
		font-weight: 500;
	}

	input,
	textarea {
		padding: 0.75rem;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--text-normal);
		transition: border-color 0.2s ease;
		width: 100%;
	}

	textarea {
		min-height: 8rem;
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--text-accent);
	}

	input[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: var(--error-color);
	}

	.error {
		color: var(--error-color);
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	button[type='submit'] {
		padding: 0.75rem 1rem;
		background: var(--text-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: opacity 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	button[type='submit']:hover {
		opacity: 0.9;
	}

	button[type='submit']:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--text-on-accent);
		border-top: 2px solid transparent;
		border-radius: 50%;
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
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
		font-size: 0.875rem;
	}
</style>
