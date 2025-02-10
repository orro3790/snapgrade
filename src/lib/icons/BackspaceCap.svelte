<script lang="ts">
	const {
		size = 'var(--icon-2xl)',
		textColor = 'var(--text-normal)',
		fill = 'var(--interactive-accent)'
	} = $props<{
		size?: string;
		textColor?: string;
		fill?: string;
	}>();
</script>

<svg
	class="icon"
	style="width: {parseFloat(size) * 1.59375}px; height: {size}"
	viewBox="0 0 102 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
>
	<rect width="102" height="64" rx="12" {fill} />
	<path
		d="M35.703 41.272L32.279 41.24L23.959 32.92L32.279 24.568H35.671L27.351 32.888L35.703 41.272ZM77.591 34.168H25.559V31.672H77.591V34.168Z"
		fill={textColor}
	/>
</svg>
