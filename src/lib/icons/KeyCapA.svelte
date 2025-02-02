<script lang="ts">
	let {
		textColor = 'var(--text-normal)',
		fill = 'var(--text-accent)',
		width = '64',
		height = '64'
	} = $props();
</script>

<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
	<rect width="64" height="64" rx="12" {fill} />
	<path
		d="M22.832 43L29.744 20.28H33.456L40.368 43H37.424L31.6 22.776L25.776 43H22.832ZM26.32 36.536L27.28 33.848H35.92L36.88 36.536H26.32Z"
		fill={textColor}
	/>
</svg>
