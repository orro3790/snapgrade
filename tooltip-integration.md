# Tooltip Integration for EditModal

## Overview

Add tooltips to disabled buttons in EditModal to show error messages in a subtle, user-friendly way.

## Implementation Plan

### 1. Import Tooltip Component

```svelte
import Tooltip from '$lib/components/Tooltip.svelte';
```

### 2. Wrap Buttons with Tooltips

Replace each button with a Tooltip-wrapped version:

```svelte
<Tooltip
	tooltip={!deleteResult.allowed ? deleteResult.reason : undefined}
	position="top"
	delay={300}
>
	<button
		onclick={handleDelete}
		type="button"
		disabled={!deleteResult.allowed}
		class:disabled={!deleteResult.allowed}
	>
		<Slash />
	</button>
</Tooltip>
```

### 3. Update Button Styles

Ensure tooltip positioning works with the grid layout:

```css
.actions {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	border-top: 1px solid var(--background-modifier-border);
}

/* Ensure tooltip wrapper fills grid cell */
.actions :global(.tooltip-wrapper) {
	width: 100%;
	height: 100%;
}
```

### 4. Implementation for Each Button

#### Delete Button

```svelte
<Tooltip
	tooltip={!deleteResult.allowed ? deleteResult.reason : undefined}
	position="top"
	delay={300}
>
	<button>...</button>
</Tooltip>
```

#### Add Button

```svelte
<Tooltip tooltip={!addResult.allowed ? addResult.reason : undefined} position="top" delay={300}>
	<button>...</button>
</Tooltip>
```

#### Correction Button

```svelte
<Tooltip
	tooltip={!correctionResult.allowed ? correctionResult.reason : undefined}
	position="top"
	delay={300}
>
	<button>...</button>
</Tooltip>
```

#### Remove Button

```svelte
<Tooltip
	tooltip={!removeResult.allowed ? removeResult.reason : undefined}
	position="top"
	delay={300}
>
	<button>...</button>
</Tooltip>
```

## Benefits

1. Improved User Experience

   - Clear feedback on why actions are disabled
   - Non-intrusive tooltips that appear only when needed
   - Consistent delay prevents accidental tooltip triggers

2. Accessibility

   - Maintains ARIA roles and labels
   - Keyboard navigation support
   - Clear error messaging

3. Visual Design
   - Subtle animations for tooltip appearance
   - Consistent positioning across all buttons
   - Proper spacing and layout preservation

## Implementation Steps

1. Update EditModal.svelte

   - Import Tooltip component
   - Wrap each button with Tooltip
   - Add CSS for tooltip integration

2. Test Functionality

   - Verify tooltips appear on hover for disabled buttons
   - Check tooltip positioning
   - Ensure grid layout remains intact
   - Test keyboard navigation

3. Verify Error Messages
   - Test all command validation scenarios
   - Verify tooltip content matches command reasons
   - Check tooltip behavior with different button states

## Success Criteria

1. Tooltips only appear for disabled buttons
2. Error messages are clear and helpful
3. Grid layout remains intact
4. Animations are smooth
5. Keyboard navigation works
6. All ARIA attributes are preserved
