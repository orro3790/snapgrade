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
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	{stroke}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<circle cx="11" cy="11" r="8"></circle>
	<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
</svg>
