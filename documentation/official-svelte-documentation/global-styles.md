SvelteStyling

# Global styles

### On this page

- [Global styles](https://svelte.dev/docs/svelte/</docs/svelte/global-styles>)
- [:global(...)](<https://svelte.dev/docs/svelte/%3C#:global()%3E>)
- [:global](https://svelte.dev/docs/svelte/<#:global>)

## :global(...)[](<https://svelte.dev/docs/svelte/%3C#:global()%3E>)

To apply styles to a single selector globally, use the `:global(...)` modifier:

```
<style>
	:global(body) {
		/* applies to <body> */
		margin: 0;
	}
	div :global(strong) {
		/* applies to all <strong> elements, in any component,
		  that are inside <div> elements belonging
		  to this component */
		color: goldenrod;
	}
	p:global(.big.red) {
		/* applies to all <p> elements belonging to this component
		  with `class="big red"`, even if it is applied
		  programmatically (for example by a library) */
	}
</style>
```

If you want to make @keyframes that are accessible globally, you need to prepend your keyframe names with `-global-`.
The `-global-` part will be removed when compiled, and the keyframe will then be referenced using just `my-animation-name` elsewhere in your code.

```
<style>
	@keyframes -global-my-animation-name {
		/* code goes here */
	}
</style>
```

## :global[](https://svelte.dev/docs/svelte/<#:global>)

To apply styles to a group of selectors globally, create a `:global {...}` block:

```
<style>
	:global {
		/* applies to every <div> in your application */
		div { ... }
		/* applies to every <p> in your application */
		p { ... }
	}
	.a :global {
		/* applies to every `.b .c .d` element, in any component,
		  that is inside an `.a` element in this component */
		.b .c .d {...}
	}
</style>
```

> The second example above could also be written as an equivalent `.a :global .b .c .d` selector, where everything after the `:global` is unscoped, though the nested form is preferred.
> [ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/04-styling/02-global-styles.md>)
> previous next
> [Scoped styles](https://svelte.dev/docs/svelte/</docs/svelte/scoped-styles>) [Custom properties](https://svelte.dev/docs/svelte/</docs/svelte/custom-properties>)
