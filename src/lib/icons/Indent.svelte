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
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		{stroke}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		class="icon icon-tabler icons-tabler-outline icon-tabler-pilcrow-right"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11 9h-2a3 3 0 1 1 0 -6h7" /><path
			d="M11 3v11"
		/><path d="M15 3v11" /><path d="M21 18h-18" /><path d="M18 15l3 3l-3 3" /></svg
	>
</div>
