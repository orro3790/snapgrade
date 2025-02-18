# EditModal Refactor Plan

## Objective

Add a vertical separator to distinguish between editing functions and node controls in the EditModal component.

## Implementation Steps

1. Restructure the actions container HTML:

   - Create two button groups within the actions container
   - Add a separator element between the groups
   - Maintain existing button order and functionality

2. Add CSS styling:

   - Style the separator using CSS custom properties for consistency
   - Ensure proper spacing around the separator
   - Maintain responsive behavior

3. Accessibility considerations:
   - Add appropriate ARIA roles for button groups
   - Maintain existing keyboard navigation
   - Add descriptive labels for each group

## Code Changes

### HTML Structure

```svelte
<div class="actions" role="toolbar" aria-label="Editing actions">
	<!-- Editing Functions Group -->
	<div class="button-group" role="group" aria-label="Text editing actions">
		<!-- Delete, Correct, Replace buttons -->
	</div>

	<!-- Separator -->
	<div class="actions-separator" role="separator" aria-hidden="true"></div>

	<!-- Node Controls Group -->
	<div class="button-group" role="group" aria-label="Node control actions">
		<!-- Remove, Add buttons -->
	</div>
</div>
```

### CSS Additions

```css
.actions {
	/* Existing styles */
	align-items: center; /* Added to vertically center the separator */
}

.button-group {
	display: flex;
	gap: var(--spacing-1);
}

.actions-separator {
	width: 1px;
	height: var(--spacing-6);
	background: var(--background-modifier-border);
	margin: 0 var(--spacing-2);
}
```

## Testing Criteria

1. Verify visual separation is clear and consistent
2. Confirm all buttons remain functional
3. Test keyboard navigation works as expected
4. Validate ARIA roles and labels
5. Check responsive behavior on different screen sizes
