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

<div style="width: {size}; aspect-ratio: 1">
	<svg
		style="width: {size}; height: {size};"
		viewBox="0 0 24 24"
		fill="none"
		{stroke}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		preserveAspectRatio="xMidYMid meet"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" />
		<path d="M11 11.5v-2a1.5 1.5 0 1 1 3 0v2.5" />
		<path d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />
		<path
			d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47"
		/>
	</svg>
</div>
