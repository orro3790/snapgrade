<!-- src/routes/StudentDocuments.svelte -->
<script lang="ts">
	import { classManagerStore } from '$lib/stores/classManagerStore.svelte';
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import type { Document } from '$lib/schemas/document';
	import Pencil from '$lib/icons/Pencil.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import ConfirmationPopover from '$lib/components/ConfirmationPopover.svelte';

	// Use derived values from the store
	const selectedStudent = $derived(classManagerStore.selectedStudent);
	const documents = $derived(classManagerStore.documents);
	const isLoading = $derived(classManagerStore.isLoading);
	const error = $derived(classManagerStore.error);
	
	// Local state for confirmation popover
	let showConfirmation = $state(false);
	let selectedDocument = $state<Document | null>(null);
	
	/**
	 * Handles document selection and shows confirmation popover
	 */
	function handleDocumentClick(document: Document) {
		selectedDocument = document;
		showConfirmation = true;
	}
	
	/**
	 * Loads the document into the editor and closes the modal
	 */
	function confirmLoadDocument() {
		if (!selectedDocument) return;
		
		try {
			// Set the editor mode to formatting
			editorStore.mode = 'formatting';
			
			// Create editor data for localStorage
			const editorData = {
				documentName: selectedDocument.documentName,
				mode: 'formatting',
				timestamp: Date.now()
			};
			
			// Save to localStorage for persistence
			localStorage.setItem('snapgrade_editor_data', JSON.stringify(editorData));
			
			if (selectedDocument.compressedNodes) {
				try {
					// 1. First set empty document with the correct name
					editorStore.setDocument('', selectedDocument.documentName);
					
					// 2. Load the compressed nodes directly into the editor
					editorStore.loadCompressedContent(selectedDocument.compressedNodes);
					
					// 3. Save compressed nodes to localStorage
					localStorage.setItem('snapgrade_editor_compressed_nodes', selectedDocument.compressedNodes);
					localStorage.setItem('snapgrade_editor_use_compressed', 'true');
				} catch (parseError) {
					// Fallback to raw text if there's an error with compressed nodes
					editorStore.setDocument(selectedDocument.documentBody, selectedDocument.documentName);
					
					// Save raw content to localStorage
					localStorage.setItem('snapgrade_editor_raw_content', selectedDocument.documentBody);
					localStorage.setItem('snapgrade_editor_use_compressed', 'false');
				}
			} else {
				// For raw text, use setDocument to set both content and name
				editorStore.setDocument(selectedDocument.documentBody, selectedDocument.documentName);
				
				// Save raw content to localStorage
				localStorage.setItem('snapgrade_editor_raw_content', selectedDocument.documentBody);
				localStorage.setItem('snapgrade_editor_use_compressed', 'false');
			}
			
			// Close the modal to reveal the editor with the loaded document
			modalStore.close();
		} catch (error) {
			console.error('Error loading document:', error);
		} finally {
			// Reset state
			showConfirmation = false;
			selectedDocument = null;
		}
	}
	
	/**
	 * Cancels document loading
	 */
	function cancelLoadDocument() {
		showConfirmation = false;
		selectedDocument = null;
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
	
	{#if showConfirmation && selectedDocument}
		<ConfirmationPopover
			message={`Do you want to load "${selectedDocument.documentName}" into the editor?`}
			onConfirm={confirmLoadDocument}
			onCancel={cancelLoadDocument}
		/>
	{/if}
</div>

<style>
	.documents-container {
		width: 300px;
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