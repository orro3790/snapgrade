<!-- File: src/routes/DocumentDetails.svelte -->
<script lang="ts">
	import type { Document } from '$lib/schemas/document';
	import type { Class } from '$lib/schemas/class';
	import type { Student } from '$lib/schemas/student';
	import Button from '$lib/components/Button.svelte';
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
	
	// Props
	let { document, isProcessing, user, uid } = $props<{
		document: Document;
		isProcessing: boolean;
		user: App.Locals['user'];
		uid: string;
	}>();
	
	// State
	let classes = $state<Class[]>([]);
	let students = $state<Student[]>([]);
	let selectedClassId = $state(document.classId || '');
	let selectedStudentId = $state(document.studentId || '');
	let isSaving = $state(false);
	let saveSuccess = $state(false);
	
	// Load classes on mount
	$effect(() => {
		if (uid && user) {
			loadClassesFromFirestore();
		}
	});
	
	// Load students when class changes
	$effect(() => {
		if (selectedClassId) {
			loadStudentsFromFirestore(selectedClassId);
		} else {
			students = [];
		}
	});
	
	// Track if this is the initial load
	let isInitialLoad = $state(true);
	let saveTimer = $state<NodeJS.Timeout | null>(null);
	
	// Auto-save when selections change
	$effect(() => {
		// Explicitly reference the selection variables to track changes
		const currentClassId = selectedClassId;
		const currentStudentId = selectedStudentId;
		
		// Skip auto-save on initial load
		if (isInitialLoad) {
			isInitialLoad = false;
			return;
		}
		
		// Only save if we have valid selections and document
		if (document.id && !isSaving) {
			// Clear any existing timer
			if (saveTimer) {
				clearTimeout(saveTimer);
			}
			
			// Set a new timer to save after a delay
			saveTimer = setTimeout(() => {
				saveAssignment();
				saveTimer = null;
			}, 500);
			
			return () => {
				if (saveTimer) {
					clearTimeout(saveTimer);
				}
			};
		}
	});
	
	function loadClassesFromFirestore() {
		if (!uid || !user || !user.classes || user.classes.length === 0) {
			console.log('No classes found for user');
			classes = [];
			return;
		}
		
		try {
			console.log('Loading classes from Firestore for user:', uid);
			console.log('User classes:', user.classes);
			
			const classesQuery = query(
				collection(db, 'classes'),
				where('id', 'in', user.classes || [])
			);
			
			const unsubscribeSnapshot = onSnapshot(
				classesQuery,
				(snapshot) => {
					classes = snapshot.docs.map((doc) => ({
						...doc.data(),
						id: doc.id,
						metadata: {
							createdAt: doc.data().metadata?.createdAt,
							updatedAt: doc.data().metadata?.updatedAt
						}
					})) as Class[];
					console.log('Classes loaded from Firestore:', classes);
				},
				(err) => {
					console.error('Firestore error:', err);
					classes = [];
				}
			);
			
			return () => unsubscribeSnapshot();
		} catch (err) {
			console.error('Error loading classes from Firestore:', err);
			classes = [];
		}
	}
	
	function loadStudentsFromFirestore(classId: string) {
		if (!classId) {
			students = [];
			return;
		}
		
		try {
			console.log('Loading students from Firestore for class:', classId);
			
			const studentsQuery = query(
				collection(db, 'students'),
				where('classId', '==', classId),
				where('status', '==', 'active')
			);
			
			const unsubscribeSnapshot = onSnapshot(
				studentsQuery,
				(snapshot) => {
					students = snapshot.docs.map((doc) => ({
						...doc.data(),
						id: doc.id,
						metadata: {
							createdAt: doc.data().metadata?.createdAt,
							updatedAt: doc.data().metadata?.updatedAt
						}
					})) as Student[];
					console.log('Students loaded from Firestore:', students);
				},
				(err) => {
					console.error('Firestore error loading students:', err);
					students = [];
				}
			);
			
			return () => unsubscribeSnapshot();
		} catch (err) {
			console.error('Error loading students from Firestore:', err);
			students = [];
		}
	}
	
	async function saveAssignment() {
		isSaving = true;
		saveSuccess = false;
		
		try {
			const selectedClass = classes.find(c => c.id === selectedClassId);
			const selectedStudent = students.find(s => s.id === selectedStudentId);
			
			const response = await fetch('/api/documents/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentId: document.id,
					classId: selectedClassId,
					className: selectedClass?.name || '',
					studentId: selectedStudentId,
					studentName: selectedStudent?.name || ''
				})
			});
			
			if (!response.ok) throw new Error('Failed to update document');
			
			// Update local document data
			document.classId = selectedClassId;
			document.className = selectedClass?.name || '';
			document.studentId = selectedStudentId;
			document.studentName = selectedStudent?.name || '';
			
			saveSuccess = true;
			
			// Reset success message after 3 seconds
			setTimeout(() => {
				saveSuccess = false;
			}, 3000);
			
		} catch (err) {
			console.error('Error saving assignment:', err);
		} finally {
			isSaving = false;
		}
	}
	
	function formatDate(date: Date) {
		return date.toLocaleString();
	}
	
	function openInEditor() {
		window.location.href = `/editor?documentId=${document.id}`;
	}
