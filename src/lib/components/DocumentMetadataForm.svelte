<!-- File: src/lib/components/DocumentMetadataForm.svelte -->
<script lang="ts">
	/**
	 * This component handles class and student selection with minimal re-renders.
	 * It uses local state for the UI while still syncing with the documentStore.
	 */
	import StatusNotification from '$lib/components/StatusNotification.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { documentStore } from '$lib/stores/documentStore.svelte';
	import { onMount } from 'svelte';
	import type { Document } from '$lib/schemas/document';
	import type { Class } from '$lib/schemas/class';
	import type { Student } from '$lib/schemas/student';
	import { fade } from 'svelte/transition';

	// Props - only require what's necessary to function
	const { documentId, initialClassId, initialStudentId } = $props<{
		documentId: string;
		initialClassId: string;
		initialStudentId: string;
	}>();

	// Get data from store
	let classes = $derived(documentStore.classes);
	let students = $derived(documentStore.students);

	// Local state that won't cause parent re-renders
	let selectedClassId = $state(initialClassId || '');
	let selectedStudentId = $state(initialStudentId || '');
	let isSavingClass = $state(false);
	let isSavingStudent = $state(false);
	let saveSuccess = $state(false);
	let saveTimer = $state<NodeJS.Timeout | null>(null);

	// Initialize on mount
	onMount(() => {
		// If there's a class ID, load students for that class
		if (initialClassId) {
			documentStore.loadStudentsForClass(initialClassId);
		}
		
		return () => {
			// Cleanup timer on unmount
			if (saveTimer) {
				clearTimeout(saveTimer);
			}
		};
	});

	/**
	 * Handle class selection change
	 */
	function handleClassChange(event: Event) {
		const newClassId = (event.target as HTMLSelectElement).value;
		
		// Skip if unchanged to prevent unnecessary processing
		if (newClassId === selectedClassId) return;
		
		selectedClassId = newClassId;
		selectedStudentId = ''; // Reset student when class changes
		
		// Load students for the new class
		if (newClassId) {
			documentStore.loadStudentsForClass(newClassId);
		}
		
		// Save the class change
		saveClassSelection();
	}

	/**
	 * Handle student selection change
	 */
	function handleStudentChange(event: Event) {
		const newStudentId = (event.target as HTMLSelectElement).value;
		
		// Skip if unchanged to prevent unnecessary processing
		if (newStudentId === selectedStudentId) return;
		
		selectedStudentId = newStudentId;
		saveStudentSelection();
	}

	/**
	 * Save class selection to Firestore with enhanced error handling
	 */
	async function saveClassSelection() {
		if (!documentId || isSavingClass) return;
		
		isSavingClass = true;
		saveSuccess = false;
		
		try {
			const selectedClass = classes.find(c => c.id === selectedClassId);
			
			// Optimistic UI update for class change alone
			if (selectedClass) {
				// Create update payload with proper typing
				const updatePayload = {
					classId: selectedClassId,
					className: selectedClass.name || '',
					// Reset student if class changes
					studentId: '',
					studentName: ''
				};
				
				// Pass false for the setProcessingFlag to avoid UI blocking
				const success = await documentStore.updateDocument(
					documentId,
					updatePayload,
					false
				);
				
				if (success) {
					showSuccessMessage();
				} else {
					// Handle failure without throwing - allows UI to continue functioning
					console.warn('Unable to update class selection, but continuing UI operation');
					// Reset to previous value on failure if needed
					// selectedClassId = initialClassId;
				}
			}
		} catch (err) {
			console.error('Error saving class selection:', err);
			// We're intentionally not re-throwing to prevent UI disruption
		} finally {
			isSavingClass = false;
		}
	}

	/**
	 * Save student selection to Firestore with enhanced error handling
	 */
	async function saveStudentSelection() {
		if (!documentId || isSavingStudent) return;
		
		isSavingStudent = true;
		saveSuccess = false;
		
		try {
			const selectedStudent = students.find(s => s.id === selectedStudentId);
			
			if (selectedStudent) {
				// Student selected
				
				// Find the currently selected class
				const selectedClass = classes.find(c => c.id === selectedClassId);
				if (!selectedClass) {
					console.error('Cannot update student without a selected class');
					return;
				}
				
				// Create update payload with both class and student info
				const updatePayload = {
					// Include class information to satisfy API requirements
					classId: selectedClassId,
					className: selectedClass.name || '',
					// Student information
					studentId: selectedStudentId,
					studentName: selectedStudent.name || ''
				};
				
				// Prepare update payload
				
				// Pass false for the setProcessingFlag to avoid UI blocking
				const success = await documentStore.updateDocument(
					documentId,
					updatePayload,
					false
				);
				
				if (success) {
					showSuccessMessage();
				} else {
					// Handle failure without throwing - allows UI to continue functioning
					console.warn('Unable to update student selection, but continuing UI operation');
					// Reset to previous value on failure if needed
					// selectedStudentId = initialStudentId;
				}
			} else {
				// Cannot update with invalid student selection
			}
		} catch (err) {
			console.error('Error saving student selection:', err);
			if (err instanceof Error) {
				console.error('Error details:', err.message);
			}
			// We're intentionally not re-throwing to prevent UI disruption
		} finally {
			isSavingStudent = false;
		}
	}

	/**
	 * Show success message with auto-dismiss
	 */
	function showSuccessMessage() {
		saveSuccess = true;
		
		// Auto-dismiss success message
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		
		saveTimer = setTimeout(() => {
			saveSuccess = false;
			saveTimer = null;
		}, 3000);
	}
</script>

<div class="metadata-form">
	<div class="metadata-item">
		<span class="metadata-label">Class:</span>
		<div class="select-container">
			<select
				value={selectedClassId}
				onchange={handleClassChange}
				disabled={isSavingClass}
				aria-label="Select class"
			>
				<option value="">Select Class</option>
				{#each classes as classItem}
					<option value={classItem.id}>{classItem.name}</option>
				{/each}
			</select>
			{#if isSavingClass}
				<div class="field-loading">
					<Spinner size={16} variant="dots" color="var(--interactive-accent)" />
				</div>
			{/if}
		</div>
	</div>
	
	<div class="metadata-item">
		<span class="metadata-label">Student:</span>
		<div class="select-container">
			<select
				value={selectedStudentId}
				onchange={handleStudentChange}
				disabled={!selectedClassId || isSavingStudent}
				aria-label="Select student"
			>
				<option value="">Select Student</option>
				{#each students as student}
					<option value={student.id}>{student.name}</option>
				{/each}
			</select>
			{#if isSavingStudent}
				<div class="field-loading">
					<Spinner size={16} variant="dots" color="var(--interactive-accent)" />
				</div>
			{/if}
		</div>
	</div>
	
	{#if saveSuccess}
		<div class="save-container" transition:fade={{ duration: 200 }}>
			<StatusNotification type="success">
				Assignment saved successfully!
			</StatusNotification>
		</div>
	{/if}
</div>

<style>
	.metadata-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
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
	
	.select-container {
		width: 250px;
		position: relative;
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
	
	.field-loading {
		position: absolute;
		right: -30px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.save-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-top: var(--spacing-2);
	}
</style>