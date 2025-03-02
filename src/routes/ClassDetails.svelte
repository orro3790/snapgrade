<!-- File: src/routes/ClassDetails.svelte -->
<script lang="ts">
	import Pencil from '$lib/icons/Pencil.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { Student } from '$lib/schemas/student';
	import { classManagerStore } from '$lib/stores/classManagerStore.svelte';

	// Use derived values from the store
	const selectedClass = $derived(classManagerStore.selectedClass);
	const students = $derived(classManagerStore.students); 
	const selectedStudent = $derived(classManagerStore.selectedStudent);
	const documentCounts = $derived(classManagerStore.documentCounts);
	const isLoading = $derived(classManagerStore.isLoading);
	const error = $derived(classManagerStore.error);
	
	// Track selected student ID
	let selectedStudentId = $derived(selectedStudent?.id || null);

	// No need for derived key with client-first approach

	function handleStudentClick(student: Student) {
		classManagerStore.selectStudent(student);
	}

	function handleKeyDown(event: KeyboardEvent, student: Student) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleStudentClick(student);
		}
	}
</script>

<div class="class-details-container" role="region" aria-label="Class details" >
	<div class="header">
		<div class="title-section">
			<h2>{selectedClass?.name}</h2>
			{#if selectedClass?.description}
				<p class="description">{selectedClass?.description}</p>
			{/if}
		</div>
		<div class="action-buttons">
			<button
				type="button"
				class="icon-button"
				onclick={() => classManagerStore.editClass(selectedClass)}
				aria-label="Edit class details"
			>
				<Pencil size="var(--icon-sm)" stroke="var(--text-muted)" />
			</button>
			<button
				type="button"
				class="icon-button"
				onclick={() => classManagerStore.showDeleteClassDialog()}
				aria-label="Delete class"
			>
				<TrashIcon size="var(--icon-sm)" stroke="var(--text-muted)" />
			</button>
		</div>
	</div>

	<div class="students-section">
		<div class="section-header">
			<h3>Students</h3>
			<Button
				label="Add Student"
				size="compact"
				type="secondary"
				ClickFunction={() => classManagerStore.addStudent()}
			/>
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
							onclick={() => handleStudentClick(student)}
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

	.action-buttons {
		display: flex;
		gap: var(--spacing-1);
	}

	.icon-button {
		background: none;
		border: none;
		padding: 0.5rem;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-button:hover {
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