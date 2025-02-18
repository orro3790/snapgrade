<!-- File: src/lib/components/Tooltip.svelte -->
<script lang="ts">
	interface Props {
		tooltip?: string | boolean;
		position?: 'top' | 'bottom' | 'left' | 'right';
		delay?: number; // Default delay in milliseconds
		children?: import('svelte').Snippet;
	}

	let { tooltip = false, position = 'top', delay = 0, children }: Props = $props();

	let showTooltip = $state(true);
	let timeoutId: ReturnType<typeof setTimeout>;

	function handleMouseEnter() {
		timeoutId = setTimeout(() => {
			showTooltip = true;
		}, delay);
	}

	function handleMouseLeave() {
		clearTimeout(timeoutId);
		showTooltip = false;
	}
</script>

<div
	class="tooltip-wrapper"
	data-position={position}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	{@render children?.()}
	{#if tooltip && showTooltip}
		<div class="tooltip" role="tooltip">
			<div class="tooltip-content">{tooltip}</div>
			<div class="tooltip-arrow"></div>
		</div>
	{/if}
</div>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.tooltip {
		position: absolute;
		z-index: var(--z-popover);
		pointer-events: none;
		opacity: 0;
		animation: fadeIn 0.15s ease forwards;
		box-shadow: var(--shadow-md);
	}

	.tooltip-content {
		background: var(--background-secondary);
		color: var(--text-normal);
		padding: var(--spacing-1) var(--spacing-2);
		border-radius: var(--radius-base);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-none);
		white-space: nowrap;
		border: 1px solid var(--background-modifier-border);
		text-align: center;
	}

	.tooltip-arrow {
		position: absolute;
		width: 6px;
		height: 6px;
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-top: none;
		border-left: none;
		transform: rotate(45deg);
	}

	/* Top position with proper spacing */
	.tooltip-wrapper[data-position='top'] .tooltip {
		bottom: calc(100% + var(--spacing-2));
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip-wrapper[data-position='top'] .tooltip-arrow {
		bottom: -3px;
		left: 50%;
		margin-left: -3px;
	}

	/* Bottom position with proper spacing */
	.tooltip-wrapper[data-position='bottom'] .tooltip {
		top: calc(100% + var(--spacing-2));
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip-wrapper[data-position='bottom'] .tooltip-arrow {
		top: -3px;
		left: 50%;
		margin-left: -3px;
		transform: rotate(225deg);
	}

	/* Left position with proper spacing */
	.tooltip-wrapper[data-position='left'] .tooltip {
		right: calc(100% + var(--spacing-2));
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip-wrapper[data-position='left'] .tooltip-arrow {
		right: -3px;
		top: 50%;
		margin-top: -3px;
		transform: rotate(135deg);
	}

	/* Right position with proper spacing */
	.tooltip-wrapper[data-position='right'] .tooltip {
		left: calc(100% + var(--spacing-2));
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip-wrapper[data-position='right'] .tooltip-arrow {
		left: -3px;
		top: 50%;
		margin-top: -3px;
		transform: rotate(315deg);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(var(--translate-x, -50%), var(--translate-y, -4px));
		}
		to {
			opacity: 1;
			transform: translate(var(--translate-x, -50%), var(--translate-y, 0));
		}
	}

	/* Position-specific animations */
	.tooltip-wrapper[data-position='top'] .tooltip {
		--translate-y: -4px;
	}

	.tooltip-wrapper[data-position='bottom'] .tooltip {
		--translate-y: 4px;
	}

	.tooltip-wrapper[data-position='left'] .tooltip {
		--translate-x: -4px;
		--translate-y: -50%;
	}

	.tooltip-wrapper[data-position='right'] .tooltip {
		--translate-x: 4px;
		--translate-y: -50%;
	}

	/* Ensure tooltip wrapper fills grid cell */
	:global(.actions .tooltip-wrapper) {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
