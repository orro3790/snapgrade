# Document Details UI Improvements

## Current Issues

1. The "Open in Editor" button is not properly aligned
2. The "Assignment saved successfully!" message lacks sufficient visual emphasis

## Proposed Changes

### 1. Align "Open in Editor" Button to the Right

In `src/routes/DocumentDetails.svelte`, update the following CSS:

```css
.preview-header {
	display: flex;
	justify-content: flex-end; /* Change from space-between to flex-end */
	align-items: center;
	margin-bottom: var(--spacing-3);
}

.preview-actions {
	display: flex;
	gap: var(--spacing-2);
}
```

### 2. Improve Success Message Visibility

Create a new reusable notification component for inline messages. This approach maintains your existing color scheme but adds visual emphasis through background and border styling.

#### Step 1: Create StatusNotification Component

Create a new file `src/lib/components/StatusNotification.svelte`:

```svelte
<!-- src/lib/components/StatusNotification.svelte -->
<script lang="ts">
	/**
	 * Type of notification - affects styling
	 */
	const { type = 'info' } = $props<{
		type?: 'success' | 'error' | 'warning' | 'info';
	}>();

	/**
	 * Optional custom icon to display
	 */
	let { icon = null } = $props<{
		icon?: { component: any; props?: any } | null;
	}>();

	/**
	 * Whether to show the default icon for the notification type
	 */
	const { showIcon = true } = $props<{
		showIcon?: boolean;
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
		<slot></slot>
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
```

#### Step 2: Add RGB Variables to App.css

To support the semi-transparent backgrounds, add RGB versions of your color variables to `src/app.css`:

```css
:root {
  /* Add these RGB variables after your existing color variables */
  --status-success-rgb: 40, 167, 69;
  --status-error-rgb: 220, 53, 69;
  --status-warning-rgb: 255, 193, 7;
  --interactive-accent-rgb: 58, 130, 246;
}
```

#### Step 3: Replace Success Message in DocumentDetails.svelte

Update the success message in DocumentDetails.svelte:

```svelte
<!-- Replace this: -->
{#if saveSuccess}
  <div class="save-container">
    <span class="save-success">Assignment saved successfully!</span>
  </div>
{/if}

<!-- With this: -->
{#if saveSuccess}
  <div class="save-container">
    <StatusNotification type="success">
      Assignment saved successfully!
    </StatusNotification>
  </div>
{/if}
```

Don't forget to import the component at the top:

```svelte
<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import StatusNotification from '$lib/components/StatusNotification.svelte';
  // ...rest of imports
</script>
```

## Benefits of This Approach

1. **Modularity**: Creates a reusable notification component that can be used throughout the application
2. **Consistency**: Maintains a consistent visual language for status messages
3. **Accessibility**: Proper ARIA roles for screen readers
4. **Visual Hierarchy**: Uses subtle background colors and left borders to create visual emphasis without changing text size or color
5. **Modern Design**: Follows contemporary UI patterns with clean, minimal styling that enhances rather than distracts

## Additional Considerations

You could extend the `StatusNotification` component with:

1. Configurable density (compact vs. standard)
2. Dismissible option
3. Auto-dismiss timeout for temporary notifications
4. Animation effects for appear/disappear