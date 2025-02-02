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
		<path
			d="M30.736 36.312C30.672 35.5653 30.5973 34.68 30.512 33.656C30.4267 32.632 30.352 31.5867 30.288 30.52C30.2453 29.4533 30.224 28.4933 30.224 27.64V20.28H32.976V27.64C32.976 28.4933 32.944 29.4533 32.88 30.52C32.8373 31.5867 32.7733 32.632 32.688 33.656C32.624 34.68 32.56 35.5653 32.496 36.312H30.736ZM29.616 43V39.096H33.584V43H29.616Z"
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
