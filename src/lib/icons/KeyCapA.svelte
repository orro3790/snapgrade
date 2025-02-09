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
		d="M22.832 43L29.744 20.28H33.456L40.368 43H37.424L31.6 22.776L25.776 43H22.832ZM26.32 36.536L27.28 33.848H35.92L36.88 36.536H26.32Z"
		fill={textColor}
	/>
</svg>
