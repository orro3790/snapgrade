<!-- src/routes/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { userStore } from '$lib/stores/userStore.svelte';
	import { settingsStore } from '$lib/stores/settingsStore.svelte';
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import { sidebarStore } from '$lib/stores/sidebarStore.svelte';
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import UploadDocument from './UploadDocument.svelte';
	import ClassManager from './ClassManager.svelte';
	import StagingArea from './StagingArea.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SidebarToggle from '$lib/icons/SidebarToggle.svelte';

	let { data } = $props<{ data: PageData }>();

	// Initialize state and stores
	let user = $state(data?.user ?? null);
	let settings = $state(data?.settings ?? null);
	let documentName = $derived(editorStore.documentName);

	// Initialize stores with data
	$effect(() => {
		userStore.setUser(user);
		settingsStore.set(settings);
	});
</script>

<div class="app-container">
	<div class="sidebar-editor-wrapper">
		<Sidebar />
		<div class="content-wrapper">
			<header class="editor-header">
				<button
					type="button"
					class="toggle-button"
					onclick={() => sidebarStore.toggle()}
					aria-label={sidebarStore.state.state === 'expanded' ? 'Collapse menu' : 'Expand menu'}
					aria-expanded={sidebarStore.state.state === 'expanded'}
				>
					<SidebarToggle size="var(--icon-sm)" />
				</button>
				<div class="header-content">
					<h1>{documentName || 'No Document Loaded'}</h1>
				</div>
			</header>
			<div class="editor-container">
				<TextEditor initialContent="" />
			</div>
		</div>
	</div>

	{#if $modalStore?.type === 'upload'}
		<UploadDocument data={data.documentForm} />
	{:else if $modalStore?.type === 'classManager'}
		<ClassManager
			data={{
				classForm: data.classForm,
				studentForm: data.studentForm,
				user: data.user,
				uid: data.uid
			}}
		/>
	{:else if $modalStore?.type === 'stagingArea'}
		<StagingArea
			data={{
				stageDocumentForm: data.stageDocumentForm,
				user: data.user,
				uid: data.uid
			}}
		/>
	{/if}
</div>

<style>
	.app-container {
		width: 100%;
		min-height: 100vh;
		overflow-x: hidden;
	}

	.sidebar-editor-wrapper {
		display: flex;
		width: 100%;
		height: 100vh;
	}

	.content-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-header {
		height: var(--spacing-12);
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-4);
		gap: var(--spacing-4);
		background: var(--background-primary);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
	}

	.header-content {
		flex: 1;
	}

	.header-content h1 {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
		margin: 0;
	}

	.toggle-button {
		padding: var(--spacing-2);
		color: var(--text-muted);
		background: none;
		border: none;
		border-radius: var(--radius-base);
		cursor: pointer;
		transition: var(--transition-colors);
	}

	.toggle-button:hover {
		background: var(--interactive-hover);
		color: var(--text-normal);
	}

	.editor-container {
		flex: 1;
		overflow-y: auto;
		background-color: var(--background-secondary);
	}
</style>
