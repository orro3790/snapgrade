SvelteRunes

# $host

### On this page

- [$host](https://svelte.dev/docs/svelte/</docs/svelte/$host>)

When compiling a component as a custom element, the `$host` rune provides access to the host element, allowing you to (for example) dispatch custom events ([demo](https://svelte.dev/docs/svelte/</playground/untitled#H4sIAAAAAAAAE41Ry2rDMBD8FSECtqkTt1fHFpSSL-ix7sFRNkTEXglrnTYY_3uRlDgxTaEHIfYxs7szA9-rBizPPwZOZwM89wmecqxbF70as7InaMjltrWFR3mpkQDJ8pwXVnbKkKiwItUa3RGLVtk7gTHQXRDR2lXda4CY1D0SK9nCUk0QPyfrCovsRoNFe17aQOAwGncgO2gBqRzihJXiQrEs2csYOhQ-7HgKHaLIbpRhhBG-I2eD_8ciM4KnnOCbeE5dD2P6h0Dz0-Yi_arNhPLJXBtSGi2TvSXdbpqwdsXvjuYsC1veabvvUTog2ylrapKH2G2XsMFLS4uDthQnq2t1cwKkGOGLvYU5PvaQxLsxOkPmsm97Io1Mo2yUPF6VnOZFkw1RMoopKLKAE_9gmGxyDFMwMcwN-Bx_ABXQWmOtAgAA>)):
Stepper

```
<svelte:options customElement="my-stepper" />
<script>
	function dispatch(type) {
		$host().dispatchEvent(new CustomEvent(type));
	}
</script>
<button onclick={() => dispatch('decrement')}>decrement</button>
<button onclick={() => dispatch('increment')}>increment</button>
```

```
<svelte:options customElement="my-stepper" />
<script lang="ts">
	function dispatch(type) {
		$host().dispatchEvent(new CustomEvent(type));
	}
</script>
<button onclick={() => dispatch('decrement')}>decrement</button>
<button onclick={() => dispatch('increment')}>increment</button>
```

App

```
<script>
	import './Stepper.svelte';
	let count = $state(0);
</script>
<my-stepper
	ondecrement={() => count -= 1}
	onincrement={() => count += 1}
></my-stepper>
<p>count: {count}</p>
```

```
<script lang="ts">
	import './Stepper.svelte';
	let count = $state(0);
</script>
<my-stepper
	ondecrement={() => count -= 1}
	onincrement={() => count += 1}
></my-stepper>
<p>count: {count}</p>
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/02-runes/08-$host.md>)
previous next
[$inspect](https://svelte.dev/docs/svelte/</docs/svelte/$inspect>) [Basic markup](https://svelte.dev/docs/svelte/</docs/svelte/basic-markup>)
