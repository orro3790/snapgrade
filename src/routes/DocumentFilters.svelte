<!-- File: src/routes/DocumentFilters.svelte -->
<script lang="ts">
	import type { Class } from '$lib/schemas/class';
	import type { Student } from '$lib/schemas/student';
	
	// Props
	let { onFilterChange, user, uid } = $props<{
		onFilterChange: (filters: any) => void;
		user: any;
		uid: string;
	}>();
	
	// State
	let classes = $state<Class[]>([]);
	let students = $state<Student[]>([]);
	let selectedClassId = $state('');
	let selectedStudentId = $state('');
	let selectedStatus = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let isLoading = $state(true);
	
	import { db } from '$lib/firebase/client';
	import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
	
	// Track if this is the first render to avoid unnecessary API calls
	let isInitialRender = $state(true);
	
	// Load classes using Firestore
	$effect(() => {
		// Only run this effect when uid changes or on initial render
		if (uid && isInitialRender) {
			loadClassesFromFirestore();
			isInitialRender = false;
		}
	});
	
	// Load students when selectedClassId changes
	$effect(() => {
		// This will only run when selectedClassId changes
		if (selectedClassId) {
			loadStudentsFromFirestore(selectedClassId);
		} else {
			students = [];
		}
	});
	
	async function loadClassesFromFirestore() {
		isLoading = true;
		
		try {
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
					isLoading = false;
				},
				(err) => {
					console.error('Firestore error loading classes:', err);
					isLoading = false;
				}
			);
			
			return () => unsubscribeSnapshot();
		} catch (err) {
			console.error('Error loading classes:', err);
			isLoading = false;
		}
	}
	
	async function loadStudentsFromFirestore(classId: string) {
		try {
			// First get the class document to access its students array
			const classDoc = await getDocs(
				query(collection(db, 'classes'), where('id', '==', classId))
			);
			
			if (classDoc.empty) {
				console.error('Class not found');
				return;
			}
			
			const classData = classDoc.docs[0].data();
			const studentIds = classData.students || [];
			
			if (studentIds.length === 0) {
				students = [];
				return;
			}
			
			// Then query for all students in that class
			const studentsQuery = query(
				collection(db, 'students'),
				where('id', 'in', studentIds)
			);
			
			const unsubscribeSnapshot = onSnapshot(
				studentsQuery,
				(snapshot) => {
					students = snapshot.docs.map((doc) => ({
						...doc.data(),
						id: doc.id
					})) as Student[];
				},
				(err) => {
					console.error('Firestore error loading students:', err);
				}
			);
			
			return () => unsubscribeSnapshot();
		} catch (err) {
			console.error('Error loading students:', err);
		}
	}
	
	function handleClassChange(event: Event) {
		selectedClassId = (event.target as HTMLSelectElement).value;
		selectedStudentId = '';
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
		const filters = {
			classId: selectedClassId,
			studentId: selectedStudentId,
			status: selectedStatus,
			dateRange: {
				start: startDate ? new Date(startDate) : null,
				end: endDate ? new Date(endDate) : null
			}
		};
		
		onFilterChange(filters);
	}
	
	function clearFilters() {
		selectedClassId = '';
		selectedStudentId = '';
		selectedStatus = '';
		startDate = '';
		endDate = '';
		applyFilters();
	}
</script>

<div class="filters-container">
	<div class="filters-header">
		<h2>Filters</h2>
		<button type="button" class="clear-button" onclick={clearFilters}>
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
				<option value="unedited">Unedited</option>
				<option value="edited">Edited</option>
				<option value="completed">Completed</option>
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