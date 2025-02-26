<!-- File: src/routes/DocumentBay.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import type { Document } from '$lib/schemas/document';
	import type { DocumentSession } from '$lib/schemas/documentSession';
	import type { SuperValidated } from 'sveltekit-superforms';
	
	// Props
	let { data } = $props<{
		data: {
			documentForm: SuperValidated<any>;
			user: App.Locals['user'];
			uid: App.Locals['uid'];
		};
	}>();
	
	import DocumentList from './DocumentList.svelte';
	import DocumentDetails from './DocumentDetails.svelte';
	import DocumentFilters from './DocumentFilters.svelte';
	
	// State
	let selectedDocument = $state<Document | null>(null);
	let isProcessing = $state(false);
	let filters = $state({
		classId: '',
		studentId: '',
		status: '',
		dateRange: {
			start: null,
			end: null
		}
	});
	
	function closeModal() {
		modalStore.close();
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
	
	function handleDocumentSelect(document: Document) {
		selectedDocument = document;
		isProcessing = false;
	}
	
	function handleFilterChange(newFilters: any) {
		filters = { ...filters, ...newFilters };
	}
	
	async function handleBatchAction(action: string, documentIds: string[]) {
		// Handle batch actions like assign, delete, etc.
		isProcessing = true;
		
		try {
			// For assign action, we would need to get class and student details
			// This is a simplified version - in a real implementation, you would
			// show a selection UI for class and student before proceeding
			let payload: any = { action, documentIds };
			
			if (action === 'assign') {
				// In a real implementation, these would come from a selection UI
				// For now, we'll just use placeholder values
				payload = {
					...payload,
					classId: 'selectedClassId',
					className: 'Selected Class',
					studentId: 'selectedStudentId',
					studentName: 'Selected Student'
				};
			}
			
			// Call the server action
			const response = await fetch('?/manageDocuments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			
			const result = await response.json();
			
			if (result.error) {
				console.error('Error in batch operation:', result.error);
				// Show error notification
			} else {
				// Show success notification
				console.log('Batch operation successful:', result.message);
				
				// Refresh document list
				if (action === 'delete') {
					selectedDocument = null;
				}
			}
		} catch (error) {
			console.error('Error performing batch action:', error);
			// Show error notification
		} finally {
			isProcessing = false;
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
<div class="document-bay-modal" role="dialog" aria-labelledby="modal-title">
	<div class="modal-header">
		<h1 id="modal-title">Document Bay</h1>
		<button
			type="button"
			class="close-button"
			onclick={closeModal}
			aria-label="Close document bay"
		>
			×
		</button>
	</div>

	<div class="modal-content">
		<!-- Column 1: Document Filters -->
		<DocumentFilters
			onFilterChange={handleFilterChange}
			user={data.user}
			uid={data.uid}
		/>

		<!-- Column 2: Document List -->
		<DocumentList
			onDocumentSelect={handleDocumentSelect}
			onBatchAction={handleBatchAction}
			filters={filters}
			user={data.user}
			uid={data.uid}
		/>

		<!-- Column 3: Document Details -->
		{#if selectedDocument}
			<DocumentDetails
				document={selectedDocument}
				isProcessing={isProcessing}
			/>
		{/if}
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

	.document-bay-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		border-radius: var(--radius-lg);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		box-shadow: var(--shadow-xl);
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
		background: var(--background-primary);
	}

	h1 {
		margin: 0;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.close-button {
		background: none;
		border: none;
		font-size: var(--font-size-2xl);
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
		display: flex;
		overflow: hidden;
	}

	/* Column transition animations */
	:global(.document-bay-modal .document-details-container) {
		animation: slideIn var(--transition-duration-300) var(--transition-timing-ease-out);
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