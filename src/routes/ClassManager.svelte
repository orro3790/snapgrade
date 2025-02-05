<!-- File: src/routes/ClassManager.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore';
	import type { Class } from '$lib/schemas/class';
	import type { Student } from '$lib/schemas/student';
	import type { SuperValidated } from 'sveltekit-superforms';

	// Props
	let { data } = $props<{
		data: {
			classForm: SuperValidated<any>;
			studentForm: SuperValidated<any>;
			user: App.Locals['user'];
			uid: App.Locals['uid'];
		};
	}>();
	import ClassList from './ClassList.svelte';
	import ClassDetails from './ClassDetails.svelte';
	import StudentDocuments from './StudentDocuments.svelte';
	import ClassForm from './ClassForm.svelte';
	import StudentForm from './StudentForm.svelte';

	// State
	let selectedClass = $state<Class | null>(null);
	let selectedStudent = $state<Student | null>(null);
	let isEditingClass = $state(false);
	let isAddingStudent = $state(false);

	function closeModal() {
		modalStore.close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function handleClassSelect(classData: Class) {
		selectedClass = classData;
		selectedStudent = null;
		isEditingClass = false;
		isAddingStudent = false;
	}

	function handleStudentSelect(student: Student) {
		selectedStudent = student;
		isEditingClass = false;
		isAddingStudent = false;
	}

	function handleAddClass() {
		selectedClass = null;
		selectedStudent = null;
		isEditingClass = true;
		isAddingStudent = false;
	}

	function handleEditClass() {
		isEditingClass = true;
		isAddingStudent = false;
	}

	function handleAddStudent() {
		isAddingStudent = true;
		isEditingClass = false;
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
		<button
			type="button"
			class="close-button"
			onclick={closeModal}
			aria-label="Close class manager"
		>
			×
		</button>
	</div>

	<div class="modal-content">
		<!-- Column 1: Class List -->
		<ClassList
			onClassSelect={handleClassSelect}
			onAddClass={handleAddClass}
			user={data.user}
			uid={data.uid}
		/>

		<!-- Column 2: Class Form or Details -->
		{#if isEditingClass}
			<ClassForm data={data.classForm} onCancel={() => (isEditingClass = false)} />
		{:else if selectedClass}
			<ClassDetails
				{selectedClass}
				onStudentSelect={handleStudentSelect}
				onEditClass={handleEditClass}
				onAddStudent={handleAddStudent}
			/>
		{/if}

		<!-- Column 3: Student Form or Documents -->
		{#if isAddingStudent}
			<StudentForm
				data={data.studentForm}
				{selectedClass}
				onCancel={() => (isAddingStudent = false)}
			/>
		{:else if selectedStudent}
			<StudentDocuments {selectedStudent} />
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
		background: rgba(0, 0, 0, 0.5);
		z-index: 998;
		backdrop-filter: blur(2px);
	}

	.class-manager-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		border-radius: 0.5rem;
		border: 1px solid var(--background-modifier-border);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 999;
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
		padding: 1rem;
		border-bottom: 1px solid var(--background-modifier-border);
		background: var(--background-primary);
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-normal);
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		color: var(--text-muted);
		transition: all 0.2s ease;
		line-height: 1;
		border-radius: 0.25rem;
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
	:global(.class-manager-modal .class-details-container) {
		animation: slideIn 0.3s ease-out;
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
