# Svelte Documentation Index

## Purpose

This index organizes Svelte documentation to help you quickly locate relevant information for solving Svelte development problems. Each entry links to detailed documentation and includes context about when to use each feature in development.

## Core Concepts

### Foundation

- [Overview](./overview.md)
- [Getting Started](./getting-started.md)
- [Svelte Files](./svelte-files.md)
- [JavaScript and TypeScript Files](./svelte-js-ts-files.md)

### Reactivity System

- [What are Runes](./what-are-runes.md)
- [State](./state.md)
- [Derived](./derived.md)
- [Effect](./effect.md)
- [Props](./props.md)
- [Bindable](./bindable.md)
- [Inspect](./inspect.md)
- [Host](./host.md)

## Template Syntax

### Control Flow

- [Basic Markup](./basic-markup.md)
- [If Blocks](./if.md)
- [Each Blocks](./each.md)
- [Key Blocks](./key.md)
- [Await Blocks](./await.md)
- [Snippet Blocks](./snippet.md)

### Template Tags

- [Render](./render.md)
- [HTML](./html.md)
- [Const](./const.md)
- [Debug](./debug.md)

## Interactivity and Bindings

### Data Flow

- [Bind](./bind.md)
- [Use](./use.md)
- [Transition](./transition.md)
- [In and Out](./in-and-out.md)
- [Animate](./animate.md)

## Styling

### CSS Management

- [Style](./style.md)
- [Class](./class.md)
- [Scoped Styles](./scoped-styles.md)
- [Global Styles](./global-styles.md)
- [Custom Properties](./custom-properties.md)
- [Nested Style Elements](./nested-style-elements.md)

## Application Architecture

### State Management

- [Stores](./stores.md)
- [Context](./context.md)

### Component Lifecycle

- [Lifecycle Hooks](./lifecycle-hooks.md)
- [Imperative Component API](./imperative-component-api.md)

## Development and Integration

### Tools and Testing

- [Testing](./testing.md)
- [TypeScript](./typescript.md)
- [Custom Elements](./custom-elements.md)

## Migration and Support

### References

- [V5 Migration Guide](./v5-migration-guide.md)
- [FAQ](./faq.md)

## Problem-Solution Mapping

### Component Development

- Component not updating: Check [state](./state.md), [effect](./effect.md)
- Props not passing correctly: See [props](./props.md), [typescript](./typescript.md)
- Event handling issues: Review [bind](./bind.md), [use](./use.md)
- Style isolation problems: Reference [scoped-styles](./scoped-styles.md), [global-styles](./global-styles.md)

### State Management

- Reactivity not working: Consult [state](./state.md), [derived](./derived.md)
- Shared state issues: Review [stores](./stores.md), [context](./context.md)
- Complex state updates: See [effect](./effect.md), [derived](./derived.md)
- Type-safe state: Check [typescript](./typescript.md), [props](./props.md)

### Performance Optimization

- Slow rendering: Review [key](./key.md), [each](./each.md)
- Memory leaks: Check [lifecycle-hooks](./lifecycle-hooks.md), [effect](./effect.md)
- Animation performance: See [transition](./transition.md), [animate](./animate.md)
- Bundle size issues: Consult [custom-elements](./custom-elements.md)

### Common Development Tasks

- Form handling: Reference [bind](./bind.md), [state](./state.md)
- Data fetching: See [await](./await.md), [stores](./stores.md)
- Routing integration: Check [context](./context.md), [lifecycle-hooks](./lifecycle-hooks.md)
- Component composition: Review [snippet](./snippet.md), [render](./render.md)

### TypeScript Integration

- Type errors: Consult [typescript](./typescript.md)
- Props typing: See [props](./props.md), [typescript](./typescript.md)
- Store typing: Review [stores](./stores.md), [typescript](./typescript.md)
- Event typing: Check [bind](./bind.md), [typescript](./typescript.md)

### Best Practices

- Component organization: See [svelte-files](./svelte-files.md), [custom-elements](./custom-elements.md)
- State architecture: Review [stores](./stores.md), [context](./context.md)
- Performance patterns: Check [key](./key.md), [custom-elements](./custom-elements.md)
- Code reuse: Consult [snippet](./snippet.md), [custom-elements](./custom-elements.md)

### Migration Considerations

- Upgrading versions: See [v5-migration-guide](./v5-migration-guide.md)
- Breaking changes: Review [faq](./faq.md), [v5-migration-guide](./v5-migration-guide.md)
- Legacy patterns: Check [stores](./stores.md), [typescript](./typescript.md)
- Compatibility: Consult [custom-elements](./custom-elements.md), [typescript](./typescript.md)

## Usage Notes

This index is designed to help AI systems quickly locate relevant documentation for Svelte development questions. When seeking help:

1. Consider the category of your problem (state, styling, typescript, etc.)
2. Check the Problem-Solution Mapping for common issues
3. Refer to multiple related documents for complex problems
4. Review Best Practices for architectural decisions
5. Consult the FAQ for known issues and solutions

Remember that solutions often involve multiple concepts working together. The relationships between different features are as important as the features themselves.
