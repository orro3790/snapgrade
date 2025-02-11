<!-- src/lib/components/GroupTooltip.svelte -->
<script lang="ts">
	let { text, position, onClick, onMouseEnter } = $props<{
		text: string;
		position: { x: number; y: number };
		onClick: () => void;
		onMouseEnter: () => void;
	}>();
</script>

<div
	class="tooltip"
	style="left: {position.x}px; top: {position.y}px;"
	role="button"
	tabindex="0"
	onclick={onClick}
	onmouseenter={onMouseEnter}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick();
		}
	}}
>
	{text}
</div>

<style>
	.tooltip {
		position: absolute;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 999px;
		padding: var(--spacing-1) var(--spacing-2);
		font-size: var(--font-size-sm);
		color: var(--text-normal);
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		z-index: var(--z-tooltip);
		transform: translate(-50%, -50%);
		user-select: none;
	}

	.tooltip:hover {
		background: var(--interactive-hover);
	}
</style>
