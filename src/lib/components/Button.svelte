<!-- File: src/lib/components/Button.svelte -->
<script lang="ts">
	const {
		label = 'Click Me',
		type = 'primary',
		to = null,
		ClickFunction = null,
		isSubmit = false,
		formId = null,
		size = 'standard',
		icon = null,
		fill = false,
		disabled = false,
		isLoading = $bindable(),
		selected = $bindable(false),
		rounded = 'all'
	} = $props();

	const handleClick = (event: { preventDefault: () => void }) => {
		if (to === null) {
			event.preventDefault();
			if (ClickFunction) {
				ClickFunction();
			}
		}
	};
</script>

{#if isSubmit}
	<button
		type="submit"
		form={formId}
		class={`btn ${type} ${size} ${fill ? 'fill' : ''} ${selected ? 'selected' : ''}`}
		class:rounded-top={rounded === 'top'}
		class:rounded-bottom={rounded === 'bottom'}
		class:rounded-left={rounded === 'left'}
		class:rounded-right={rounded === 'right'}
		class:rounded-none={rounded === 'none'}
		class:rounded-all={rounded === 'all'}
		disabled={disabled || isLoading}
	>
		<div class="content-wrapper">
			{#if isLoading}
				<div class="spinner-container">
					<div class="spinner"></div>
				</div>
			{:else}
				{#if icon}
					<div class="icon">
						<icon.component {...icon.props} />
					</div>
				{/if}
				<span class="label">{label}</span>
			{/if}
		</div>
	</button>
{:else}
	<a
		href={to || '#'}
		class={`btn ${type} ${size} ${fill ? 'fill' : ''} ${selected ? 'selected' : ''}`}
		class:rounded-top={rounded === 'top'}
		class:rounded-bottom={rounded === 'bottom'}
		class:rounded-left={rounded === 'left'}
		class:rounded-right={rounded === 'right'}
		class:rounded-none={rounded === 'none'}
		class:rounded-all={rounded === 'all'}
		onclick={handleClick}
		class:disabled={disabled || isLoading}
	>
		<div class="content-wrapper">
			{#if isLoading}
				<div class="spinner-container">
					<div class="spinner"></div>
				</div>
			{:else}
				{#if icon}
					<div class="icon">
						<icon.component {...icon.props} />
					</div>
				{/if}
				<span class="label">{label}</span>
			{/if}
		</div>
	</a>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-family-base);
		font-weight: var(--font-weight-medium);
		border: none;
		cursor: pointer;
		transition: var(--transition-all);
		text-decoration: none;
		min-width: 80px; /* Ensure minimum width for buttons */
	}

	/* Rounded variants using the theme border-radius */
	.btn.rounded-top {
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	}

	.btn.rounded-bottom {
		border-radius: 0 0 var(--radius-lg) var(--radius-lg);
	}

	.btn.rounded-left {
		border-radius: var(--radius-lg) 0 0 var(--radius-lg);
	}

	.btn.rounded-right {
		border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
	}

	.btn.rounded-all {
		border-radius: var(--radius-base);
	}

	/* Content wrapper for consistent alignment */
	.content-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		min-height: 1.5em;
	}

	/* Size variants */
	.standard {
		padding: var(--spacing-2) var(--spacing-4);
		font-size: var(--font-size-sm);
	}
	
	.small {
		padding: var(--spacing-1) var(--spacing-3);
		font-size: var(--font-size-xs);
	}
	
	.compact {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}
	
	.large {
		padding: var(--spacing-3) var(--spacing-6);
		font-size: var(--font-size-base);
	}

	/* Icon styles with zoom effect */
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform var(--transition-duration-200) var(--transition-timing-ease);
	}

	.btn:hover .icon {
		transform: scale(1.1);
	}

	.btn:active .icon {
		transform: scale(0.98);
	}

	/* Label styling */
	.label {
		line-height: var(--line-height-base);
	}

	/* Button variants using theme colors */
	.primary {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.primary:hover {
		background-color: var(--interactive-accent-hover);
	}

	.secondary {
		background-color: var(--interactive-normal);
		color: var(--text-normal);
		border: var(--border-width-thin) solid var(--background-modifier-border);
	}

	.secondary:hover {
		background-color: var(--interactive-hover);
	}

	.primary-inverted {
		background-color: transparent;
		color: var(--interactive-accent);
		border: var(--border-width-thin) solid var(--interactive-accent);
	}

	.primary-inverted:hover {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.secondary-inverted {
		background-color: var(--background-secondary);
		color: var(--text-normal);
		border: var(--border-width-thin) solid var(--background-modifier-border);
	}

	.secondary-inverted:hover {
		background-color: var(--background-secondary-alt);
	}

	.ghost {
		background-color: transparent;
		color: var(--text-normal);
	}

	.ghost:hover {
		background-color: var(--background-modifier-hover);
	}
	
	.danger-ghost {
		background-color: transparent;
		color: var(--text-muted);
		border: var(--border-width-thin) solid transparent;
		transition: var(--transition-all);
		margin-bottom: var(--spacing-4);
	}
	
	.danger-ghost:hover {
		color: var(--status-error);
		border-color: var(--status-error);
		background-color: transparent;
	}

	.danger {
		background-color: var(--status-error);
		color: var(--text-on-accent);
	}

	.danger:hover {
		background-color: var(--status-error-hover);
	}

	/* Selected state */
	.selected {
		background-color: var(--interactive-accent-hover);
		color: var(--text-on-accent);
	}

	/* Fill variant */
	.fill {
		width: 100%;
		height: 100%;
	}

	/* Loading spinner */
	.spinner-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-width: 100%;
		/* Force the spinner container to maintain the same width as the text */
		width: 100%;
	}
	
	.spinner {
		width: var(--icon-sm);
		height: var(--icon-sm);
		border: var(--border-width-thin) solid var(--text-on-accent);
		border-top: var(--border-width-thin) solid transparent;
		border-radius: var(--radius-full);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Disabled state */
	.btn:disabled,
	.btn.disabled {
		cursor: not-allowed;
		opacity: 0.6;
		pointer-events: none;
	}
</style>
