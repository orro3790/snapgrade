<!-- File: src/routes/ClassList.svelte -->
<script lang="ts">
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot } from 'firebase/firestore';
	import type { Class } from '$lib/schemas/class';
	import Pencil from '$lib/icons/Pencil.svelte';
	import Settings from '$lib/icons/Settings.svelte';

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
					id: doc.id,
					metadata: {
						createdAt: doc.data().metadata?.createdAt,
						updatedAt: doc.data().metadata?.updatedAt
					}
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
		selectedClassId = classData.id;
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
			<Pencil size="var(--icon-sm)" />
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
						class:selected={selectedClassId === classData.id}
						onclick={() => handleClassClick(classData)}
						onkeydown={(e) => handleKeyDown(e, classData)}
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
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
	}

	.header {
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-3);
		background: var(--interactive-normal);
		color: var(--text-normal);
		font-size: var(--font-size-sm);
		border-radius: var(--radius-base);
	}

	.add-button:hover {
		background: var(--interactive-hover);
	}

	.class-list {
		list-style: none;
		margin: 0;
		padding: var(--spacing-2);
		overflow-y: auto;
		flex: 1;
	}

	.class-item {
		width: 100%;
		padding: var(--spacing-4);
		background: none;
		border: none;
		border-radius: var(--radius-base);
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
	}

	.class-item:hover {
		background: var(--background-modifier-hover);
	}

	.class-item.selected {
		background: var(--background-modifier-hover);
		border-left: var(--border-width-medium) solid var(--interactive-accent);
	}

	.class-name {
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.student-count {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.loading,
	.error,
	.empty-state {
		padding: var(--spacing-4);
		text-align: center;
		color: var(--text-muted);
	}

	.error {
		color: var(--status-error);
	}
</style>
