<script lang="ts">
	let { textColor = 'var(--text-normal)', fill = 'var(--text-accent)', size = '64px' } = $props();
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
		<rect width="64" height="64" rx="12" {fill} />
		<path d="M31.92 23.8L29.04 19.704H32.048L34.16 23.8H31.92Z" fill={textColor} />
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
