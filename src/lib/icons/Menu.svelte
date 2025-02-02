<!-- src/lib/icons/Menu.svelte -->
<script lang="ts">
	const {
		size = 24,
		stroke = 'currentColor',
		fill = 'none'
	} = $props<{
		size?: number;
		stroke?: string;
		fill?: string;
	}>();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	{fill}
	{stroke}
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M4 6h16M4 12h16M4 18h16" />
</svg>
