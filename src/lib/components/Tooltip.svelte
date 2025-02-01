<!-- File: src/lib/components/Tooltip.svelte -->
<script lang="ts">
	export let tooltip: string | boolean = false;
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
	export let delay: number = 0; // Default delay in milliseconds

	let showTooltip = true;
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
	role="button"
	tabindex="0"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onfocus={handleMouseEnter}
	onblur={handleMouseLeave}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleMouseEnter();
		}
	}}
>
	<slot />
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
		z-index: 1000;
		pointer-events: none;
		opacity: 0;
		animation: fadeIn 0.2s ease forwards;
	}

	.tooltip-content {
		background: var(--secondary-2);
		color: var(--primary-0);
		padding: var(--padding-small) var(--padding-medium);
		border-radius: var(--standard-radius);
		font-size: var(--font-size-smaller);
		white-space: nowrap;
		box-shadow: var(--standard-shadow);
		text-align: center;
	}

	.tooltip-arrow {
		position: absolute;
		width: 8px;
		height: 8px;
		background: var(--secondary-2);
		transform: rotate(45deg);
	}

	/* Top position */
	.tooltip-wrapper[data-position='top'] .tooltip {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		padding-bottom: 6px;
	}

	.tooltip-wrapper[data-position='top'] .tooltip-arrow {
		bottom: 2px;
		left: 50%;
		margin-left: -4px;
	}

	/* Bottom position */
	.tooltip-wrapper[data-position='bottom'] .tooltip {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		padding-top: 6px;
	}

	.tooltip-wrapper[data-position='bottom'] .tooltip-arrow {
		top: 2px;
		left: 50%;
		margin-left: -4px;
	}

	/* Left position */
	.tooltip-wrapper[data-position='left'] .tooltip {
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		padding-right: 6px;
	}

	.tooltip-wrapper[data-position='left'] .tooltip-arrow {
		right: 2px;
		top: 50%;
		margin-top: -4px;
	}

	/* Right position */
	.tooltip-wrapper[data-position='right'] .tooltip {
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		padding-left: 6px;
	}

	.tooltip-wrapper[data-position='right'] .tooltip-arrow {
		left: 2px;
		top: 50%;
		margin-top: -4px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(var(--translate-x, -50%), var(--translate-y, -5px));
		}
		to {
			opacity: 1;
			transform: translate(var(--translate-x, -50%), var(--translate-y, 0));
		}
	}

	/* Position-specific animations */
	.tooltip-wrapper[data-position='top'] .tooltip {
		--translate-y: -5px;
	}

	.tooltip-wrapper[data-position='bottom'] .tooltip {
		--translate-y: 5px;
	}

	.tooltip-wrapper[data-position='left'] .tooltip {
		--translate-x: -5px;
		--translate-y: -50%;
	}

	.tooltip-wrapper[data-position='right'] .tooltip {
		--translate-x: 5px;
		--translate-y: -50%;
	}
</style>
