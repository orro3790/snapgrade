# Tooltip Styling and Positioning Improvements

## Current Issues

1. Incorrect positioning relative to buttons
2. Styling doesn't match design system
3. Grid layout affecting tooltip placement

## Design System Requirements

### Typography

- Font Size: `--font-size-xs` (12px)
- Font Weight: `--font-weight-medium`
- Line Height: `--line-height-none`

### Colors

- Background: `--background-secondary` (#161616)
- Text: `--text-normal` (#dcddde)
- Border: `--background-modifier-border`

### Spacing

- Padding: `--spacing-2` (8px) horizontal, `--spacing-1` (4px) vertical
- Offset from button: `--spacing-2` (8px)

### Visual

- Z-Index: `--z-popover` (50)
- Shadow: `--shadow-md`
- Border Radius: `--radius-base` (4px)
- Transition: `--transition-duration-150` (150ms)

## Implementation Changes

### 1. Update Tooltip Component CSS

```css
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
}
```

### 2. Fix Grid Layout Issues

```css
.actions {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	border-top: 1px solid var(--background-modifier-border);
	position: relative; /* Ensure tooltip positioning context */
}

/* Ensure tooltip wrapper fills grid cell */
.actions :global(.tooltip-wrapper) {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}
```

### 3. Adjust Tooltip Positioning

```css
/* Top position with proper offset */
.tooltip-wrapper[data-position='top'] .tooltip {
	bottom: calc(100% + var(--spacing-2));
	left: 50%;
	transform: translateX(-50%);
}

/* Ensure arrow aligns with new positioning */
.tooltip-wrapper[data-position='top'] .tooltip-arrow {
	bottom: calc(var(--spacing-1) * -1);
	left: 50%;
	margin-left: calc(var(--spacing-1) * -1);
}
```

### 4. Improve Animation

```css
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
```

## Implementation Steps

1. Update Tooltip Component

- Apply new styling from design system
- Fix positioning calculations
- Improve animation timing

2. Adjust EditModal Integration

- Ensure proper grid layout
- Fix tooltip wrapper positioning
- Add proper spacing

3. Test Cases

- Verify tooltip positioning across all buttons
- Check animation smoothness
- Ensure proper text wrapping
- Test across different viewport sizes

## Success Criteria

1. Tooltips appear directly above buttons with proper spacing
2. Styling matches design system
3. Animations are smooth and subtle
4. Text is clearly readable
5. Layout remains stable across different tooltip lengths
6. Grid layout is not disrupted
