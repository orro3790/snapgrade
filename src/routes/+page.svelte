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
		'Yesterday, we played soccor with my class friend. My team shirt is blue color and other team have red shirt. I am good at kicking ball very far but sometimes ball go to wrong place! Teacher say I must more pratice.
		My best friend Minho is goalkeeper. He catch many ball and save our team! But one time he fall down and make his pants dirty. Everyone laughed but teacher helped him stand up. Minho cryed a little bit but after game we shared my choco pie and he feel better.
		I want to be like Son Heung-min when I grown up. He play soccer in Enland and speak English very good. My father say if I study English hard maybe I can go other country and play soccer too! But England weather is very rain so maybe I should go other place.
		Last week our team won game and get gold medal! I was so exiting that I runned to my mom and showed her. She maked my favorite food for dinner - bulgogi! Next week we will play with class 3-B. They are little scary because they have tall students but I will do my most best!';




</script>

<div class="app-container">
	<Sidebar />

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
