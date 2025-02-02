<script lang="ts">
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Sample text with corrections
	const sampleText =
		'Me and my friend go to school in Busan.  We learn many thing, like English and math.  Sometimes, English is very difficult, but I try my bestest.  After school, we play soccer and eat kimchi with my family.';

	// Track if there are unsaved changes
	let hasUnsavedChanges = false;

	// Handle unsaved changes warning using best practices
	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		if (hasUnsavedChanges) {
			// Call preventDefault() first as the modern approach
			event.preventDefault();
			return '';
		}
	};

	// Handle back button navigation
	const handlePopState = (event: PopStateEvent) => {
		if (
			hasUnsavedChanges &&
			!window.confirm('You have unsaved changes. Are you sure you want to leave?')
		) {
			event.preventDefault();
			history.pushState(null, '', window.location.href);
		}
	};

	onMount(() => {
		if (browser) {
			window.addEventListener('beforeunload', handleBeforeUnload);
			window.addEventListener('popstate', handlePopState);
			history.pushState(null, '', window.location.href);

			return () => {
				window.removeEventListener('beforeunload', handleBeforeUnload);
				window.removeEventListener('popstate', handlePopState);
			};
		}
	});

	// We so we can prevent the user from leave accidentally
	function handleContentChange(content: string) {
		hasUnsavedChanges = content !== sampleText;
	}
</script>

<div class="app-container">
	<TextEditor initialContent={sampleText} onContentChange={handleContentChange} />
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
