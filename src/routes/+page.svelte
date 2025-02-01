<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';

	// Sample text with corrections
	const sampleText =
		'Me and my friend go to school in Busan.  We learn many thing, like English and math.  Sometimes, English is very difficult, but I try my bestest.  After school, we play soccer and eat kimchi with my family.';
</script>

<div class="app-container">
	<TextEditor initialContent={sampleText} />
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
</style>
