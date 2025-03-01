<script lang="ts">
	import CheckIcon from '$lib/icons/CheckIcon.svelte';
	import XIcon from '$lib/icons/XIcon.svelte';
	import AlertTriangleIcon from '$lib/icons/AlertTriangleIcon.svelte';
	import InfoIcon from '$lib/icons/InfoIcon.svelte';

	/**
	 * Type of notification - affects styling
	 */
	const { type = 'info', showIcon = true, icon = null, children, onDismiss = null } = $props<{
		type?: 'success' | 'error' | 'warning' | 'info';
		showIcon?: boolean;
		icon?: { component: any; props?: any } | null;
		children?: any;
		onDismiss?: (() => void) | null;
	}>();

	// Determine if the notification is dismissible
	const isDismissible = onDismiss !== null;

	// Handle click to dismiss
	function handleClick() {
		if (isDismissible && onDismiss) {
			onDismiss();
		}
	}
</script>

{#if isDismissible}
	<button
		class="notification {type} dismissible"
		onclick={handleClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleClick();
			}
		}}
		aria-label="Click to dismiss"
	>
		{#if showIcon}
			<div class="icon">
				{#if icon}
					<icon.component {...(icon.props || {})} />
				{:else}
					<!-- Default icons based on type -->
					{#if type === 'success'}
						<CheckIcon size="16px" />
					{:else if type === 'error'}
						<XIcon size="16px" />
					{:else if type === 'warning'}
						<AlertTriangleIcon size="16px" />
					{:else}
						<InfoIcon size="16px" />
					{/if}
				{/if}
			</div>
		{/if}
		<div class="content">
			{@render children?.()}
		</div>
	</button>
{:else}
	<div
		class="notification {type}"
		role={type === 'error' ? 'alert' : 'status'}
	>
		{#if showIcon}
			<div class="icon">
				{#if icon}
					<icon.component {...(icon.props || {})} />
				{:else}
					<!-- Default icons based on type -->
					{#if type === 'success'}
						<CheckIcon size="16px" />
					{:else if type === 'error'}
						<XIcon size="16px" />
					{:else if type === 'warning'}
						<AlertTriangleIcon size="16px" />
					{:else}
						<InfoIcon size="16px" />
					{/if}
				{/if}
			</div>
		{/if}
		<div class="content">
			{@render children?.()}
		</div>
	</div>
{/if}

<style>
	.notification {
		display: flex;
		align-items: center;
		padding: var(--spacing-2) var(--spacing-3);
		border-radius: var(--radius-base);
		font-size: var(--font-size-sm);
		gap: var(--spacing-2);
		border-left: 3px solid transparent;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.content {
		flex: 1;
	}

	/* Type variants */
	.success {
		background-color: rgba(var(--status-success-rgb), 0.1);
		border-left-color: var(--status-success);
		color: var(--status-success);
	}

	.error {
		background-color: rgba(var(--status-error-rgb), 0.1);
		border-left-color: var(--status-error);
		color: var(--status-error);
	}

	.warning {
		background-color: rgba(var(--status-warning-rgb), 0.1);
		border-left-color: var(--status-warning);
		color: var(--status-warning);
	}

	.info {
		background-color: rgba(var(--interactive-accent-rgb), 0.1);
		border-left-color: var(--interactive-accent);
		color: var(--interactive-accent);
	}

	.dismissible {
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.dismissible:hover {
		opacity: 0.8;
	}
</style>