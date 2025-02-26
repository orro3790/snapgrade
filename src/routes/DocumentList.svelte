<!-- File: src/routes/DocumentList.svelte -->
<script lang="ts">
	import type { Document } from '$lib/schemas/document';
	import { DocumentStatus } from '$lib/schemas/document';
	import Button from '$lib/components/Button.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	
	// Props
	let { filters, onDocumentSelect, onBatchAction, user, uid } = $props<{
		filters: any;
		onDocumentSelect: (document: Document) => void;
		onBatchAction: (action: string, documentIds: string[]) => void;
		user: any;
		uid: string;
	}>();
	
	// State
	let documents = $state<Document[]>([]);
	let selectedDocumentIds = $state<string[]>([]);
	let isLoading = $state(true);
	let isProcessing = $state(false);
	let error = $state<string | null>(null);
	
	// Load documents based on filters
	$effect(() => {
		// Explicitly reference filter properties to track changes
		const { classId, studentId, status, dateRange } = filters;
		
		// Now loadDocuments will only run when these specific properties change
		loadDocuments();
	});
	
	async function loadDocuments() {
		isLoading = true;
		error = null;
		
		try {
			const response = await fetch('/api/documents/list', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ filters })
			});
			
			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			
			// Convert ISO date strings back to Date objects
			documents = data.documents.map((doc: any) => ({
				...doc,
				createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
				updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null
			}));
			
		} catch (err) {
			console.error('Error loading documents:', err);
			error = 'Failed to load documents. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	function handleSelectAll(event: MouseEvent) {
		if ((event.target as HTMLInputElement).checked) {
			selectedDocumentIds = documents.map(doc => doc.id);
		} else {
			selectedDocumentIds = [];
		}
	}
	
	function handleSelectDocument(docId: string, event: Event | MouseEvent) {
		if ((event.target as HTMLInputElement).checked) {
			selectedDocumentIds = [...selectedDocumentIds, docId];
		} else {
			selectedDocumentIds = selectedDocumentIds.filter(id => id !== docId);
		}
	}
	function handleDocumentClick(doc: Document) {
		onDocumentSelect(doc);
	}
	
	async function handleBatchAction(action: string, documentIds: string[]) {
		if (action === 'delete') {
			if (!confirm(`Are you sure you want to delete ${documentIds.length} document(s)?`)) {
				return;
			}
		}
		
		isProcessing = true;
		
		try {
			const response = await fetch('/api/documents/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action,
					documentIds
				})
			});
			
			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
			
			const result = await response.json();
			console.log(result.message);
			
			// Refresh document list
			loadDocuments();
			
			// Clear selection
			selectedDocumentIds = [];
			
			// Call the parent handler
			onBatchAction(action, documentIds);
			
		} catch (err) {
			console.error(`Error performing ${action}:`, err);
			error = `Failed to ${action} documents. Please try again.`;
		} finally {
			isProcessing = false;
		}
	}
</script>

<div class="document-list-container">
	<div class="document-list-header">
		<!-- Batch actions -->
		<div class="batch-actions">
			<Checkbox
				checked={selectedDocumentIds.length === documents.length && documents.length > 0}
				indeterminate={selectedDocumentIds.length > 0 && selectedDocumentIds.length < documents.length}
				disabled={documents.length === 0}
				onclick={(e: MouseEvent) => handleSelectAll(e)}
				label="Select All"
			/>
			
			<div class="action-buttons">
				<Button
					label={isProcessing ? 'Deleting...' : 'Delete'}
					type="secondary"
					disabled={selectedDocumentIds.length === 0 || isProcessing}
					ClickFunction={() => handleBatchAction('delete', selectedDocumentIds)}
					size="small"
					isLoading={isProcessing}
				/>
			</div>
		</div>
	</div>
	
	{#if isLoading}
		<div class="loading-state">Loading documents...</div>
	{:else if error}
		<div class="error-state">{error}</div>
	{:else if documents.length === 0}
		<div class="empty-state">
			<p>No documents found matching your filters.</p>
		</div>
	{:else}
		<div class="document-items">
			{#each documents as doc}
				<div
					class="document-item"
					class:selected={selectedDocumentIds.includes(doc.id)}
					onclick={() => handleDocumentClick(doc)}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleDocumentClick(doc);
						}
					}}
					role="button"
					tabindex="0"
					aria-label={`Document: ${doc.documentName}`}
				>
					<div class="document-select">
						<input
							type="checkbox"
							checked={selectedDocumentIds.includes(doc.id)}
							onchange={(e: Event) => handleSelectDocument(doc.id, e)}
							onclick={(e: MouseEvent) => e.stopPropagation()}
							class="custom-checkbox"
						/>
					</div>
					
					<div class="document-info">
						<div class="document-title">{doc.documentName}</div>
						<div class="document-meta">
							<span class="document-class">{doc.className}</span>
							<span class="document-student">{doc.studentName}</span>
							<span class="document-date">{doc.createdAt.toLocaleDateString()}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.document-list-container {
		width: 350px;
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
		background: var(--background-secondary);
	}
	
	.document-list-header {
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
	}
	
	.batch-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: var(--spacing-2);
	}
	
	.action-buttons {
		display: flex;
		gap: var(--spacing-2);
	}
	
	.document-items {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-2);
	}
	
	.document-item {
		display: flex;
		align-items: center;
		padding: var(--spacing-2);
		border-radius: var(--radius-base);
		margin-bottom: var(--spacing-2);
		background: var(--background-primary);
		border: var(--border-width-thin) solid transparent;
		cursor: pointer;
		transition: var(--transition-all);
	}
	
	.document-item:hover {
		background: var(--background-modifier-hover);
	}
	
	.document-item.selected {
		border-color: var(--interactive-accent);
	}
	
	.document-select {
		margin-right: var(--spacing-2);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
	}
	
	.custom-checkbox {
		appearance: none;
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border: 2px solid var(--background-modifier-border);
		border-radius: var(--radius-sm);
		background-color: var(--background-alt);
		display: inline-block;
		position: relative;
		cursor: pointer;
		transition: var(--transition-all);
		padding: 0;
	}
	
	.custom-checkbox:checked {
		background-color: var(--interactive-accent);
		border-color: var(--interactive-accent);
	}
	
	.custom-checkbox:checked::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 1px;
		width: 4px;
		height: 8px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}
	
	.custom-checkbox:indeterminate {
		background-color: var(--interactive-accent);
		border-color: var(--interactive-accent);
	}
	
	.custom-checkbox:indeterminate::after {
		content: '';
		position: absolute;
		left: 3px;
		top: 6px;
		width: 8px;
		height: 2px;
		background-color: white;
	}
	
	.custom-checkbox:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--interactive-accent-secondary);
	}
	
	.document-info {
		flex: 1;
		min-width: 0;
	}
	
	.document-title {
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.document-meta {
		display: flex;
		gap: var(--spacing-2);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-top: var(--spacing-1);
	}
	

	

	

	

	

	
	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		color: var(--text-muted);
		text-align: center;
		padding: var(--spacing-4);
	}
	
	.error-state {
		color: var(--status-error);
	}
</style>