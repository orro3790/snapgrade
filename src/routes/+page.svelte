<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { userStore } from '$lib/stores/userStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import type { PageData } from './$types';
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

	// Sample text with corrections
	const sampleText =
		'Me and my friend go to school in Busan.  We learn many thing, like English and math.  Sometimes, English is very difficult, but I try my bestest.  After school, we play soccer and eat kimchi with my family.';

	let message = $state('');
	let response = $state('');

	async function handleSubmit() {
		try {
			const res = await fetch('api/documents', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message })
			});

			const data = await res.json();
			response = JSON.stringify(data, null, 2);
		} catch (error) {
			console.error('Error:', error);
			response = 'Error sending message';
		}
	}
</script>

<div class="app-container">
	<Sidebar />
	<!-- Test API Endpoint -->
	<div class="container">
		<h1>Test API Endpoint</h1>

		<div class="form">
			<input type="text" bind:value={message} placeholder="Enter a message" />

			<button onclick={handleSubmit}> Send Message </button>
		</div>

		{#if response}
			<div class="response">
				<h2>Response:</h2>
				<pre>{response}</pre>
			</div>
		{/if}
	</div>
	<TextEditor initialContent={response} />
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
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 1rem;
	}

	.form {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
	}

	input {
		flex: 1;
		padding: 0.5rem;
	}

	button {
		padding: 0.5rem 1rem;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.response {
		margin-top: 2rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 4px;
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
	}
</style>
