<!-- src/routes/StudentDocuments.svelte -->
<script lang="ts">
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot } from 'firebase/firestore';
	import type { Student } from '$lib/schemas/student';
	import type { Document } from '$lib/schemas/document';
	import { editorStore } from '$lib/stores/editorStore';
	import { modalStore } from '$lib/stores/modalStore';
	import ConfirmationPopover from '$lib/components/ConfirmationPopover.svelte';

	// Props
	let { selectedStudent } = $props<{
		selectedStudent: Student;
	}>();

	// State
	let documents = $state<Document[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Subscribe to documents collection
	$effect(() => {
		if (!selectedStudent) return;

		const documentsQuery = query(
			collection(db, 'documents'),
			where('studentId', '==', selectedStudent.id),
			where('status', '==', 'completed')
		);

		const unsubscribe = onSnapshot(
			documentsQuery,
			(snapshot) => {
				documents = snapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						...data,
						createdAt: data.createdAt?.toDate(),
						updatedAt: data.updatedAt?.toDate()
					} as Document;
				});
				isLoading = false;
			},
			(err) => {
				console.error('Error fetching documents:', err);
				error = 'Failed to load documents';
				isLoading = false;
			}
		);

		return unsubscribe;
	});

	/**
	 * Handles document selection and loading
	 */
	function handleDocumentClick(documentBody: string) {
		const currentContent = editorStore.getContent();

		if (!currentContent.trim()) {
			// If editor is empty, load directly
			editorStore.parseContent(documentBody);
		} else {
			// If editor has content, show confirmation
			modalStore.open('documentLoad', {
				documentToLoad: documentBody,
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
		if (text.length <= length) return text;
		return text.slice(0, length).trim() + '...';
	}
</script>

<div class="documents-container" role="region" aria-label="Student documents">
	<div class="header">
		<div class="title-section">
			<h2>{selectedStudent.name}'s Documents</h2>
			{#if selectedStudent.description}
				<p class="description">{selectedStudent.description}</p>
			{/if}
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
							onclick={() => handleDocumentClick(document.documentBody)}
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

<style>
	.documents-container {
		width: 400px;
		height: 100%;
		background: var(--background-secondary);
		display: flex;
		flex-direction: column;
	}

	.header {
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.title-section {
		flex: 1;
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.description {
		margin: var(--spacing-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.documents-section {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-4);
	}

	.document-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--spacing-4);
	}

	.document-item {
		width: 100%;
		text-align: left;
		background: var(--background-primary);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-4);
		transition: var(--transition-all);
		cursor: pointer;
	}

	.document-item:hover {
		border-color: var(--text-accent);
		box-shadow: var(--shadow-sm);
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
		margin-bottom: var(--spacing-2);
	}

	.document-title {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.document-date {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.document-preview {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
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
