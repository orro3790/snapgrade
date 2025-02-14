<!-- src/lib/icons/ModeToggle.svelte -->
<script lang="ts">
	/**
	 * Icon component that toggles between formatting and editing mode icons
	 * Following tabler.io icon style and project conventions
	 */
	import { editorStore, EditorMode } from '$lib/stores/editorStore.svelte';

	let { size = 20, stroke = 'currentColor' } = $props();

	// Derive current mode using $derived rune
	let isFormatting = $derived(editorStore.mode === EditorMode.FORMATTING);
</script>

{#if isFormatting}
	<!-- Format mode icon (text with paragraph marks) -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		stroke-width="2"
		{stroke}
		fill="none"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<!-- Paragraph lines -->
		<path d="M4 6h16" />
		<path d="M4 12h16" />
		<path d="M4 18h12" />
		<!-- Formatting indicator -->
		<path d="M14 3v7" />
		<path d="M17 5l-3 -2l-3 2" />
	</svg>
{:else}
	<!-- Edit mode icon (pencil) -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		stroke-width="2"
		{stroke}
		fill="none"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<!-- Pencil shape -->
		<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
		<path d="M13.5 6.5l4 4" />
	</svg>
{/if}
