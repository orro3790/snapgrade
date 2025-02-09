# ESL Job Platform Design System

This design system provides a consistent and accessible foundation for building user interfaces across the ESL Job Platform. It combines Geist typography with a carefully crafted set of design tokens for spacing, colors, and interactions.

## Design Principles

- **Accessible**: Following WCAG 2.1 guidelines for text contrast and interactive elements
- **Consistent**: Using standardized tokens for predictable layouts and interactions
- **Purposeful**: Every design decision serves a clear functional purpose
- **Scalable**: Design patterns that work across different screen sizes and contexts

## Typography

### Font Family

We use Geist for its excellent readability and modern feel:

- Primary: 'Geist' for all interface text
- Weights: Regular (400), Medium (500), Bold (700)

### Font Sizes

- `--font-size-xs`: 0.75rem (12px) - Fine print, captions, tags
- `--font-size-sm`: 0.875rem (14px) - Secondary text, supporting information
- `--font-size-base`: 1rem (16px) - Default body text
- `--font-size-lg`: 1.125rem (18px) - Emphasized body text
- `--font-size-xl`: 1.25rem (20px) - Small headings
- `--font-size-2xl`: 1.5rem (24px) - Medium headings
- `--font-size-3xl`: 1.875rem (30px) - Large headings
- `--font-size-4xl`: 2.25rem (36px) - Main headings

## Spacing

Our spacing scale is based on 4px increments for consistent rhythm:

- `--spacing-1`: 0.25rem (4px) - Minimal spacing between related elements
- `--spacing-2`: 0.5rem (8px) - Default spacing between unrelated elements
- `--spacing-3`: 0.75rem (12px) - Padding in smaller components
- `--spacing-4`: 1rem (16px) - Standard container padding
- `--spacing-6`: 1.5rem (24px) - Section spacing
- `--spacing-8`: 2rem (32px) - Major section divisions
- `--spacing-12`: 3rem (48px) - Page-level spacing
- `--spacing-16`: 4rem (64px) - Large compositions

## Colors

### Background Colors

- `--background-primary`: #202020 - Main application background
- `--background-alt`: #1a1a1a - Alternative background for contrast
- `--background-modifier-hover`: #303030 - Hover states
- `--background-modifier-active`: #404040 - Active/selected states

### Text Colors

- `--text-normal`: #dcddde - Primary content
- `--text-muted`: #999 - Secondary content
- `--text-faint`: #666 - Tertiary content
- `--text-accent`: #7f6df2 - Interactive elements
- `--text-on-accent`: #ffffff - Text on accent backgrounds

### Interactive Colors

- `--interactive-normal`: #2a2a2a - Default state
- `--interactive-hover`: #303030 - Hover state
- `--interactive-accent`: #7f6df2 - Primary actions
- `--interactive-accent-hover`: #8875ff - Primary actions hover

### Status Colors

- `--status-error`: #ff3333 - Error states and destructive actions
- `--status-success`: #197300 - Success states and confirmations
- `--status-warning`: #ffd700 - Warnings and important notices
- `--status-info`: #7f6df2 - Informational content

## Icons

### Icon Sizes

We use standardized sizes for icons throughout the interface. When implementing icons, pass these size tokens as props:

\`\`\`typescript
type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
\`\`\`

- `--icon-xs`: 1rem (16px) - Used for:

  - Inline text indicators
  - Small status indicators
  - Dense UI elements

- `--icon-sm`: 1.25rem (20px) - Used for:

  - Navigation items
  - Toolbar actions
  - List items

- `--icon-base`: 1.5rem (24px) - Used for:

  - Default button icons
  - Standard UI elements
  - Form field add-ons

- `--icon-lg`: 2rem (32px) - Used for:

  - Primary actions
  - Feature highlights
  - Card actions

- `--icon-xl`: 2.5rem (40px) - Used for:

  - Hero sections
  - Empty states
  - Feature introductions

- `--icon-2xl`: 3rem (48px) - Used for:
  - Splash screens
  - Large displays
  - Marketing sections

### Implementation

When using icons in components:

\`\`\`svelte
<Icon size="base" /> <!-- Default size -->
<Icon size="lg" /> <!-- Larger, more prominent -->
<Icon size="sm" /> <!-- Smaller, supporting -->
\`\`\`

### Icon Colors

Icons inherit their color from the text color by default. Use semantic color tokens for different states:

- Default: Inherits from parent
- Muted: `--text-muted`
- Accent: `--text-accent`
- Error: `--status-error`
- Success: `--status-success`

## Animation & Transitions

### Durations

- `--duration-instant`: 0ms - Immediate feedback
- `--duration-fast`: 100ms - Micro-interactions (hover)
- `--duration-normal`: 200ms - Standard interactions (buttons)
- `--duration-slow`: 300ms - Complex animations (modals)
- `--duration-slower`: 500ms - Elaborate transitions

### Easing Functions

- `--ease-in-out`: Default smoothing
- `--ease-in`: Elements leaving the screen
- `--ease-out`: Elements entering the screen
- `--ease-bounce`: Playful interactions

## Shadows & Elevation

- `--shadow-sm`: Subtle elevation (buttons, cards)
- `--shadow-base`: Default elevation (dropdowns)
- `--shadow-md`: Medium elevation (popovers)
- `--shadow-lg`: High elevation (modals)
- `--shadow-xl`: Highest elevation (notifications)

## Border Radius

- `--radius-sm`: 0.125rem (2px) - Subtle rounding
- `--radius-base`: 0.25rem (4px) - Default rounding
- `--radius-md`: 0.375rem (6px) - Medium rounding
- `--radius-lg`: 0.5rem (8px) - Large rounding
- `--radius-full`: 9999px - Circular elements

## Z-Index Scale

- `--z-dropdown`: 10 - Dropdown menus
- `--z-sticky`: 20 - Sticky elements
- `--z-drawer`: 30 - Drawers/Sidebars
- `--z-modal`: 40 - Modals/Dialogs
- `--z-popover`: 50 - Popovers/Tooltips
