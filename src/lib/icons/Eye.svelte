<script lang="ts">
	let { stroke = 'var(--text-accent)', size = '24px' } = $props();
</script>

<div style="width: {size}; aspect-ratio: 1">
	<svg
		width="100%"
		height="100%"
		viewBox="0 0 24 24"
		fill="none"
		{stroke}
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="icon icon-tabler icons-tabler-outline icon-tabler-eye"
		preserveAspectRatio="xMidYMid meet"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
		<path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
	</svg>
</div>

<style>
	div {
		display: inline-block;
	}

	svg {
		display: block;
	}
</style>
