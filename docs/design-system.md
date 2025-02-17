# ESL Job Platform Design System

## Core Principles

- **Accessible**: WCAG 2.1 compliant with clear visual hierarchy and sufficient contrast
- **Consistent**: Standardized tokens ensure predictable layouts and behaviors
- **Purposeful**: Each design decision serves a clear functional goal
- **Scalable**: Patterns work across screen sizes and contexts
- **Performant**: Optimized transitions and animations for smooth interactions

## Typography

### Font Stack

Primary: 'Geist'

```css
font-family:
	'Geist',
	system-ui,
	-apple-system,
	sans-serif;
```

### Font Weights

- `--font-weight-regular: 400` - Body text, secondary content
- `--font-weight-medium: 500` - Navigation, interactive elements, emphasis
- `--font-weight-bold: 700` - Headings, primary actions

### Font Sizes

- `--font-size-xs: 0.75rem` (12px)
  - Labels in compact UIs
  - Meta information
  - Navigation group labels
- `--font-size-sm: 0.875rem` (14px)
  - Navigation items
  - Secondary text
  - Form labels
- `--font-size-base: 1rem` (16px)
  - Body text
  - Form inputs
  - Button text
- `--font-size-lg: 1.125rem` (18px)
  - Emphasized content
  - Section headers
- `--font-size-xl: 1.25rem` (20px)
  - Card headers
  - Modal titles
- `--font-size-2xl: 1.5rem` (24px)
  - Page section headers
- `--font-size-3xl: 1.875rem` (30px)
  - Page titles
- `--font-size-4xl: 2.25rem` (36px)
  - Hero content
  - Landing page headers

### Line Heights

- `--line-height-none: 1` - Single line text (buttons, labels)
- `--line-height-tight: 1.25` - Headings
- `--line-height-snug: 1.375` - Compact body text
- `--line-height-base: 1.5` - Default body text
- `--line-height-relaxed: 1.625` - Long-form content
- `--line-height-loose: 2` - Educational content

## Spacing System

### Component-Specific Spacing

- Micro (2-4px)
  - `--spacing-0-5: 0.125rem` (2px) - Minimal internal spacing
  - `--spacing-1: 0.25rem` (4px) - Tight grouping of related items
- Small (8-12px)
  - `--spacing-2: 0.5rem` (8px) - Default padding for navigation items
  - `--spacing-3: 0.75rem` (12px) - Form control padding
- Medium (16-24px)
  - `--spacing-4: 1rem` (16px) - Standard container padding
  - `--spacing-6: 1.5rem` (24px) - Section spacing
- Large (32px+)
  - `--spacing-8: 2rem` (32px) - Major section divisions
  - `--spacing-12: 3rem` (48px) - Page-level spacing
  - `--spacing-16: 4rem` (64px) - Hero sections

### Usage Guidelines

- Use smaller spacing (`--spacing-1` to `--spacing-2`) for related elements
- Use medium spacing (`--spacing-4` to `--spacing-6`) for section divisions
- Use larger spacing (`--spacing-8` and above) for major layout blocks

## Color System

### Background Colors

- `--background-primary: #202020`
  - Main application background
  - Sidebar base
- `--background-alt: #1a1a1a`
  - Alternative sections
  - Cards
- `--background-secondary: #161616`
  - Nested components
  - Dropdowns
- `--background-modifier-hover: #303030`
  - Interactive element hover states
  - Navigation item hover

### Text Colors

- `--text-normal: #dcddde` - Primary content
- `--text-muted: #999`
  - Secondary text
  - Icon default state
  - Navigation labels
- `--text-faint: #666` - Tertiary content
- `--text-accent: #7f6df2` - Interactive elements
- `--text-on-accent: #ffffff` - Text on colored backgrounds

### Interactive Colors

- `--interactive-accent: #7f6df2`
  - Primary buttons
  - Active navigation items
  - Selected states
- `--interactive-accent-hover: #8875ff`
  - Hover state for accent elements
- `--interactive-accent-secondary: #483699`
  - Focus rings
  - Secondary actions

### Status Colors

Use for feedback and system states:

- `--status-error: #ff3333` - Error messages, destructive actions
- `--status-success: #197300` - Success confirmations
- `--status-warning: #ffd700` - Warning states
- `--status-info: #7f6df2` - Information messages

## Component Patterns

### Navigation Items

```css
.nav-item {
	display: flex;
	align-items: center;
	gap: var(--spacing-4);
	padding: var(--spacing-2);
	height: var(--spacing-8);
	border-radius: var(--radius-base);
}
```

### Icons

Base Sizes:

- `--icon-xs: 1rem` (16px) - Inline indicators
- `--icon-sm: 1.25rem` (20px) - Navigation icons
- `--icon-base: 1.5rem` (24px) - Standard UI elements
- `--icon-lg: 2rem` (32px) - Feature highlights
- `--icon-xl: 2.5rem` (40px) - Hero sections
- `--icon-2xl: 3rem` (48px) - Splash displays

Implementation:

```svelte
<Icon size="var(--icon-sm)" stroke="var(--text-muted)" />
```

## Layout & Structure

### Z-Index Scale

Organized by UI layer:

- `--z-dropdown: 10` - Dropdown menus
- `--z-sticky: 20` - Sticky headers
- `--z-drawer: 30` - Sidebar, drawers
- `--z-modal: 40` - Modal dialogs
- `--z-popover: 50` - Tooltips, popovers

### Shadows

- `--shadow-sm` - Subtle elevation (buttons)
- `--shadow-base` - Cards, dropdowns
- `--shadow-md` - Floating elements
- `--shadow-lg` - Modals
- `--shadow-xl` - Notifications

### Border Radius

- `--radius-base: 0.25rem` (4px)
  - Buttons
  - Input fields
  - Navigation items
- `--radius-lg: 0.5rem` (8px)
  - Cards
  - Modals
- `--radius-full: 9999px`
  - Avatars
  - Pills

## Animations & Transitions

### Duration Tokens

- `--transition-duration-150: 150ms` - Micro-interactions
- `--transition-duration-200: 200ms` - Standard transitions
- `--transition-duration-300: 300ms`
