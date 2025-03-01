<!-- File: src/routes/ClassList.svelte -->
<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { Class } from '$lib/schemas/class';
	import { classManagerStore } from '$lib/stores/classManagerStore.svelte';

	// Use derived reactive values from store
	const classes = $derived(classManagerStore.classes);
	const selectedClass = $derived(classManagerStore.selectedClass);
	const isLoading = $derived(classManagerStore.isLoading);
	const error = $derived(classManagerStore.error);
	
	// Keep track of the selected class ID
	let selectedClassId = $derived(selectedClass?.id || null);
	
	// Create a derived key that changes when classes array changes
	// This will force re-rendering when classes are added or removed
	// Using a more robust key derivation strategy similar to ClassDetails.svelte
	let classesKey = $derived(() => {
		// Include a string representation of all class IDs to detect any changes
		const classIds = classes.map(c => c.id).join(',');
		return `classes-${classes.length}-${classIds}`;
	});

	function handleClassClick(classData: Class) {
		classManagerStore.selectClass(classData);
	}

	function handleKeyDown(event: KeyboardEvent, classData: Class) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClassClick(classData);
		}
	}
	
	function handleCreateClass() {
		classManagerStore.editClass(null);
	}
</script>

{#key classesKey}
<div class="class-list-container" role="navigation" aria-label="Class list">
	<div class="header">
		<h2>Classes</h2>
		<Button
			label="Create Class"
			size="compact"
			type="secondary"
			ClickFunction={handleCreateClass}
		/>
	</div>

	{#if isLoading}
		<div class="loading" role="status">Loading classes...</div>
	{:else if error}
		<div class="error" role="alert">{error}</div>
	{:else if classes.length === 0}
		<div class="empty-state">No classes found</div>
	{:else}
		<ul class="class-list">
			{#each classes as classData (classData.id)}
				<li>
					<button
						type="button"
						class="class-item"
						class:selected={selectedClassId === classData.id}
						onclick={() => handleClassClick(classData)}
						onkeydown={(e) => handleKeyDown(e, classData)}
					>
						<span class="class-name">{classData.name}</span>
						<span class="student-count">{classData.students?.length || 0} students</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
{/key}

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