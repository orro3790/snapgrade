# Mode Toggle Implementation

## Overview

Added two distinct buttons for switching between formatting and correcting modes, with clear visual feedback for the active state.

## Implementation Details

### 1. Mode Toggle Buttons

- Two buttons in a button group:
  - Formatting mode (Paragraph icon)
  - Correcting mode (Pencil icon)
- Each button shows both icon and text label
- Clear visual indication of active state
- Located in the header next to document name

### 2. Mode Switching

- Click either button to switch directly to that mode
- Keyboard shortcut (Ctrl+M) still available to toggle between modes
- Immediate visual feedback when mode changes

### 3. Accessibility

- Button group has role="group" with descriptive label
- Each button has:
  - Appropriate aria-pressed state
  - aria-label for screen readers
  - Keyboard focus styles
- Maintains keyboard shortcut support

### 4. Styling

- Button group has subtle secondary background
- Active button:
  - Accent color background
  - White text and icon
  - aria-pressed="true"
- Inactive button:
  - Transparent background
  - Muted text and icon
  - Hover state for interaction feedback
- Smooth transitions between states
- Hidden in print view

## Benefits

1. Direct access to each mode
2. Clear visual hierarchy
3. Improved accessibility
4. Consistent with design system
5. Multiple ways to switch modes (click or keyboard)
