<script lang="ts">
	let { textColor = 'var(--text-normal)', fill = 'var(--text-accent)', size = '64px' } = $props();
</script>

<div style="width: {parseFloat(size) * 1.59375}px; height: {size}">
	<svg
		width="100%"
		height="100%"
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
</div>

<style>
	div {
		display: inline-block;
	}

	svg {
		display: block;
	}
</style>
