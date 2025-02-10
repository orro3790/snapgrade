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
	<path
		d="M23.952 34.808V32.312H39.248V34.808H23.952ZM30.352 41.208V25.912H32.848V41.208H30.352Z"
		fill={textColor}
	/>
</svg>
