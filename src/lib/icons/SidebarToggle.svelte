<!-- src/lib/icons/Menu.svelte -->
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

<svg
	class="icon"
	style="width: {size}; height: {size}"
	viewBox="0 0 24 24"
	fill="none"
	{stroke}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
		d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"
	/><path d="M9 4l0 16" /></svg
>
