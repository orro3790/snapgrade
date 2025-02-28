<!-- File: src/routes/DocumentDetails.svelte -->
<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import DocumentMetadataForm from '$lib/components/DocumentMetadataForm.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { documentStore } from '$lib/stores/documentStore.svelte';
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { modalStore } from '$lib/stores/modalStore.svelte';
	
	// Derived values from store - using read-only derivation to prevent unnecessary re-renders
	let document = $derived.by(() => documentStore.selectedDocument);
	let isProcessing = $derived.by(() => documentStore.isProcessing);
	
	function formatDate(date: Date) {
		return date.toLocaleString();
	}
	
	function openInEditor() {
		if (!document) return;
		
		try {
			// Set the editor mode to formatting
			editorStore.mode = 'formatting';
			
			// Create editor data for localStorage
			const editorData = {
				documentName: document.documentName,
				mode: 'formatting',
				timestamp: Date.now()
			};
			
			// Save to localStorage for persistence
			localStorage.setItem('snapgrade_editor_data', JSON.stringify(editorData));
			
			if (document.compressedNodes) {
				try {
					// 1. First set empty document with the correct name
					editorStore.setDocument('', document.documentName);
					
					// 2. Load the compressed nodes directly into the editor
					editorStore.loadCompressedContent(document.compressedNodes);
					
					// 3. Save compressed nodes to localStorage
					localStorage.setItem('snapgrade_editor_compressed_nodes', document.compressedNodes);
					localStorage.setItem('snapgrade_editor_use_compressed', 'true');
				} catch (parseError) {
					// Fallback to raw text if there's an error with compressed nodes
					editorStore.setDocument(document.documentBody, document.documentName);
					
					// Save raw content to localStorage
					localStorage.setItem('snapgrade_editor_raw_content', document.documentBody);
					localStorage.setItem('snapgrade_editor_use_compressed', 'false');
				}
			} else {
				// For raw text, use setDocument to set both content and name
				editorStore.setDocument(document.documentBody, document.documentName);
				
				// Save raw content to localStorage
				localStorage.setItem('snapgrade_editor_raw_content', document.documentBody);
				localStorage.setItem('snapgrade_editor_use_compressed', 'false');
			}
			
			// Close the modal to reveal the editor with the loaded document
			modalStore.close();
		} catch (error) {
			// Handle errors silently or display a user-friendly message if needed
		}
	}
</script>

<div class="document-details-container">
	<div class="details-content">
		{#if isProcessing}
			<div class="processing-state">
				<Spinner size={32} variant="dots" color="var(--interactive-accent)" />
				<p>Processing document...</p>
			</div>
		{:else if !document}
			<div class="empty-state">
				<p>No document selected</p>
			</div>
		{:else}
			<div class="document-metadata">
				<div class="metadata-item">
					<span class="metadata-label">Name:</span>
					<span class="metadata-value">{document.documentName}</span>
				</div>
				
				<div class="metadata-item">
					<span class="metadata-label">Status:</span>
					<span class="metadata-value status-{document.status.toLowerCase()}">{document.status}</span>
				</div>
				
				<div class="metadata-item">
					<span class="metadata-label">Created:</span>
					<span class="metadata-value">{formatDate(document.createdAt)}</span>
				</div>
				
				<div class="metadata-item">
					<span class="metadata-label">Updated:</span>
					<span class="metadata-value">{formatDate(document.updatedAt)}</span>
				</div>
				
				<!-- Isolated component for metadata fields to prevent full component re-renders -->
				<DocumentMetadataForm
					documentId={document.id}
					initialClassId={document.classId || ''}
					initialStudentId={document.studentId || ''}
				/>
				
				<!-- Source info section removed -->
			</div>
			
			<div class="document-preview">
				<div class="preview-header">
					<div class="preview-actions">
						<Button
							label="Open in Editor"
							type="primary"
							ClickFunction={openInEditor}
							disabled={isProcessing}
							size="small"
						/>
					</div>
				</div>
				<div class="preview-content">
					{#if document.documentBody}
						<p class="preview-text normalized">
							{document.documentBody.substring(0, 500).replace(/\s+/g, ' ')}
							{document.documentBody.length > 500 ? '...' : ''}
						</p>
					{:else}
						<p class="preview-empty">No content available</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.document-details-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: var(--background-secondary);
		overflow: hidden;
		height: 100%;
	}
	
	.details-content {
		flex: 1;
		padding: var(--spacing-4);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	
	.processing-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-3);
		height: 200px;
		color: var(--text-muted);
	}
	
	.document-metadata {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		margin-bottom: var(--spacing-6);
	}
	
	.metadata-item {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
	}
	
	.metadata-label {
		font-weight: var(--font-weight-medium);
		color: var(--text-muted);
		width: 80px;
		flex-shrink: 0;
	}
	
	.metadata-value {
		color: var(--text-normal);
	}
	
	.select-container {
		width: 250px;
	}

	.save-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
	}
	
	.source-info {
		margin-top: var(--spacing-4);
		padding-top: var(--spacing-4);
		border-top: var(--border-width-thin) solid var(--background-modifier-border);
	}
	
	.status-unedited,
	.status-edited,
	.status-completed {
		display: inline-block;
		padding: var(--spacing-0-5) var(--spacing-1);
		border-radius: var(--radius-base);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
	}
	
	.status-unedited {
		background: var(--status-info);
		color: var(--text-on-accent);
	}
	
	.status-edited {
		background: var(--status-warning);
		color: var(--background-primary);
	}
	
	.status-completed {
		background: var(--status-success);
		color: var(--text-on-accent);
	}
	
	.document-preview {
		background: var(--background-alt);
		border-radius: var(--radius-base);
		padding: var(--spacing-4);
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}
	
	.preview-header {
		display: flex;
		justify-content: flex-end; /* Already aligned to the right */
		align-items: center;
		margin-bottom: var(--spacing-3);
	}
	
	.preview-actions {
		display: flex;
		gap: var(--spacing-2);
	}
	
	.preview-content {
		flex: 1;
		overflow-y: auto;
		margin-top: var(--spacing-2);
	}
	
	.preview-text {
		white-space: pre-wrap;
		font-family: 'Geist', monospace;
		line-height: var(--line-height-relaxed);
	}
	
	.preview-empty {
		color: var(--text-muted);
		font-style: italic;
	}
</style>