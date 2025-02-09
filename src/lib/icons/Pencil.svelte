<script lang="ts">
	const {
		size = 'var(--icon-base)',
		stroke = 'currentColor',
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
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		{stroke}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"
			/><path d="M13.5 6.5l4 4" /></path
		></svg
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
