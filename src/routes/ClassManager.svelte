<!-- File: src/routes/ClassManager.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';
	import ConfirmationPopover from '$lib/components/ConfirmationPopover.svelte';
	import XIcon from '$lib/icons/XIcon.svelte';
	import { onMount, onDestroy } from 'svelte';

	// Props
	let { data } = $props<{
		data: {
			classForm: SuperValidated<any>;
			studentForm: SuperValidated<any>;
			user: App.Locals['user'];
			uid: App.Locals['uid'];
		};
	}>();
	
	import ClassDetails from './ClassDetails.svelte';
	import StudentDocuments from './StudentDocuments.svelte';
	import ClassForm from './ClassForm.svelte';
	import StudentForm from './StudentForm.svelte';
	import { classManagerStore } from '$lib/stores/classManagerStore.svelte';
	import ClassList from './ClassList.svelte';

	// Track cleanup function
	let cleanup: (() => void) | undefined;
	
	// Initialize the class manager store on mount, not with $effect
	onMount(() => {
		if (data.user && data.uid) {
			// Store the cleanup function
			cleanup = classManagerStore.initializeWithUser(data.user, data.uid);
		}
	});
	
	// Clean up when component is destroyed
	onDestroy(() => {
		if (cleanup) {
			cleanup();
		}
	});
	
	// Access store values directly via reactive getters
	const selectedClass = $derived(classManagerStore.selectedClass);
	const selectedStudent = $derived(classManagerStore.selectedStudent);
	const isEditingClass = $derived(classManagerStore.isEditingClass);
	const isAddingStudent = $derived(classManagerStore.isAddingStudent);
	const isEditingStudent = $derived(classManagerStore.isEditingStudent);
	const showDeleteClassConfirm = $derived(classManagerStore.showDeleteClassConfirm);
	const showDeleteStudentConfirm = $derived(classManagerStore.showDeleteStudentConfirm);
	
	// Initialize forms
	const { form: classForm } = superForm(data.classForm, {
		dataType: 'json',
		id: 'class-form'
	});
	const { form: studentForm } = superForm(data.studentForm, {
		dataType: 'json',
		id: 'student-form'
	});

	// We'll set these up with $effect to keep them synchronized with store state
	$effect(() => {
		// Only update form if we really need to (breaks circular dependency)
		if (isEditingClass && selectedClass) {
			// Only update if substantially different to avoid loops
			const isDifferent = !$classForm ||
				$classForm.id !== selectedClass.id ||
				$classForm.name !== selectedClass.name;
				
			if (isDifferent) {
				// Create a deep copy to ensure all properties are properly copied
				$inspect('Updating class form with selected class:', selectedClass);
				$inspect('Selected class ID:', selectedClass.id);
				
				// Explicitly set all properties to ensure ID is preserved
				$classForm = {
					id: selectedClass.id,
					name: selectedClass.name,
					description: selectedClass.description || '',
					students: selectedClass.students || [],
					status: selectedClass.status || 'active',
					metadata: {
						createdAt: selectedClass.metadata?.createdAt || new Date(),
						updatedAt: selectedClass.metadata?.updatedAt || new Date()
					}
				};
				
				$inspect('Updated class form:', $classForm);
				$inspect('Updated class form ID:', $classForm.id);
			}
		} else if (isEditingClass && !selectedClass) {
			// New class - only update if not already a new class template
			const hasExistingData = $classForm && ($classForm.id || $classForm.name);
			
			if (hasExistingData) {
				$classForm = {
					name: '',
					description: '',
					students: [],
					status: 'active',
					id: '',
					metadata: {
						createdAt: new Date(),
						updatedAt: new Date()
					}
				};
			}
		}
	});
	
	$effect(() => {
		if ((isAddingStudent || isEditingStudent) && selectedClass) {
			if (isEditingStudent && selectedStudent) {
				// Only update if substantially different
				const isDifferent = !$studentForm ||
					$studentForm.id !== selectedStudent.id ||
					$studentForm.name !== selectedStudent.name;
					
				if (isDifferent) {
					$studentForm = { ...selectedStudent };
				}
			} else {
				// New student - only update if not already a new student template
				const hasExistingData = $studentForm &&
					($studentForm.id ||
					($studentForm.classId !== selectedClass.id && $studentForm.classId));
				
				if (hasExistingData) {
					$studentForm = {
						name: '',
						description: '',
						classId: selectedClass.id,
						notes: [],
						status: 'active',
						id: '',
						metadata: {
							createdAt: new Date(),
							updatedAt: new Date()
						}
					};
				}
			}
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

	function handleFormCancel() {
		// Clear form state when canceling
		if (isEditingClass) {
			$classForm = {
				name: '',
				description: '',
				students: [],
				status: 'active',
				id: '',
				metadata: {
					createdAt: new Date(),
					updatedAt: new Date()
				}
			};
		}
		
		if (isAddingStudent || isEditingStudent) {
			$studentForm = {
				name: '',
				description: '',
				classId: selectedClass?.id || '',
				notes: [],
				status: 'active',
				id: '',
				metadata: {
					createdAt: new Date(),
					updatedAt: new Date()
				}
			};
		}
		
		classManagerStore.cancelOperation();
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
<div class="class-manager-modal" role="dialog" aria-labelledby="modal-title">
	<div class="modal-header">
		<h1 id="modal-title">Class Manager</h1>
		<div
			role="button"
			tabindex="0"
			class="close-button"
			onclick={closeModal}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					closeModal();
				} else if (e.key === 'Escape') {
					handleKeydown(e);
				}
			}}
			aria-label="Close class manager"
		>
			<XIcon size="1.5rem" stroke="var(--text-muted)" />
		</div>
	</div>

	<div class="modal-content">
		<!-- Column 1: Class List - Now uses the store -->
		<ClassList />

		<!-- Column 2: Class Form or Details - Now uses the store -->
		{#if isEditingClass}
			<ClassForm
				data={{
					...data.classForm,
					data: $classForm
				}}
				onCancel={handleFormCancel}
				isEditing={selectedClass !== null && selectedClass.id !== ''}
			/>
		{:else if selectedClass}
			<div class="class-details-wrapper">
				<ClassDetails />
				
				{#if showDeleteClassConfirm}
					<ConfirmationPopover
						message="Are you sure you want to delete this class? This action cannot be undone."
						onConfirm={() => classManagerStore.deleteClass()}
						onCancel={() => classManagerStore.cancelDelete()}
					/>
				{/if}
			</div>
		{/if}
		
		<!-- Column 3: Student Form or Documents - Now uses the store -->
		{#if (isAddingStudent || isEditingStudent) && selectedClass}
			<StudentForm
				data={{
					...data.studentForm,
					data: $studentForm
				}}
				onCancel={handleFormCancel}
				classId={selectedClass.id}
				isEditing={isEditingStudent && selectedStudent !== null && selectedStudent.id !== ''}
			/>
		{:else if selectedStudent}
			<div class="student-documents-container">
				<StudentDocuments />
				
				{#if showDeleteStudentConfirm}
					<ConfirmationPopover
						message="Are you sure you want to delete this student? This action cannot be undone."
						onConfirm={() => classManagerStore.deleteStudent()}
						onCancel={() => classManagerStore.cancelDelete()}
					/>
				{/if}
			</div>
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

	.class-manager-modal {
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
		cursor: pointer;
		padding: var(--spacing-2);
		color: var(--text-muted);
		transition: var(--transition-all);
		border-radius: var(--radius-base);
		display: flex;
		align-items: center;
		justify-content: center;
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
	:global(.class-manager-modal .documents-container),
	:global(.class-manager-modal .class-details-container),
	.student-documents-container,
	.class-details-wrapper {
		animation: slideIn var(--transition-duration-300) var(--transition-timing-ease-out);
	}
	
	.class-details-wrapper {
		display: flex;
		flex-direction: column;
		width: 320px;
		height: 100%;
		position: relative;
		background: var(--background-secondary);
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
	}

	.student-documents-container {
		width: 320px;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--background-secondary);
		border-left: var(--border-width-thin) solid var(--background-modifier-border);
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