SvelteTemplate syntax

# {#if ...}

### On this page

- [{#if ...}](https://svelte.dev/docs/svelte/</docs/svelte/if>)

```
{#if expression}...{/if}
```

```
{#if expression}...{:else if expression}...{/if}
```

```
{#if expression}...{:else}...{/if}
```

Content that is conditionally rendered can be wrapped in an if block.

```
{#if answer === 42}
	<p>what was the question?</p>
{/if}
```

Additional conditions can be added with `{:else if expression}`, optionally ending in an `{:else}` clause.

```
{#if porridge.temperature > 100}
	<p>too hot!</p>
{:else if 80 > porridge.temperature}
	<p>too cold!</p>
{:else}
	<p>just right!</p>
{/if}
```

(Blocks don’t have to wrap elements, they can also wrap text within elements.)
[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/02-if.md>)
previous next
[Basic markup](https://svelte.dev/docs/svelte/</docs/svelte/basic-markup>) [{#each ...}](https://svelte.dev/docs/svelte/</docs/svelte/each>)
