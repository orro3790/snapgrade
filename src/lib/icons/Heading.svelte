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
		class="icon icon-tabler icons-tabler-outline icon-tabler-heading"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 12h10" /><path
			d="M7 5v14"
		/><path d="M17 5v14" /><path d="M15 19h4" /><path d="M15 5h4" /><path d="M5 19h4" /><path
			d="M5 5h4"
		/></svg
	>
</div>
