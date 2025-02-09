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
	width={size}
	height={size}
	viewBox="0 0 64 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
>
	<rect x="0" y="0" width="64" height="64" rx="12" {fill} />
	<path
		d="M30.256 43V33.72L23.28 20.28H26.416L31.6 30.904L36.784 20.28H39.92L33.008 33.72V43H30.256Z"
		fill={textColor}
	/>
</svg>
