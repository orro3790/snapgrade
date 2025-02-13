SvelteStyling

# Nested <style> elements

### On this page

- [Nested <style> elements](https://svelte.dev/docs/svelte/</docs/svelte/nested-style-elements>)

There can only be one top-level `<style>` tag per component.
However, it is possible to have a `<style>` tag nested inside other elements or logic blocks.
In that case, the `<style>` tag will be inserted as-is into the DOM; no scoping or processing will be done on the `<style>` tag.

```
<div>
	<style>
		/* this style tag will be inserted as-is */
		div {
			/* this will apply to all `<div>` elements in the DOM */
			color: red;
		}
	</style>
</div>
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/04-styling/04-nested-style-elements.md>)
previous next
[Custom properties](https://svelte.dev/docs/svelte/</docs/svelte/custom-properties>) [<svelte:boundary>](https://svelte.dev/docs/svelte/</docs/svelte/svelte-boundary>)
