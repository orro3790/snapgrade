<!-- src/lib/icons/Home.svelte -->
<script lang="ts">
	const {
		size = 'var(--icon-base)',
		stroke = 'var(--text-normal)',
		strokeWidth = 'var(--icon-stroke-normal)'
	} = $props<{
		size?: string;
		stroke?: string;
		strokeWidth?: string;
	}>();
</script>

<svg
	class="icon"
	style="width: {size}; height: {size};"
	viewBox="0 0 24 24"
	fill="none"
	{stroke}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M5 12H3l9-9 9 9h-2" />
	<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
	<path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
</svg>
