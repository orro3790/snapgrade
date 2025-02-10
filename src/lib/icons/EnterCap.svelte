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
	style="width: {parseFloat(size) * 2.1875}px; height: {size}"
	viewBox="0 0 140 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	preserveAspectRatio="xMidYMid meet"
>
	<rect width="140" height="64" rx="12" {fill} />
	<path
		d="M24.88 43V20.28H38.704V22.968H27.632V30.296H38.32V32.92H27.632V40.312H38.96V43H24.88ZM43.8755 43V26.04H46.3395L46.4355 30.36L46.1155 30.072C46.3288 29.0693 46.7128 28.248 47.2675 27.608C47.8435 26.9467 48.5262 26.456 49.3155 26.136C50.1048 25.816 50.9368 25.656 51.8115 25.656C53.1128 25.656 54.1902 25.944 55.0435 26.52C55.9182 27.096 56.5795 27.8747 57.0275 28.856C57.4755 29.816 57.6995 30.8933 57.6995 32.088V43H55.0115V32.856C55.0115 31.2773 54.7022 30.0827 54.0835 29.272C53.4648 28.44 52.5155 28.024 51.2355 28.024C50.3608 28.024 49.5715 28.216 48.8675 28.6C48.1635 28.9627 47.5982 29.5067 47.1715 30.232C46.7662 30.936 46.5635 31.8107 46.5635 32.856V43H43.8755Z"
		fill={textColor}
	/>
</svg>
