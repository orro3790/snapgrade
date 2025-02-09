<script lang="ts">
	const {
		size = 'var(--icon-2xl)',
		textColor = 'var(--text-normal)',
		fill = 'var(--background-secondary)'
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
	<path
		d="M29.904 47.992L31.408 43H29.68V39.096H33.52V42.552L31.504 47.992H29.904Z"
		fill={textColor}
	/>
</svg>
