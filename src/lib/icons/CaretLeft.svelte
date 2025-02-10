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
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M15 6l-6 6l6 6" />
</svg>
