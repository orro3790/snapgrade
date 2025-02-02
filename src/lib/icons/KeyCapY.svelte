<script lang="ts">
	let {
		textColor = 'var(--text-normal)',
		fill = 'var(--text-accent)',
		size = '64px' // Single size prop for maintaining aspect ratio
	} = $props();
</script>

<div style="width: {size}; aspect-ratio: 1">
	<svg
		width="100%"
		height="100%"
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
</div>

<style>
	div {
		display: inline-block;
	}

	svg {
		display: block;
	}
</style>
