<!-- File: src/routes/ClassForm.svelte -->
<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { Class } from '$lib/schemas/class';

	// Props
	let { data, onCancel } = $props<{
		data: SuperValidated<any>;
		onCancel: () => void;
	}>();

	const { form, errors, enhance, message } = superForm(data);
	let isSubmitting = $state(false);

	function handleSubmit() {
		isSubmitting = true;
		return async ({ result }) => {
			if (result.type === 'success') {
				onCancel(); // Close form on success
			}
			isSubmitting = false;
		};
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
	}
</script>

<div class="form-container" onkeydown={handleKeydown}>
	<div class="form-header">
		<h2>{$form.metadata?.id ? 'Edit' : 'New'} Class</h2>
		<button type="button" class="close-button" onclick={onCancel} aria-label="Cancel"> × </button>
	</div>

	<form method="POST" action="?/manageClass" use:enhance={handleSubmit}>
		{#if $form.metadata?.id}
			<input type="hidden" name="id" value={$form.metadata.id} />
		{/if}

		<div class="form-group">
			<label for="name">Class Name</label>
			<input
				id="name"
				name="name"
				type="text"
				bind:value={$form.name}
				aria-invalid={$errors.name ? 'true' : undefined}
			/>
			{#if $errors.name}
				<span class="error">{$errors.name}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="description">Description</label>
			<textarea
				id="description"
				name="description"
				bind:value={$form.description}
				aria-invalid={$errors.description ? 'true' : undefined}
			></textarea>
			{#if $errors.description}
				<span class="error">{$errors.description}</span>
			{/if}
		</div>

		<div class="form-actions">
			<button type="button" class="cancel-button" onclick={onCancel}>Cancel</button>
			<button type="submit" class="submit-button" disabled={isSubmitting}>
				{#if isSubmitting}
					<span class="spinner"></span>
					{$form.metadata?.id ? 'Saving...' : 'Creating...'}
				{:else}
					{$form.metadata?.id ? 'Save Changes' : 'Create Class'}
				{/if}
			</button>
		</div>
	</form>

	{#if $message}
		<div class="form-message" role="status">
			{$message}
		</div>
	{/if}
</div>

<style>
	.form-container {
		width: 320px;
		height: 100%;
		background: var(--background-secondary);
		border-right: 1px solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
		animation: slideIn 0.3s ease-out;
	}

	.form-header {
		padding: 1rem;
		border-bottom: 1px solid var(--background-modifier-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-normal);
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
		padding: 1rem;
		display: grid;
		gap: 1.25rem;
	}

	.form-group {
		display: grid;
		gap: 0.5rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-normal);
	}

	input,
	textarea {
		padding: 0.75rem;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.375rem;
		color: var(--text-normal);
		font-size: 0.875rem;
		width: 100%;
		transition: border-color 0.2s ease;
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
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.cancel-button,
	.submit-button {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
	}

	.cancel-button {
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
	}

	.cancel-button:hover {
		background: var(--background-modifier-hover);
	}

	.submit-button {
		background: var(--text-accent);
		border: none;
		color: var(--text-on-accent);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.submit-button:hover {
		opacity: 0.9;
	}

	.submit-button:disabled {
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
		margin: 1rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
		font-size: 0.875rem;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
