<!-- src/lib/components/StatusNotification.svelte -->
<script lang="ts">
	/**
	 * Type of notification - affects styling
	 */
	const { type = 'info', showIcon = true, icon = null, children } = $props<{
		type?: 'success' | 'error' | 'warning' | 'info';
		showIcon?: boolean;
		icon?: { component: any; props?: any } | null;
		children?: any;
	}>();
</script>

<div class="notification {type}" role={type === 'error' ? 'alert' : 'status'}>
	{#if showIcon}
		<div class="icon">
			{#if icon}
				<icon.component {...(icon.props || {})} />
			{:else}
				<!-- Default icons based on type -->
				{#if type === 'success'}
					<!-- Checkmark icon -->
					<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
				{:else if type === 'error'}
					<!-- X icon -->
					<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				{:else if type === 'warning'}
					<!-- Alert triangle -->
					<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
						<line x1="12" y1="9" x2="12" y2="13"></line>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
				{:else}
					<!-- Info icon -->
					<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="16" x2="12" y2="12"></line>
						<line x1="12" y1="8" x2="12.01" y2="8"></line>
					</svg>
				{/if}
			{/if}
		</div>
	{/if}
	<div class="content">
		{@render children?.()}
	</div>
</div>

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
</style>