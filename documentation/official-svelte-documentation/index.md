# Svelte Documentation Index

## Purpose

This index organizes Svelte documentation to help you quickly locate relevant information for solving Svelte development problems. Each entry links to detailed documentation and includes context about when to use each feature in development.

## Core Concepts

### Foundation

- **overview.md**: Fundamental concepts and architecture of Svelte
- **getting-started.md**: Initial setup and basic application structure
- **svelte-files.md**: Structure and syntax of .svelte files
- **svelte-js-ts-files.md**: JavaScript and TypeScript integration in Svelte

### Reactivity System

- **what-are-runes.md**: Modern reactivity system using runes
- **state.md**: Managing component state with $state
- **derived.md**: Computing derived values with $derived
- **effect.md**: Handling side effects with $effect
- **props.md**: Component properties and data flow with $props
- **bindable.md**: Two-way binding capabilities with $bindable
- **inspect.md**: Debugging reactive values with $inspect
- **host.md**: Accessing component DOM elements with $host

## Template Syntax

### Control Flow

- **basic-markup.md**: Essential template syntax for building components
- **if.md**: Conditional rendering with {#if}, {:else}, and {:else if}
- **each.md**: List rendering and iterations with {#each}
- **key.md**: Optimizing dynamic content updates with {#key}
- **await.md**: Handling asynchronous data with {#await}
- **snippet.md**: Reusable template fragments with {#snippet}

### Template Tags

- **render.md**: {@render ...} - Dynamic component rendering
- **html.md**: {@html ...} - Rendering raw HTML content safely
- **const.md**: {@const ...} - Defining template-level constants
- **debug.md**: {@debug ...} - Debugging template state

## Interactivity and Bindings

### Data Flow

- **bind.md**: Form input binding and two-way data flow
- **use.md**: Action directives for DOM element interactions
- **transition.md**: Animation transitions between states
- **in-and-out.md**: Enter/exit animations for elements
- **animate.md**: List item animations and movement

## Styling

### CSS Management

- **style.md**: Inline dynamic styles with style:
- **class.md**: Dynamic class assignments with class:
- **scoped-styles.md**: Component-scoped CSS and isolation
- **global-styles.md**: Application-wide style management
- **custom-properties.md**: CSS variables and dynamic theming
- **nested-style-elements.md**: Organizing styles within components

## Application Architecture

### State Management

- **stores.md**: Global state management with Svelte stores
- **context.md**: Component tree data sharing with context

### Component Lifecycle

- **lifecycle-hooks.md**: Component lifecycle events and hooks
- **imperative-component-api.md**: Programmatic component control

## Development and Integration

### Tools and Testing

- **testing.md**: Testing Svelte applications and components
- **typescript.md**: TypeScript integration and type safety
- **custom-elements.md**: Web Components integration and usage

## Migration and Support

### References

- **v5-migration-guide.md**: Upgrading to Svelte 5
- **faq.md**: Common problems and solutions

## Problem-Solution Mapping

### Component Development

- Component not updating: Check state.md, effect.md
- Props not passing correctly: See props.md, typescript.md
- Event handling issues: Review bind.md, use.md
- Style isolation problems: Reference scoped-styles.md, global-styles.md

### State Management

- Reactivity not working: Consult state.md, derived.md
- Shared state issues: Review stores.md, context.md
- Complex state updates: See effect.md, derived.md
- Type-safe state: Check typescript.md, props.md

### Performance Optimization

- Slow rendering: Review key.md, each.md
- Memory leaks: Check lifecycle-hooks.md, effect.md
- Animation performance: See transition.md, animate.md
- Bundle size issues: Consult custom-elements.md

### Common Development Tasks

- Form handling: Reference bind.md, state.md
- Data fetching: See await.md, stores.md
- Routing integration: Check context.md, lifecycle-hooks.md
- Component composition: Review snippet.md, render.md

### TypeScript Integration

- Type errors: Consult typescript.md
- Props typing: See props.md, typescript.md
- Store typing: Review stores.md, typescript.md
- Event typing: Check bind.md, typescript.md

### Best Practices

- Component organization: See svelte-files.md, custom-elements.md
- State architecture: Review stores.md, context.md
- Performance patterns: Check key.md, custom-elements.md
- Code reuse: Consult snippet.md, custom-elements.md

### Migration Considerations

- Upgrading versions: See v5-migration-guide.md
- Breaking changes: Review faq.md, v5-migration-guide.md
- Legacy patterns: Check stores.md, typescript.md
- Compatibility: Consult custom-elements.md, typescript.md

## Usage Notes

This index is designed to help AI systems quickly locate relevant documentation for Svelte development questions. When seeking help:

1. Consider the category of your problem (state, styling, typescript, etc.)
2. Check the Problem-Solution Mapping for common issues
3. Refer to multiple related documents for complex problems
4. Review Best Practices for architectural decisions
5. Consult the FAQ for known issues and solutions

Remember that solutions often involve multiple concepts working together. The relationships between different features are as important as the features themselves.
