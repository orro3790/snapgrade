<!-- src/routes/StudentDocuments.svelte -->
<script lang="ts">
	import { classManagerStore } from '$lib/stores/classManagerStore.svelte';
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import type { Document } from '$lib/schemas/document';
	import Pencil from '$lib/icons/Pencil.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';

	// Use derived values from the store
	const selectedStudent = $derived(classManagerStore.selectedStudent);
	const documents = $derived(classManagerStore.documents);
	const isLoading = $derived(classManagerStore.isLoading);
	const error = $derived(classManagerStore.error);
	
	// Create a derived key that changes when selectedStudent changes
	// This helps force re-rendering when student data updates
	let studentKey = $derived(`student-${selectedStudent?.id}-${selectedStudent?.name}`);

	/**
	 * Handles document selection and loading
	 */
	function handleDocumentClick(document: Document) {
		// Get current nodes directly from the store
		const hasContent = editorStore.nodes.length > 0;

		if (!hasContent) {
			// If editor is empty, load directly
			editorStore.setDocument(document.documentBody, document.documentName);
			modalStore.close();
		} else {
			// If editor has content, show confirmation
			modalStore.open('documentLoad', {
				documentToLoad: document.documentBody,
				documentName: document.documentName,
				showConfirmation: true,
				confirmationMessage:
					'Loading a new document will replace the current content. Do you want to continue?'
			});
		}
	}

	/**
	 * Creates a preview of the document text
	 */
	function createPreview(text: string, length: number = 150): string {
		if (!text) return '';
		if (text.length <= length) return text;
		return text.slice(0, length).trim() + '...';
	}
</script>

<!-- Use key directive to force re-rendering when studentKey changes -->
{#key studentKey}
<div class="documents-container" role="region" aria-label="Student documents">
	<div class="student-header">
		<div>
			<h2>{selectedStudent?.name}</h2>
			{#if selectedStudent?.description}
				<p class="student-description">{selectedStudent.description}</p>
			{/if}
		</div>
		<div class="student-actions">
			<button 
				type="button" 
				class="icon-button" 
				onclick={() => selectedStudent && classManagerStore.editStudent(selectedStudent)} 
				aria-label="Edit student"
			>
				<Pencil size="var(--icon-sm)" stroke="var(--text-muted)" />
			</button>
			<button 
				type="button" 
				class="icon-button" 
				onclick={() => classManagerStore.showDeleteStudentDialog()} 
				aria-label="Delete student"
			>
				<TrashIcon size="var(--icon-sm)" stroke="var(--text-muted)" />
			</button>
		</div>
	</div>

	<div class="documents-section">
		{#if isLoading}
			<div class="loading" role="status">Loading documents...</div>
		{:else if error}
			<div class="error" role="alert">{error}</div>
		{:else if documents.length === 0}
			<div class="empty-state">No documents found</div>
		{:else}
			<ul class="document-list">
				{#each documents as document (document.id)}
					<li>
						<button
							type="button"
							class="document-item"
							onclick={() => handleDocumentClick(document)}
						>
							<div class="document-header">
								<h3 class="document-title">{document.documentName}</h3>
								<span class="document-date">
									{document.createdAt.toLocaleDateString()}
								</span>
							</div>
							<p class="document-preview">
								{createPreview(document.documentBody)}
							</p>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
{/key}

<style>
	.documents-container {
		width: 320px;
		height: 100%;
		background: var(--background-secondary);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-left: var(--border-width-thin) solid var(--background-modifier-border);
	}

	.student-header {
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.student-description {
		margin: var(--spacing-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.student-actions {
		display: flex;
		gap: var(--spacing-1);
	}

	.icon-button {
		background: none;
		border: none;
		padding: 0.5rem;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-button:hover {
		color: var(--text-normal);
		background: var(--background-modifier-hover);
	}

	.documents-section {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-2);
	}

	.document-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--spacing-2);
	}

	.document-item {
		width: 100%;
		text-align: left;
		background: var(--background-primary);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-base);
		padding: var(--spacing-3);
		transition: var(--transition-all);
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.document-item:hover {
		background: var(--background-modifier-hover);
	}

	.document-item:focus-visible {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--interactive-accent-secondary);
	}

	.document-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
	}

	.document-title {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 70%;
	}

	.document-date {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.document-preview {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
		white-space: normal;
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
	}

	.loading,
	.error,
	.empty-state {
		padding: var(--spacing-4);
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-size-base);
	}

	.error {
		color: var(--status-error);
	}
</style>