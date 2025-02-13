SvelteTemplate syntax

# animate:

### On this page

- [animate:](https://svelte.dev/docs/svelte/</docs/svelte/animate>)
- [Animation Parameters](https://svelte.dev/docs/svelte/<#Animation-Parameters>)
- [Custom animation functions](https://svelte.dev/docs/svelte/<#Custom-animation-functions>)

An animation is triggered when the contents of a [keyed each block](https://svelte.dev/docs/svelte/<each#Keyed-each-blocks>) are re-ordered. Animations do not run when an element is added or removed, only when the index of an existing data item within the each block changes. Animate directives must be on an element that is an _immediate_ child of a keyed each block.
Animations can be used with Svelte’s [built-in animation functions](https://svelte.dev/docs/svelte/<svelte-animate>) or [custom animation functions](https://svelte.dev/docs/svelte/<#Custom-animation-functions>).

```
<!-- When `list` is reordered the animation will run -->
{#each list as item, index (item)}
	<li animate:flip>{item}</li>
{/each}
```

## Animation Parameters[](https://svelte.dev/docs/svelte/<#Animation-Parameters>)

As with actions and transitions, animations can have parameters.
(The double `{{curlies}}` aren’t a special syntax; this is an object literal inside an expression tag.)

```
{#each list as item, index (item)}
	<li animate:flip={{ delay: 500 }}>{item}</li>
{/each}
```

## Custom animation functions[](https://svelte.dev/docs/svelte/<#Custom-animation-functions>)

```
animation = (node: HTMLElementnode: HTMLElement, { from: anyfrom: type DOMRect: anyDOMRect, to: anyto: type DOMRect: anyDOMRect } , params: anyparams: any) => {
	delay?: number,
	duration?: number,
	easing?: (t: numbert: number) => number,
	css?: (t: numbert: number, u: numberu: number) => string,
	tick?: (t: numbert: number, u: numberu: number) => void
}
```

Animations can use custom functions that provide the `node`, an `animation` object and any `parameters` as arguments. The `animation` parameter is an object containing `from` and `to` properties each containing a [DOMRect](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/DOMRect#Properties>) describing the geometry of the element in its `start` and `end` positions. The `from` property is the DOMRect of the element in its starting position, and the `to` property is the DOMRect of the element in its final position after the list has been reordered and the DOM updated.
If the returned object has a `css` method, Svelte will create a [web animation](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API>) that plays on the element.
The `t` argument passed to `css` is a value that goes from `0` and `1` after the `easing` function has been applied. The `u` argument is equal to `1 - t`.
The function is called repeatedly _before_ the animation begins, with different `t` and `u` arguments.
App

```
<script>
	import { cubicOut } from 'svelte/easing';
	/**
	 * @param {HTMLElement} node
	 * @param {{ from: DOMRect; to: DOMRect }} states
	 * @param {any} params
	 */
	function whizz(node, { from, to }, params) {
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const d = Math.sqrt(dx * dx + dy * dy);
		return {
			delay: 0,
			duration: Math.sqrt(d) * 120,
			easing: cubicOut,
			css: (t, u) => `transform: translate(${u * dx}px, ${u * dy}px) rotate(${t * 360}deg);`
		};
	}
</script>
{#each list as item, index (item)}
	<div animate:whizz>{item}</div>
{/each}
```

```
<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	function whizz(node: HTMLElement, { from, to }: { from: DOMRect; to: DOMRect }, params: any) {
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const d = Math.sqrt(dx * dx + dy * dy);
		return {
			delay: 0,
			duration: Math.sqrt(d) * 120,
			easing: cubicOut,
			css: (t, u) => `transform: translate(${u * dx}px, ${u * dy}px) rotate(${t * 360}deg);`
		};
	}
</script>
{#each list as item, index (item)}
	<div animate:whizz>{item}</div>
{/each}
```

A custom animation function can also return a `tick` function, which is called _during_ the animation with the same `t` and `u` arguments.

> If it’s possible to use `css` instead of `tick`, do so — web animations can run off the main thread, preventing jank on slower devices.
> App

```
<script>
	import { cubicOut } from 'svelte/easing';
	/**
	 * @param {HTMLElement} node
	 * @param {{ from: DOMRect; to: DOMRect }} states
	 * @param {any} params
	 */
	function whizz(node, { from, to }, params) {
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const d = Math.sqrt(dx * dx + dy * dy);
		return {
			delay: 0,
			duration: Math.sqrt(d) * 120,
			easing: cubicOut,
			tick: (t, u) => Object.assign(node.style, { color: t > 0.5 ? 'Pink' : 'Blue' })
		};
	}
</script>
{#each list as item, index (item)}
	<div animate:whizz>{item}</div>
{/each}
```

```
<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	function whizz(node: HTMLElement, { from, to }: { from: DOMRect; to: DOMRect }, params: any) {
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const d = Math.sqrt(dx * dx + dy * dy);
		return {
			delay: 0,
			duration: Math.sqrt(d) * 120,
			easing: cubicOut,
			tick: (t, u) => Object.assign(node.style, { color: t > 0.5 ? 'Pink' : 'Blue' })
		};
	}
</script>
{#each list as item, index (item)}
	<div animate:whizz>{item}</div>
{/each}
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/15-animate.md>)
previous next
[in: and out:](https://svelte.dev/docs/svelte/</docs/svelte/in-and-out>) [style:](https://svelte.dev/docs/svelte/</docs/svelte/style>)
