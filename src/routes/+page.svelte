<!-- file: src/routes/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { userStore } from '$lib/stores/userStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { modalStore } from '$lib/stores/modalStore';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import UploadDocument from './UploadDocument.svelte';
	import ClassManager from './ClassManager.svelte';

	let { data } = $props<{ data: PageData }>();
	// Initialize state and stores
	let user = $state(data?.user ?? null);

	let settings = $state(data?.settings ?? null);

	// Initialize stores with data
	$effect(() => {
		userStore.set(user);
		settingsStore.set(settings);
	});

	// Sample text demonstrating all correction types and syntax features
	const sampleText = {
		studentId: 'test123',
		studentName: 'Test Student',
		className: 'English 101',
		documentName: 'Test Document',
		documentBody:
			'[{"i":"1","t":"normal","x":"Hello"},{"i":"2","t":"spacer","s":"tab"},{"i":"3","t":"normal","x":"world"},{"i":"4","t":"spacer","s":"newline"},{"i":"5","t":"normal","x":"This"},{"i":"6","t":"spacer","s":"tab"},{"i":"7","t":"correction","x":"iz","c":{"o":"iz","f":"is","p":"form.agree"}},{"i":"8","t":"spacer","s":"tab"},{"i":"9","t":"normal","x":"a"},{"i":"10","t":"spacer","s":"tab"},{"i":"11","t":"normal","x":"test"}]',
		userId: 'user123',
		status: 'editing',
		sourceType: 'manual',
		id: 'test-doc-1'
	};
</script>

<div class="app-container">
	<Sidebar />

	{#if $modalStore === 'upload'}
		<UploadDocument data={data.documentForm} />
	{:else if $modalStore === 'classManager'}
		<ClassManager
			data={{
				classForm: data.classForm,
				studentForm: data.studentForm,
				user: data.user,
				uid: data.uid
			}}
		/>
	{/if}

	<div class="center-container">
		<TextEditor initialContent="is this prop needed still?" />
	</div>
</div>

<style>
	.app-container {
		width: 100%;
		min-height: 100vh;
		background-color: var(--background-primary);
		overflow-x: hidden; /* Prevent horizontal scrolling when sidebar transitions */
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	/* API TEST CONTAINER STYLES*/
	.center-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding-top: 0.1rem;
	}
</style>
