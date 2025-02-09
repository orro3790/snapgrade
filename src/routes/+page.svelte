<!-- file: src/routes/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { userStore } from '$lib/stores/userStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { modalStore } from '$lib/stores/modalStore';
	import UploadDocument from './UploadDocument.svelte';
	import ClassManager from './ClassManager.svelte';
	import StagingArea from './StagingArea.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data } = $props<{ data: PageData }>();
	// Initialize state and stores
	let user = $state(data?.user ?? null);

	let settings = $state(data?.settings ?? null);

	// Initialize stores with data
	$effect(() => {
		userStore.set(user);
		settingsStore.set(settings);
	});
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
	{:else if $modalStore === 'stagingArea'}
		<StagingArea
			data={{
				stageDocumentForm: data.stageDocumentForm,
				user: data.user,
				uid: data.uid
			}}
		/>
	{/if}

	<div class="editor-container">
		<TextEditor initialContent="" />
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

	.editor-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding-top: 0.1rem;
	}
</style>
