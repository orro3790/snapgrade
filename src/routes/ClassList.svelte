<!-- File: src/routes/ClassList.svelte -->
<script lang="ts">
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot } from 'firebase/firestore';
	import type { Class } from '$lib/schemas/class';
	import Pencil from '$lib/icons/Pencil.svelte';

	// Props
	let { onClassSelect, onAddClass, user, uid } = $props<{
		onClassSelect: (classData: Class) => void;
		onAddClass: () => void;
		user: App.Locals['user'];
		uid: App.Locals['uid'];
	}>();

	// State
	let classes = $state<Class[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedClassId = $state<string | null>(null);

	// Subscribe to classes collection using uid from server
	$effect(() => {
		if (!uid) {
			error = 'Please sign in to view your classes';
			isLoading = false;
			classes = [];
			return;
		}

		const classesQuery = query(
			collection(db, 'classes'),
			where('id', 'in', user.classes || [])
			// where('status', '==', 'active')
		);

		const unsubscribeSnapshot = onSnapshot(
			classesQuery,
			(snapshot) => {
				classes = snapshot.docs.map((doc) => ({
					...doc.data(),
					metadata: { id: doc.id }
				})) as Class[];
				isLoading = false;
			},
			(err) => {
				console.error('Firestore error:', err);
				error = 'Failed to load classes';
				isLoading = false;
			}
		);

		return () => unsubscribeSnapshot();
	});

	function handleClassClick(classData: Class) {
		selectedClassId = classData.metadata.id;
		onClassSelect(classData);
	}

	function handleKeyDown(event: KeyboardEvent, classData: Class) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClassClick(classData);
		}
	}
</script>

<div class="class-list-container" role="navigation" aria-label="Class list">
	<div class="header">
		<h2>Classes</h2>
		<button type="button" class="add-button" onclick={onAddClass} aria-label="Add new class">
			<Pencil size={20} />
			<span>New Class</span>
		</button>
	</div>

	{#if isLoading}
		<div class="loading" role="status">Loading classes...</div>
	{:else if error}
		<div class="error" role="alert">{error}</div>
	{:else if classes.length === 0}
		<div class="empty-state">No classes found</div>
	{:else}
		<ul class="class-list">
			{#each classes as classData}
				<li>
					<button
						type="button"
						class="class-item"
						class:selected={selectedClassId === classData.metadata.id}
						onclick={() => handleClassClick(classData)}
						onkeydown={(e) => handleKeyDown(e, classData)}
						aria-selected={selectedClassId === classData.metadata.id}
					>
						<span class="class-name">{classData.name}</span>
						<span class="student-count">{classData.students.length} students</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.class-list-container {
		width: 280px;
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
		align-items: center;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-normal);
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

	.class-list {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		flex: 1;
	}

	.class-item {
		width: 100%;
		padding: 1rem;
		background: none;
		border: none;
		border-bottom: 1px solid var(--background-modifier-border);
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
		transition: background-color 0.2s ease;
	}

	.class-item:hover {
		background: var(--background-modifier-hover);
	}

	.class-item.selected {
		background: var(--background-modifier-hover);
		border-left: 3px solid var(--text-accent);
	}

	.class-name {
		font-weight: 500;
		color: var(--text-normal);
	}

	.student-count {
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
