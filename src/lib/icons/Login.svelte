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
	<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
	<polyline points="10 17 15 12 10 7" />
	<line x1="15" y1="12" x2="3" y2="12" />
</svg>
