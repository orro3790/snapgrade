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
		style="width: {size}; height: {size};"
		viewBox="0 0 24 24"
		fill="none"
		{stroke}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		preserveAspectRatio="xMidYMid meet"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2"
		/><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg
	>
</div>

<style>
	div {
		display: inline-block;
	}

	svg {
		display: block;
	}
</style>
