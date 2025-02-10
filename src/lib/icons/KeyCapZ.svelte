<script lang="ts">
	const {
		textColor = 'var(--text-normal)',
		fill = 'var(--interactive-accent)',
		size = 'var(--icon-2xl)'
	} = $props<{
		textColor?: string;
		fill?: string;
		size?: string;
	}>();
</script>

<svg
	class="icon"
	style="width: {size}; height: {size}"
	viewBox="0 0 64 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
>
	<rect width="64" height="64" rx="12" {fill} />
	<path
		d="M23.6 43V40.248L36.272 22.968H24.176V20.28H39.344V23.032L26.672 40.312H39.6V43H23.6Z"
		fill={textColor}
	/>
</svg>
