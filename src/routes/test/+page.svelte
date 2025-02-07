<!-- src/routes/test/+page.svelte -->
<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';
	import testDoc from '$lib/utils/test-document.json' assert { type: 'json' };
	import { editorStore } from '$lib/stores/editorStore';

	// Load the test document
	function loadTestDocument() {
		const documentBody = testDoc.documentBody as string;
		editorStore.loadSerializedContent(documentBody);
	}

	// Save and display the serialized content
	function saveAndDisplay() {
		const serialized = editorStore.getSerializedContent();
		console.log('Serialized content:', serialized);
	}
</script>

<div class="test-container">
	<div class="controls">
		<button onclick={loadTestDocument}>Load Test Document</button>
		<button onclick={saveAndDisplay}>Save & Display</button>
	</div>

	<TextEditor />
</div>

<style>
	.test-container {
		padding: 2rem;
	}

	.controls {
		margin-bottom: 2rem;
		display: flex;
		gap: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		background: var(--interactive-normal);
		border: none;
		border-radius: 0.25rem;
		color: var(--text-normal);
		cursor: pointer;
	}

	button:hover {
		background: var(--interactive-hover);
	}
</style>
