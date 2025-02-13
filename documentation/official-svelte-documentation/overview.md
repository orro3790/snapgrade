SvelteIntroduction

# Overview

### On this page

- [Overview](https://svelte.dev/docs/svelte/</docs/svelte/overview>)

Svelte is a framework for building user interfaces on the web. It uses a compiler to turn declarative components written in HTML, CSS and JavaScript...
App

```
<script>
	function greet() {
		alert('Welcome to Svelte!');
	}
</script>
<button onclick={greet}>click me</button>
<style>
	button {
		font-size: 2em;
	}
</style>
```

```
<script lang="ts">
	function greet() {
		alert('Welcome to Svelte!');
	}
</script>
<button onclick={greet}>click me</button>
<style>
	button {
		font-size: 2em;
	}
</style>
```

...into lean, tightly optimized JavaScript.
You can use it to build anything on the web, from standalone components to ambitious full stack apps (using Svelte’s companion application framework, [SvelteKit](https://svelte.dev/docs/svelte/<../kit>)) and everything in between.
These pages serve as reference documentation. If you’re new to Svelte, we recommend starting with the [interactive tutorial](https://svelte.dev/docs/svelte/</tutorial>) and coming back here when you have questions.
You can also try Svelte online in the [playground](https://svelte.dev/docs/svelte/</playground>) or, if you need a more fully-featured environment, on [StackBlitz](https://svelte.dev/docs/svelte/<https:/sveltekit.new>).
[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/01-introduction/01-overview.md>)
previous next
[Getting started](https://svelte.dev/docs/svelte/</docs/svelte/getting-started>)
