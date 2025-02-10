<!-- File: src/routes/ClassDetails.svelte -->
<script lang="ts">
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot } from 'firebase/firestore';
	import type { Class } from '$lib/schemas/class';
	import type { Student } from '$lib/schemas/student';
	import type { Document } from '$lib/schemas/document';
	import Pencil from '$lib/icons/Pencil.svelte';

	// Add proper type for metadata
	interface Metadata {
		id: string;
		createdAt: Date;
		updatedAt: Date;
	}

	interface StudentWithMetadata extends Student {
		metadata: Metadata;
	}

	let { selectedClass, onStudentSelect, onEditClass, onAddStudent } = $props<{
		selectedClass: Class;
		onStudentSelect: (student: StudentWithMetadata) => void;
		onEditClass: () => void;
		onAddStudent: () => void;
	}>();

	// State
	let students = $state<Student[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedStudentId = $state<string | null>(null);
	let documentCounts = $state<Record<string, number>>({});

	$effect(() => {
		if (!selectedClass) return;

		const studentsQuery = query(
			collection(db, 'students'),
			where('classId', '==', selectedClass.id),
			where('status', '==', 'active')
		);

		const documentsQuery = query(collection(db, 'documents'), where('status', '!=', 'staged'));

		const unsubscribeStudents = onSnapshot(
			studentsQuery,
			(snapshot) => {
				students = snapshot.docs.map((doc) => doc.data() as Student);
				isLoading = false;
			},
			handleError
		);

		const unsubscribeDocuments = onSnapshot(
			documentsQuery,
			(snapshot) => {
				// Count documents per student, but only for students in this class
				const newCounts: Record<string, number> = {};
				snapshot.docs.forEach((doc) => {
					const document = doc.data() as Document;
					// Only count documents for students in this class
					if (students.some((student) => student.id === document.studentId)) {
						newCounts[document.studentId] = (newCounts[document.studentId] || 0) + 1;
					}
				});
				documentCounts = newCounts;
			},
			handleError
		);

		return () => {
			unsubscribeStudents();
			unsubscribeDocuments();
		};
	});

	function handleError(err: Error) {
		console.error('Error fetching data:', err);
		error = 'Failed to load data';
		isLoading = false;
	}

	function handleStudentClick(student: StudentWithMetadata) {
		selectedStudentId = student.id;
		onStudentSelect(student);
	}

	function handleKeyDown(event: KeyboardEvent, student: Student) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleStudentClick(student as StudentWithMetadata);
		}
	}
</script>

<div class="class-details-container" role="region" aria-label="Class details">
	<div class="header">
		<div class="title-section">
			<h2>{selectedClass.name}</h2>
			{#if selectedClass.description}
				<p class="description">{selectedClass.description}</p>
			{/if}
		</div>
		<button type="button" class="edit-button" onclick={onEditClass} aria-label="Edit class details">
			<Pencil size="var(--icon-sm)" />
		</button>
	</div>

	<div class="students-section">
		<div class="section-header">
			<h3>Students</h3>
			<button type="button" class="add-button" onclick={onAddStudent} aria-label="Add new student">
				<Pencil size="var(--icon-sm)" />
				<span>Add Student</span>
			</button>
		</div>

		{#if isLoading}
			<div class="loading" role="status">Loading students...</div>
		{:else if error}
			<div class="error" role="alert">{error}</div>
		{:else if students.length === 0}
			<div class="empty-state">No students enrolled</div>
		{:else}
			<ul class="student-list">
				{#each students as student}
					<li>
						<button
							type="button"
							class="student-item"
							class:selected={selectedStudentId === student.id}
							onclick={() => handleStudentClick(student as StudentWithMetadata)}
							onkeydown={(e) => handleKeyDown(e, student)}
						>
							<span class="student-name">{student.name}</span>
							<span class="document-count">
								{documentCounts[student.id] || 0} document{documentCounts[student.id] !== 1
									? 's'
									: ''}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.class-details-container {
		width: 320px;
		height: 100%;
		background: var(--background-secondary);
		border-right: 1px solid var(--background-modifier-border);
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

	h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-normal);
	}

	.description {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.edit-button {
		background: none;
		border: none;
		padding: 0.5rem;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.edit-button:hover {
		color: var(--text-normal);
		background: var(--background-modifier-hover);
	}

	.students-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.section-header {
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.375rem;
		color: var(--text-normal);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		background: var(--background-modifier-hover);
	}

	.student-list {
		list-style: none;
		margin: 0;
		padding: var(--spacing-2);
		overflow-y: auto;
		flex: 1;
	}

	.student-item {
		width: 100%;
		padding: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
		transition: background-color 0.2s ease;
	}

	.student-item:hover {
		background: var(--background-modifier-hover);
	}

	.student-item.selected {
		background: var(--background-modifier-hover);
		border-left: var(--border-width-medium) solid var(--interactive-accent);
	}

	.student-name {
		font-weight: 500;
		color: var(--text-normal);
	}

	.document-count {
		font-size: 0.875rem;
		color: var(--text-muted);
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
