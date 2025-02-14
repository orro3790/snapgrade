# Formatting Sidebar Implementation Plan

## Overview

Implementation plan for adding a formatting sidebar that provides easy access to formatting controls while maintaining A4 printability.

## Requirements

1. **Layout**

   - Sidebar positioned to left of A4 content
   - Fixed position while scrolling
   - Does not affect A4 dimensions/formatting
   - Print-friendly (sidebar should not appear in print)

2. **Formatting Controls**
   - Paragraph formatting
   - List formatting
   - Indentation
   - Headers/Titles

## Implementation Details

### 1. Layout Structure

```html
<div class="editor-wrapper">
	<!-- Formatting sidebar - fixed position -->
	<div class="formatting-sidebar print-hidden">
		<div class="formatting-controls">
			<!-- Formatting buttons here -->
		</div>
	</div>

	<!-- Main content with A4 preserved -->
	<div class="main-content">
		<div class="print-container">
			<div class="a4-content">
				<!-- Document content -->
			</div>
		</div>
	</div>
</div>
```

### 2. CSS Approach

```css
.editor-wrapper {
	display: flex;
	gap: var(--spacing-4);
}

.formatting-sidebar {
	position: sticky;
	top: var(--spacing-4);
	height: fit-content;
	width: 60px; /* Width for formatting buttons */
}

.formatting-controls {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
}

/* Preserve A4 dimensions */
.a4-content {
	width: 210mm;
	min-height: 297mm;
	/* Existing A4 styles */
}

/* Print styles */
@media print {
	.print-hidden {
		display: none;
	}

	.main-content {
		margin: 0;
		padding: 0;
	}
}
```

### 3. Components

1. **FormattingButton.svelte**

   - Reusable button component for formatting controls
   - Consistent styling
   - Tooltip support
   - Keyboard accessibility

2. **FormattingSidebar.svelte**
   - Container for formatting controls
   - Manages button state
   - Handles formatting operations

### 4. Implementation Steps

1. Create FormattingButton component

   - Standard button styling
   - Icon support
   - Active state
   - Hover effects

2. Create FormattingSidebar component

   - Layout structure
   - Button arrangement
   - Event handling

3. Update TextEditor component

   - Integrate sidebar
   - Adjust layout
   - Add print styles

4. Add formatting operations
   - Paragraph formatting
   - List creation
   - Indentation control
   - Header/title formatting

### 5. Print Considerations

1. **Print Media Queries**

   ```css
   @media print {
   	/* Hide UI elements */
   	.formatting-sidebar,
   	.mode-indicator {
   		display: none;
   	}

   	/* Reset margins/padding */
   	.main-content {
   		margin: 0;
   		padding: 0;
   	}

   	/* Ensure A4 dimensions */
   	.a4-content {
   		width: 210mm;
   		min-height: 297mm;
   		padding: 20mm;
   		margin: 0;
   		box-shadow: none;
   	}
   }
   ```

2. **Print-specific Classes**
   - Use .print-hidden for elements that shouldn't print
   - Ensure proper page breaks
   - Maintain document structure

## Next Steps

1. Create FormattingButton component
2. Implement FormattingSidebar
3. Update TextEditor layout
4. Add formatting operations
5. Test print output
