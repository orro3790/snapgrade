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
	const sampleText = `Last week, I visited my friend's house to work on our essay #punc# The writing process was challenging #frag#.

>The first paragraph needed major revisions. We found several errors in it #punc# For example, me and him !we! were #sv# using wrong pronouns #pron:we#. We also writed !wrote! about are !our! research findings.

>The second paragraph had issues with word choice and articles #punc# We studied -lots of- [many] different source #pl:sources#. A !The! most important finding was about climate change. in !In! particular, we learned about it's !its! effects on weather patterns.

[¶]

The conclusion needed work too. we !We! didnt !didn't! properly cite are !our! sources. However !,! the data support !supports# our hypothesis about rising temperatures #punc# -In conclusion- [Finally], we decided to focus in !on# the environmental impact.`;
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
		<TextEditor initialContent={sampleText} />
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
