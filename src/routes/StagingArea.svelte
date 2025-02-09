<!-- File: src/routes/StagingArea.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createDocumentSchema, type CreateDocument } from '$lib/schemas/document';

	// Props
	let { data } = $props<{
		data: {
			stageDocumentForm: SuperValidated<CreateDocument>;
			user: App.Locals['user'];
			uid: App.Locals['uid'];
		};
	}>();

	// Form initialization
	const { form, errors, enhance, submitting } = superForm(data.stageDocumentForm, {
		validators: zod(createDocumentSchema),
		onSubmit: async () => {
			isSubmitting = true;
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastStore.show({
					message: 'Document updated successfully',
					type: 'success'
				});
				modalStore.close();
			} else {
				// toastStore.show({
				// 	message: result.data?.message || 'Failed to update document',
				// 	type: 'error'
				// });
			}
			isSubmitting = false;
		},
		onError: () => {
			toastStore.show({
				message: 'An unexpected error occurred',
				type: 'error'
			});
			isSubmitting = false;
		}
	});

	// State
	let classes = $state<{ id: string; name: string }[]>([]);
	let students = $state<{ id: string; name: string }[]>([]);
	let stagedDocuments = $state<{ id: string; documentName: string }[]>([]);
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let headingInput = $state('');
	let selectedDocumentId = $state<string | null>(null);

	// Initial data loading
	onMount(async () => {
		try {
			const [classResponse, docResponse] = await Promise.all([
				fetch('/api/class/list'),
				fetch('/api/documents/staged')
			]);

			if (!classResponse.ok) throw new Error('Failed to fetch classes');
			if (!docResponse.ok) throw new Error('Failed to fetch documents');

			const [classResult, docResult] = await Promise.all([
				classResponse.json(),
				docResponse.json()
			]);

			classes = classResult.data;
			stagedDocuments = docResult.data;
		} catch (error) {
			console.error('Error loading initial data:', error);
			toastStore.show({
				message: 'Failed to load data',
				type: 'error'
			});
		}
	});

	// Watch for class changes and fetch students
	$effect(() => {
		if ($form.classId) {
			isLoading = true;
			fetch(`/api/students/list/${$form.classId}`)
				.then(async (response) => {
					if (!response.ok) throw new Error('Failed to fetch students');
					const result = await response.json();
					students = result.data;
				})
				.catch((error) => {
					console.error('Error fetching students:', error);
					students = [];
					toastStore.show({
						message: 'Failed to load students',
						type: 'error'
					});
				})
				.finally(() => {
					isLoading = false;
				});
		} else {
			students = [];
		}
	});

	/**
	 * Handles clicking on a document in the list
	 * Fetches the document content and updates the form
	 */
	async function handleDocumentClick(documentId: string) {
		try {
			isLoading = true;
			selectedDocumentId = documentId;
			const response = await fetch(`/api/documents/staged/${documentId}`);
			if (!response.ok) throw new Error('Failed to fetch document');

			const result = await response.json();
			const doc = result.data;

			// Update form with document data
			$form = {
				...$form,
				id: doc.id,
				classId: doc.classId || '',
				className: doc.className || '',
				studentId: doc.studentId || '',
				studentName: doc.studentName || '',
				documentName: doc.documentName,
				documentBody: doc.documentBody,
				title: doc.title || '',
				subtitle: doc.subtitle || '',
				headings: doc.headings || [],
				sourceType: doc.sourceType || 'llmwhisperer',
				status: 'staged'
			};
		} catch (error) {
			console.error('Error fetching document:', error);
			toastStore.show({
				message: 'Failed to load document',
				type: 'error'
			});
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Adds a new heading to the form's headings array
	 */
	function addHeading() {
		if (headingInput.trim()) {
			$form.headings = [...($form.headings || []), headingInput.trim()];
			headingInput = '';
		}
	}

	/**
	 * Removes a heading at the specified index
	 */
	function removeHeading(index: number) {
		$form.headings = ($form.headings || []).filter((_: string, i: number) => i !== index);
	}

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
<div
	class="modal-backdrop"
	role="presentation"
	onclick={closeModal}
	onkeydown={handleKeydown}
></div>

<!-- Modal -->
<div class="staging-area-modal" role="dialog" aria-labelledby="modal-title">
	<div class="modal-header">
		<h1 id="modal-title">Staging Area</h1>
		<button type="button" class="close-button" onclick={closeModal} aria-label="Close staging area">
			×
		</button>
	</div>

	<div class="modal-content">
		<!-- Column 1: Document List -->
		<div class="document-list-container">
			<div class="section-header">
				<h2>Staged Documents</h2>
			</div>
			{#if stagedDocuments.length === 0}
				<div class="empty-state">No staged documents found</div>
			{:else}
				<div class="document-list">
					{#each stagedDocuments as doc (doc.id)}
						<button
							type="button"
							class="document-item"
							class:active={selectedDocumentId === doc.id}
							onclick={() => handleDocumentClick(doc.id)}
						>
							{doc.documentName}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Column 2: Document Form -->
		<form
			class="document-form-container"
			method="POST"
			action="?/stageDocument"
			use:enhance
			novalidate
		>
			{#if isLoading}
				<div class="loading-state">Loading document...</div>
			{:else if selectedDocumentId}
				<div class="form-section">
					<h3>Class & Student</h3>
					<div class="form-group">
						<label for="class-select">Class</label>
						<select
							id="class-select"
							bind:value={$form.classId}
							class:error={$errors.classId}
							aria-invalid={$errors.classId ? 'true' : undefined}
						>
							<option value="">Select a Class</option>
							{#each classes as classItem (classItem.id)}
								<option value={classItem.id}>{classItem.name}</option>
							{/each}
						</select>
						{#if $errors.classId}
							<span class="error-message">{$errors.classId}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="student-select">Student</label>
						<select
							id="student-select"
							bind:value={$form.studentId}
							disabled={!$form.classId}
							class:error={$errors.studentId}
							aria-invalid={$errors.studentId ? 'true' : undefined}
						>
							<option value="">Select a Student</option>
							{#each students as student (student.id)}
								<option value={student.id}>{student.name}</option>
							{/each}
						</select>
						{#if $errors.studentId}
							<span class="error-message">{$errors.studentId}</span>
						{/if}
					</div>
				</div>

				<div class="form-section">
					<h3>Document Structure</h3>
					<div class="form-group">
						<label for="document-title">Title</label>
						<input
							type="text"
							id="document-title"
							bind:value={$form.title}
							placeholder="Enter document title"
						/>
					</div>

					<div class="form-group">
						<label for="document-subtitle">Subtitle</label>
						<input
							type="text"
							id="document-subtitle"
							bind:value={$form.subtitle}
							placeholder="Enter document subtitle (optional)"
						/>
					</div>

					<div class="form-group">
						<label for="heading-input">Headings</label>
						<div class="heading-input">
							<input
								type="text"
								id="heading-input"
								bind:value={headingInput}
								placeholder="Add a heading"
								onkeydown={(e) => e.key === 'Enter' && addHeading()}
							/>
							<button type="button" class="add-button" onclick={addHeading}>Add</button>
						</div>
						{#if $form.headings?.length}
							<ul class="heading-list">
								{#each $form.headings as heading, index (index)}
									<li>
										<span>{heading}</span>
										<button
											type="button"
											class="remove-button"
											onclick={() => removeHeading(index)}
											aria-label="Remove heading"
										>
											×
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>

				<!-- Column 3: Document Content -->
				<div class="form-section">
					<h3>Document Content</h3>
					<div class="form-group">
						<label for="document-content">Content</label>
						<textarea
							id="document-content"
							bind:value={$form.documentBody}
							rows="10"
							placeholder="Document content will appear here"
							class:error={$errors.documentBody}
							aria-invalid={$errors.documentBody ? 'true' : undefined}
						></textarea>
						{#if $errors.documentBody}
							<span class="error-message">{$errors.documentBody}</span>
						{/if}
					</div>
				</div>

				<div class="form-actions">
					<button type="button" class="secondary-button" onclick={closeModal}>Cancel</button>
					<button type="submit" class="primary-button" disabled={$submitting || isSubmitting}>
						{$submitting || isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			{:else}
				<div class="empty-state">Select a document to edit</div>
			{/if}
		</form>
	</div>
</div>

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

	.staging-area-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		border-radius: var(--radius-lg);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-modal);
		width: 90%;
		max-width: 1200px;
		height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		background: var(--background-alt);
	}

	h1,
	h2,
	h3 {
		margin: 0;
		color: var(--text-normal);
		font-family: var(--font-family-base);
	}

	h1 {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
	}

	h2,
	h3 {
		font-size: var(--font-size-lg);
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

	.modal-content {
		flex: 1;
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: var(--spacing-4);
		overflow: hidden;
		padding: var(--spacing-4);
	}

	.document-list-container {
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
		padding-right: var(--spacing-4);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.document-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
	}

	.document-item {
		padding: 0.75rem;
		border-radius: 0.25rem;
		background: var(--background-modifier-form-field);
		border: var(--component-border);
		color: var(--text-normal);
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.document-item:hover {
		background: var(--background-modifier-hover);
	}

	.document-item.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-color: var(--interactive-accent);
	}

	.document-form-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		padding-right: var(--component-padding);
	}

	.form-section {
		background: var(--background-modifier-form-field);
		padding: var(--component-padding);
		border-radius: var(--component-border-radius);
		border: var(--component-border);
	}

	.form-group {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 500;
	}

	input,
	select,
	textarea {
		padding: 0.75rem;
		border-radius: 0.25rem;
		background: var(--background-secondary);
		border: var(--component-border);
		color: var(--text-normal);
		font-size: 0.925rem;
		transition: all 0.2s ease;
	}

	input:hover,
	select:hover,
	textarea:hover {
		background: var(--background-modifier-form-field-highlighted);
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-accent);
	}

	.error {
		border-color: var(--text-error);
	}

	.error-message {
		color: var(--text-error);
		font-size: 0.875rem;
	}

	.heading-input {
		display: flex;
		gap: 0.5rem;
	}

	.heading-list {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.heading-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: var(--background-secondary);
		border-radius: 0.25rem;
		border: var(--component-border);
	}

	.add-button,
	.remove-button {
		padding: 0.5rem;
		border-radius: 0.25rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.add-button:hover {
		background: var(--interactive-accent-hover);
	}

	.remove-button {
		background: none;
		color: var(--text-muted);
	}

	.remove-button:hover {
		color: var(--text-error);
		background: var(--background-modifier-error);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: var(--component-border);
	}

	.primary-button,
	.secondary-button {
		padding: 0.75rem 1.5rem;
		border-radius: 0.25rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.primary-button {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
	}

	.primary-button:hover:not(:disabled) {
		background: var(--interactive-accent-hover);
	}

	.primary-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.secondary-button {
		background: var(--background-modifier-form-field);
		color: var(--text-normal);
		border: var(--component-border);
	}

	.secondary-button:hover {
		background: var(--background-modifier-hover);
	}

	.empty-state {
		text-align: center;
		color: var(--text-muted);
		padding: 2rem;
		background: var(--background-modifier-form-field);
		border-radius: var(--component-border-radius);
		border: var(--component-border);
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.modal-content {
			grid-template-columns: 1fr;
		}

		.document-list-container {
			border-right: none;
			border-bottom: var(--component-border);
			padding-right: 0;
			padding-bottom: var(--component-padding);
		}
	}
</style>
