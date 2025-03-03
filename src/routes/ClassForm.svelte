<!-- File: src/routes/ClassForm.svelte -->
<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { type Class } from '$lib/schemas/class';
	import StatusNotification from '$lib/components/StatusNotification.svelte';
	import XIcon from '$lib/icons/XIcon.svelte';
	import Button from '$lib/components/Button.svelte';

	// Props with proper typing
	let { data, onCancel, isEditing = false } = $props<{
		data: SuperValidated<Class>; // Fixed type parameter
		onCancel: () => void;
		isEditing?: boolean;
	}>();
	
	// On component initialization, log the data to see what we're getting
	$effect(() => {
		$inspect('ClassForm received data:', data);
		$inspect('Is editing mode:', isEditing);
		$inspect('Form data name:', data.data?.name);
		
		// Clear message when form is opened
		message.set('');
		
		// If we're editing, make sure the form has the correct name
		if (isEditing && data.data?.name) {
			$form.name = data.data.name;
		}
	});
	
	// Import the classManagerStore
	import { classManagerStore } from '$lib/stores/classManagerStore.svelte';

	// Ensure we're using the correct dataType for handling complex data
	const { form, errors, message } = superForm(data, {
		dataType: 'json', // Must use 'json' for nested data structures
		id: 'class-form-editor' // Set a unique ID different from the one in ClassManager
	});
	
	// Handle form submission with client-first approach
	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		// Log the current form state before cleaning
		console.log('Form before cleaning:', JSON.stringify($form));
		console.log('Is editing mode:', isEditing);
		console.log('Original form ID:', $form.id);
		
		// Get the ID from the parent component's props
		const parentData = data.data;
		console.log('Parent data ID:', parentData?.id);
		
		// Create a clean form data object with ALL required schema fields
		// This ensures proper validation and update vs. create logic
		const cleanForm = {
			// CRITICAL: Preserve the ID for editing mode - use parent data ID if available
			id: isEditing ? (parentData?.id || $form.id || '') : '',
			name: $form.name,
			description: $form.description || '',
			// Include all required fields from the schema
			students: $form.students || [],
			status: $form.status || 'active',
			// Preserve metadata for existing classes
			metadata: $form.metadata || {
				createdAt: new Date(),
				updatedAt: new Date()
			}
		};
		
		console.log(`Submitting class form in ${isEditing ? 'EDIT' : 'CREATE'} mode`);
		console.log('Form ID being submitted:', cleanForm.id);
		
		isSubmitting = true;
		hasError = false;
		
		try {
			// Use the classManagerStore to save the class with client-first approach
			const success = await classManagerStore.saveClass(cleanForm);
			
			if (success) {
				// Clear form state on success
				if (!isEditing) {
					$form = {
						id: '',
						name: '',
						description: '',
						students: [],
						status: 'active',
						metadata: {
							createdAt: new Date(),
							updatedAt: new Date()
						}
					};
				}
				
				message.set(isEditing ? 'Class updated successfully' : 'Class created successfully');
				onCancel(); // Close the form
			} else {
				hasError = true;
				message.set('Failed to save class. Please try again.');
			}
		} catch (err) {
			console.error('Error saving class:', err);
			hasError = true;
			message.set('An unexpected error occurred');
		} finally {
			isSubmitting = false;
		}
	}
	
	let isSubmitting = $state(false);
	let hasError = $state(false);

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
	}
</script>

<div class="form-container" role="dialog" aria-modal="true">
	<div class="form-header">
		<h2>
			{#if isEditing || $form.id}
				Edit Class: {$form.name || 'Unnamed Class'}
			{:else}
				Create Class
			{/if}
		</h2>
		<div
			role="button"
			tabindex="0"
			class="close-button"
			onclick={onCancel}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onCancel();
				} else if (e.key === 'Escape') {
					handleKeydown(e);
				}
			}}
			aria-label="Cancel"
		>
			<XIcon size="1.25rem" stroke="var(--text-muted)" />
		</div>
	</div>

	<form onsubmit={(event) => {
		event.preventDefault();
		handleSubmit(event);
	}}>
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
			<Button
				label="Cancel"
				type="secondary"
				ClickFunction={onCancel}
				size="compact"
			/>
			<Button
				label={isSubmitting ?
					(isEditing || $form.id ? 'Saving...' : 'Creating...') :
					(isEditing || $form.id ? 'Save Changes' : 'Create Class')}
				type="primary"
				isSubmit={true}
				disabled={isSubmitting}
				isLoading={isSubmitting}
				size="compact"
			/>
		</div>
	</form>

	{#if $message}
		<div class="notification-container">
			<StatusNotification
				type={hasError ? 'error' : 'success'}
				onDismiss={() => $message = ''}
			>
				{$message}
			</StatusNotification>
		</div>
	{/if}
</div>

<style>
	.form-container {
		width: 300px;
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
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: var(--text-muted);
		transition: all 0.2s ease;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
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
		resize: none;
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
	}

	/* The spinner is now handled by the Button component */

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.notification-container {
		margin: 1rem;
		width: auto;
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