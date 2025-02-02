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
				<div class="spinner"></div>
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
				<div class="spinner"></div>
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
		font-family: var(--brand);
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	/* Rounded variants using the theme border-radius */
	.btn.rounded-top {
		border-radius: 0.5rem 0.5rem 0 0;
	}

	.btn.rounded-bottom {
		border-radius: 0 0 0.5rem 0.5rem;
	}

	.btn.rounded-left {
		border-radius: 0.5rem 0 0 0.5rem;
	}

	.btn.rounded-right {
		border-radius: 0 0.5rem 0.5rem 0;
	}

	.btn.rounded-all {
		border-radius: 0.5rem;
	}

	/* Content wrapper for consistent alignment */
	.content-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 1.5em;
	}

	/* Size variants */
	.standard {
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
	}

	.small {
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
	}

	/* Icon styles with zoom effect */
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
	}

	.btn:hover .icon {
		transform: scale(1.1);
	}

	.btn:active .icon {
		transform: scale(0.98);
	}

	/* Label styling */
	.label {
		line-height: 1.5;
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
		border: 1px solid var(--background-modifier-border);
	}

	.secondary:hover {
		background-color: var(--interactive-hover);
	}

	.primary-inverted {
		background-color: transparent;
		color: var(--interactive-accent);
		border: 1px solid var(--interactive-accent);
	}

	.primary-inverted:hover {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.secondary-inverted {
		background-color: var(--background-secondary);
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
	}

	.secondary-inverted:hover {
		background-color: var(--background-secondary-alt);
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
	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 0.125rem solid var(--text-on-accent);
		border-top: 0.125rem solid transparent;
		border-radius: 50%;
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
