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
	style="width: {size}; height: {size}"
	viewBox="0 0 64 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
>
	<rect width="64" height="64" rx="12" {fill} />
	<path d="M31.92 23.8L29.04 19.704H32.048L34.16 23.8H31.92Z" fill={textColor} />
</svg>
