<!-- File: src/routes/StudentDocuments.svelte -->
<script lang="ts">
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot } from 'firebase/firestore';
	import type { Student } from '$lib/schemas/student';
	import type { Document } from '$lib/schemas/document';
	import { editorStore } from '$lib/stores/editorStore';
	import { modalStore } from '$lib/stores/modalStore';

	// Props
	let { selectedStudent } = $props<{
		selectedStudent: Student;
	}>();

	// State
	let documents = $state<Document[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let documentToLoad = $state('');

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
				documents = snapshot.docs.map((doc) => doc.data() as Document);
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

	function handleDocumentClick(documentBody: string) {
		const currentContent = editorStore.getContent();

		if (!currentContent.trim()) {
			// If editor is empty, load directly
			editorStore.parseContent(documentBody);
		} else {
			// If editor has content, show confirmation modal
			documentToLoad = documentBody;
			modalStore.open('documentLoad');
		}
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
				{#each documents as document}
					<li>
						<div
							class="document-item"
							onclick={() => handleDocumentClick(document.documentBody)}
							onkeydown={(e) => e.key === 'Enter' && handleDocumentClick(document.documentBody)}
							role="button"
							tabindex="0"
						>
							<div class="document-header">
								<h3 class="document-title">{document.documentName}</h3>
								<span class="document-date">
									<!-- Convert from Firestore Timestamp to Date -->
									{new Date(document.createdAt.seconds * 1000).toLocaleDateString()}
								</span>
							</div>
							<p class="document-preview">
								{document.documentBody.slice(0, 150)}...
							</p>
						</div>
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
		padding: 1rem;
		border-bottom: 1px solid var(--background-modifier-border);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.title-section {
		flex: 1;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-normal);
	}

	.description {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.documents-section {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.document-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
	}

	.document-item {
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.5rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.document-item:hover {
		border-color: var(--text-accent);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.document-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.document-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-normal);
	}

	.document-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.document-preview {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.5;
		cursor: pointer;
	}

	.loading,
	.error,
	.empty-state {
		padding: 1rem;
		text-align: center;
		color: var(--text-muted);
	}

	.error {
		color: var(--error-color);
	}
</style>
