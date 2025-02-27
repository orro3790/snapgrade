<!-- File: src/routes/DocumentFilters.svelte -->
<script lang="ts">
	import { documentStore } from '$lib/stores/documentStore.svelte';
	import { DocumentStatus } from '$lib/schemas/document';
	
	// Derived values from store
	let classes = $derived(documentStore.classes);
	let students = $derived(documentStore.students);
	let filters = $derived(documentStore.filters);
	let isLoading = $derived(documentStore.isLoading);
	
	// Local state for form inputs
	let selectedClassId = $state('');
	let selectedStudentId = $state('');
	let selectedStatus = $state('');
	let startDate = $state('');
	let endDate = $state('');
	
	// Initialize local state from store filters
	$effect(() => {
		selectedClassId = filters.classId;
		selectedStudentId = filters.studentId;
		selectedStatus = filters.status;
		
		// Convert Date objects to string format for input elements
		if (filters.dateRange.start) {
			startDate = filters.dateRange.start.toISOString().split('T')[0];
		}
		
		if (filters.dateRange.end) {
			endDate = filters.dateRange.end.toISOString().split('T')[0];
		}
	});
	
	function handleClassChange(event: Event) {
		selectedClassId = (event.target as HTMLSelectElement).value;
		selectedStudentId = ''; // Reset student selection when class changes
		applyFilters();
	}
	
	function handleStudentChange(event: Event) {
		selectedStudentId = (event.target as HTMLSelectElement).value;
		applyFilters();
	}
	
	function handleStatusChange(event: Event) {
		selectedStatus = (event.target as HTMLSelectElement).value;
		applyFilters();
	}
	
	function handleDateChange() {
		applyFilters();
	}
	
	function applyFilters() {
		documentStore.setFilters({
			classId: selectedClassId,
			studentId: selectedStudentId,
			status: selectedStatus,
			dateRange: {
				start: startDate ? new Date(startDate) : undefined,
				end: endDate ? new Date(endDate) : undefined
			}
		});
	}
	
	function clearFilters() {
		selectedClassId = '';
		selectedStudentId = '';
		selectedStatus = '';
		startDate = '';
		endDate = '';
		documentStore.clearFilters();
	}
</script>

<div class="filters-container">
	<div class="filters-header">
		<h2>Filters</h2>
		<button 
			type="button" 
			class="clear-button" 
			onclick={clearFilters}
			aria-label="Clear all filters"
		>
			Clear All
		</button>
	</div>
	
	<div class="filters-content">
		<div class="filter-group">
			<label for="class-filter">Class</label>
			<select 
				id="class-filter" 
				bind:value={selectedClassId}
				onchange={handleClassChange}
				disabled={isLoading}
			>
				<option value="">All Classes</option>
				{#each classes as classItem}
					<option value={classItem.id}>{classItem.name}</option>
				{/each}
			</select>
		</div>
		
		<div class="filter-group">
			<label for="student-filter">Student</label>
			<select 
				id="student-filter" 
				bind:value={selectedStudentId}
				onchange={handleStudentChange}
				disabled={!selectedClassId}
			>
				<option value="">All Students</option>
				{#each students as student}
					<option value={student.id}>{student.name}</option>
				{/each}
			</select>
		</div>
		
		<div class="filter-group">
			<label for="status-filter">Status</label>
			<select 
				id="status-filter" 
				bind:value={selectedStatus}
				onchange={handleStatusChange}
			>
				<option value="">All Statuses</option>
				<option value={DocumentStatus.unedited}>Unedited</option>
				<option value={DocumentStatus.edited}>Edited</option>
				<option value={DocumentStatus.completed}>Completed</option>
			</select>
		</div>
		
		<div class="filter-group">
			<label for="start-date">From Date</label>
			<input 
				type="date" 
				id="start-date" 
				bind:value={startDate}
				onchange={handleDateChange}
			/>
		</div>
		
		<div class="filter-group">
			<label for="end-date">To Date</label>
			<input 
				type="date" 
				id="end-date" 
				bind:value={endDate}
				onchange={handleDateChange}
			/>
		</div>
	</div>
</div>

<style>
	.filters-container {
		width: 250px;
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
		background: var(--background-primary);
		display: flex;
		flex-direction: column;
	}
	
	.filters-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
	}
	
	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}
	
	.clear-button {
		background: none;
		border: none;
		color: var(--text-accent);
		font-size: var(--font-size-sm);
		cursor: pointer;
		padding: 0;
	}
	
	.clear-button:hover {
		text-decoration: underline;
	}
	
	.filters-content {
		padding: var(--spacing-4);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		overflow-y: auto;
	}
	
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}
	
	label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}
	
	select,
	input[type="date"] {
		padding: var(--spacing-2);
		background: var(--background-alt);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-base);
		color: var(--text-normal);
		font-size: var(--font-size-sm);
		width: 100%;
	}
	
	select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>