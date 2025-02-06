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

	// Sample text with all correction types and footnotes
	const sampleText = `Let's start with basic corrections. Here's a -misspeled- word and an [important] addition. The word "writting" !writing! needs correction. [fn: Basic correction examples showing deletion, addition, and correction.]

	Grammar check time: "cats" #pl# chases the mouse, "runned" #vt# to school yesterday, "they runs" #sv# fast, and we need "a" #art# umbrella. [fn: Various grammar corrections demonstrating plural, verb tense, subject-verb agreement, and article usage.]

	Let's fix formatting: "monday" #cap# is a day, "too    many    spaces" #sp# between words, and "no punctuation" #punc# needs fixing [fn: Formatting corrections for capitalization, spacing, and punctuation.]

	#para# This begins a new paragraph. These two sentences #merge# should be combined into one.

	Academic improvements: This "quote" #ref# needs citation. That's a "poor" #wc# word choice. This is "very very" #red# redundant. This point needs "emphasis" #emp#. [fn: Various academic writing improvements including citations, word choice, redundancy, and emphasis.]

	Let's end with some normal text to see how it flows.`;
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
		padding-top: 3rem;
	}
</style>
