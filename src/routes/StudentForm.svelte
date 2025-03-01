<!-- File: src/routes/StudentForm.svelte -->
<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { type Student } from '$lib/schemas/student';
	import StatusNotification from '$lib/components/StatusNotification.svelte';
	import Button from '$lib/components/Button.svelte';
	import XIcon from '$lib/icons/XIcon.svelte';

	// Props with proper typing
	let { data, onCancel, classId, isEditing = false } = $props<{
		data: SuperValidated<Student>;
		onCancel: () => void;
		classId: string;
		isEditing?: boolean;
	}>();
	
	// On component initialization, log the data to see what we're getting
	$effect(() => {
		$inspect('StudentForm received data:', data);
		$inspect('Is editing student mode:', isEditing);
		$inspect('Form data name:', data.data?.name);
		
		// Clear message when form is opened
		message.set('');
		
		// If we're editing, make sure the form has the correct name
		if (isEditing && data.data?.name) {
			$form.name = data.data.name;
		}
	});
	
	const { form, errors, enhance, message } = superForm(data, {
		dataType: 'json', // Set dataType to 'json' to handle nested data structures
		id: 'student-form-editor', // Set a unique ID different from the one in ClassManager
		onSubmit: ({ formData, cancel }) => {
			isSubmitting = true;
			hasError = false;
			
			// Make sure classId is a string, not a function or derived value
			if (typeof $form.classId === 'function') {
				$form.classId = classId;
			} else if (!$form.classId && classId) {
				$form.classId = classId;
			}
			
			// Log the current form state before cleaning
			console.log('Student form before cleaning:', JSON.stringify($form));
			console.log('Is editing student mode:', isEditing);
			console.log('Original student form ID:', $form.id);
			
			// Get the ID from the parent component's props
			const parentData = data.data;
			console.log('Parent student data ID:', parentData?.id);
			
			// Create a clean form data object with ALL required schema fields
			// This ensures proper validation and update vs. create logic
			const cleanForm = {
				// CRITICAL: Preserve the ID for editing mode - use parent data ID if available
				id: isEditing ? (parentData?.id || $form.id || '') : '',
				name: $form.name,
				description: $form.description || '',
				classId: $form.classId,
				// Include all required fields from the schema
				notes: $form.notes || [],
				status: $form.status || 'active',
				// Preserve metadata for existing students
				metadata: $form.metadata || {
					createdAt: new Date(),
					updatedAt: new Date()
				}
			};
			
			console.log('Submitting student form in ' + (isEditing ? 'EDIT' : 'CREATE') + ' mode');
			console.log('Student form ID being submitted:', cleanForm.id);
			
			// Replace the form data with our clean version
			form.update(() => cleanForm);
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				// Clear form state on success
				if (!isEditing) {
					form.update(() => ({
						id: '',
						name: '',
						description: '',
						classId: classId,
						notes: [],
						status: 'active',
						metadata: {
							createdAt: new Date(),
							updatedAt: new Date()
						}
					}));
				}
				
				onCancel(); // Close the form
			} else {
				hasError = true;
			}
			isSubmitting = false;
		},
		onError: (error) => {
			hasError = true;
			isSubmitting = false;
		}
	});
	
	let isSubmitting = $state(false);
	let hasError = $state(false);

	// Set classId directly when component initializes
	$effect(() => {
		// Only set classId if it's not already set and we have a valid classId prop
		if (!$form.id && !$form.classId && classId) {
			$form.classId = classId;
		}
		
		// Reset message when form is initialized
		$message = '';
	});

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
				Edit Student: {$form.name || 'Unnamed Student'}
			{:else}
				Create Student
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

	<form method="POST" action="?/manageStudent" use:enhance>
		<!-- No need for hidden inputs when using dataType: 'json' -->
		<!-- The entire $form object will be submitted automatically -->
		
		<div class="form-group">
			<label for="name">Student Name</label>
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
				size="compact"
				type="secondary"
				ClickFunction={onCancel}
			/>
			<Button
				label={isSubmitting ?
					(isEditing || $form.id ? 'Saving...' : 'Creating...') :
					(isEditing || $form.id ? 'Save Changes' : 'Create Student')}
				size="compact"
				type="primary"
				isSubmit={true}
				disabled={isSubmitting}
				isLoading={isSubmitting}
			/>
		</div>
	</form>

	{#if $message && $message.trim() !== '' && hasError}
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
		width: 320px;
		height: 100%;
		background: var(--background-secondary);
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
		animation: slideIn var(--transition-duration-300) var(--transition-timing-ease-out);
		overflow-y: auto; /* Allow scrolling if content overflows */
	}

	.form-header {
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
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
		padding: var(--spacing-2);
		color: var(--text-muted);
		transition: var(--transition-all);
		border-radius: var(--radius-base);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		color: var(--text-normal);
		background: var(--background-modifier-hover);
	}

	form {
		padding: var(--spacing-4);
		display: grid;
		gap: var(--spacing-6);
	}

	.form-group {
		display: grid;
		gap: var(--spacing-2);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	input,
	textarea {
		padding: var(--spacing-3);
		background: var(--background-primary);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-base);
		color: var(--text-normal);
		font-size: var(--font-size-sm);
		width: 100%;
		transition: border-color var(--transition-duration-200) var(--transition-timing-ease);
	}

	textarea {
		min-height: var(--spacing-16);
		resize: none; /* Prevent resizing */
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	input[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: var(--status-error);
	}

	.error {
		color: var(--status-error);
		font-size: var(--font-size-xs);
	}

	.form-actions {
		display: flex;
		gap: var(--spacing-4);
	}
	

	.notification-container {
		margin: var(--spacing-4);
		width: auto;
		position: relative;
		z-index: 1;
		overflow: visible;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
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