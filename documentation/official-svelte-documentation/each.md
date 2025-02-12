SvelteTemplate syntax

# {#each ...}

### On this page

- [{#each ...}](https://svelte.dev/docs/svelte/</docs/svelte/each>)
- [Keyed each blocks](https://svelte.dev/docs/svelte/<#Keyed-each-blocks>)
- [Each blocks without an item](https://svelte.dev/docs/svelte/<#Each-blocks-without-an-item>)
- [Else blocks](https://svelte.dev/docs/svelte/<#Else-blocks>)

```
{#each expression as name}...{/each}
```

```
{#each expression as name, index}...{/each}
```

Iterating over values can be done with an each block. The values in question can be arrays, array-like objects (i.e. anything with a `length` property), or iterables like `Map` and `Set` — in other words, anything that can be used with `Array.from`.

```
<h1>Shopping list</h1>
<ul>
	{#each items as item}
		<li>{item.name} x {item.qty}</li>
	{/each}
</ul>
```

An each block can also specify an _index_ , equivalent to the second argument in an `array.map(...)` callback:

```
{#each items as item, i}
	<li>{i + 1}: {item.name} x {item.qty}</li>
{/each}
```

## Keyed each blocks[](https://svelte.dev/docs/svelte/<#Keyed-each-blocks>)

```
{#each expression as name (key)}...{/each}
```

```
{#each expression as name, index (key)}...{/each}
```

If a _key_ expression is provided — which must uniquely identify each list item — Svelte will use it to diff the list when data changes, rather than adding or removing items at the end. The key can be any object, but strings and numbers are recommended since they allow identity to persist when the objects themselves change.

```
{#each items as item (item.id)}
	<li>{item.name} x {item.qty}</li>
{/each}
<!-- or with additional index value -->
{#each items as item, i (item.id)}
	<li>{i + 1}: {item.name} x {item.qty}</li>
{/each}
```

You can freely use destructuring and rest patterns in each blocks.

```
{#each items as { id, name, qty }, i (id)}
	<li>{i + 1}: {name} x {qty}</li>
{/each}
{#each objects as { id, ...rest }}
	<li><span>{id}</span><MyComponent {...rest} /></li>
{/each}
{#each items as [id, ...rest]}
	<li><span>{id}</span><MyComponent values={rest} /></li>
{/each}
```

## Each blocks without an item[](https://svelte.dev/docs/svelte/<#Each-blocks-without-an-item>)

```
{#each expression}...{/each}
```

```
{#each expression, index}...{/each}
```

In case you just want to render something `n` times, you can omit the `as` part ([demo](https://svelte.dev/docs/svelte/</playground/untitled#H4sIAAAAAAAAE3WR0W7CMAxFf8XKNAk0WsSeUEaRpn3Guoc0MbQiJFHiMlDVf18SOrZJ48259_jaVgZmxBEZZ28thgCNFV6xBdt1GgPj7wOji0t2EqI-wa_OleGEmpLWiID_6dIaQkMxhm1UdwKpRQhVzWSaVORJNdvWpqbhAYVsYQCNZk8thzWMC_DCHMZk3wPSThNQ088I3mghD9UwSwHwlLE5PMIzVFUFq3G7WUZ2OyUvU3JOuZU332wCXTRmtPy1NgzXZtUFp8WFw9536uWqpbIgPEaDsJBW90cTOHh0KGi2XsBq5-cT6-3nPauxXqHnsHJnCFZ3CvJVkyuCQ0mFF9TZyCQ162WGvteLKfG197Y3iv_pz_fmS68Hxt8iPBPj5HscP8YvCNX7uhYCAAA=>)):

```
<div class="chess-board">
	{#each { length: 8 }, rank}
		{#each { length: 8 }, file}
			<div class:black={(rank + file) % 2 === 1}></div>
		{/each}
	{/each}
</div>
```

## Else blocks[](https://svelte.dev/docs/svelte/<#Else-blocks>)

```
{#each expression as name}...{:else}...{/each}
```

An each block can also have an `{:else}` clause, which is rendered if the list is empty.

```
{#each todos as todo}
	<p>{todo.text}</p>
{:else}
	<p>No tasks today!</p>
{/each}
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/03-each.md>)
previous next
[{#if ...}](https://svelte.dev/docs/svelte/</docs/svelte/if>) [{#key ...}](https://svelte.dev/docs/svelte/</docs/svelte/key>)