</script>

<div class="document-details-container">
	<div class="details-content">
		{#if isProcessing}
			<div class="processing-state">
				<p>Processing document...</p>
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
				
				<div class="metadata-item">
					<span class="metadata-label">Class:</span>
					<div class="select-container">
						<select
							bind:value={selectedClassId}
							onchange={() => selectedStudentId = ''}
							disabled={isSaving}
						>
							<option value="">Select Class</option>
							{#each classes as classItem}
								<option value={classItem.id}>{classItem.name}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="metadata-item">
					<span class="metadata-label">Student:</span>
					<div class="select-container">
						<select
							bind:value={selectedStudentId}
							disabled={!selectedClassId || isSaving}
						>
							<option value="">Select Student</option>
							{#each students as student}
								<option value={student.id}>{student.name}</option>
							{/each}
						</select>
					</div>
				</div>
				
				{#if saveSuccess}
					<div class="save-container">
						<span class="save-success">Assignment saved successfully!</span>
					</div>
				{/if}
				
				{#if document.sourceType === 'llmwhisperer'}
					<div class="source-info">
						<div class="metadata-item">
							<span class="metadata-label">Source:</span>
							<span class="metadata-value">Discord Bot</span>
						</div>
						
						{#if document.sourceMetadata?.llmProcessed}
							<div class="metadata-item">
								<span class="metadata-label">Processed:</span>
								<span class="metadata-value">{document.sourceMetadata.llmProcessedAt ? formatDate(document.sourceMetadata.llmProcessedAt) : 'Yes'}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
			
			<div class="document-preview">
				<div class="preview-header">
					<h3>Preview</h3>
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
						<p class="preview-text">{document.documentBody.substring(0, 500)}...</p>
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
	}
	
	.details-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		background: var(--background-primary);
	}
	
	.action-buttons {
		display: flex;
		gap: var(--spacing-2);
	}
	
	.action-button {
		padding: var(--spacing-2) var(--spacing-4);
		border-radius: var(--radius-base);
		border: none;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-all);
	}
	
	.action-button.primary {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}
	
	.action-button.primary:hover:not(:disabled) {
		background: var(--interactive-accent-hover);
	}
	
	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.details-content {
		flex: 1;
		padding: var(--spacing-4);
		overflow-y: auto;
	}
	
	.processing-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		color: var(--text-muted);
	}
	
	.document-metadata {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		margin-bottom: var(--spacing-6);
	}
	
	.metadata-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}
	
	h3 {
		margin: 0 0 var(--spacing-2) 0;
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		padding-bottom: var(--spacing-2);
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
	
	.metadata-item select {
		width: 100%;
		padding: var(--spacing-2);
		background: var(--background-alt);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-base);
		color: var(--text-normal);
		font-size: var(--font-size-sm);
	}
	
	.metadata-item select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.save-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
	}
	
	.save-button {
		padding: var(--spacing-2) var(--spacing-4);
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: var(--radius-base);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-all);
	}
	
	.save-button:hover:not(:disabled) {
		background: var(--interactive-accent-hover);
	}
	
	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.save-success {
		color: var(--status-success);
		font-size: var(--font-size-sm);
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
	}
	
	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-3);
	}
	
	.preview-actions {
		display: flex;
		gap: var(--spacing-2);
	}
	
	.preview-content {
		max-height: 300px;
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