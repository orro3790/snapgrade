SvelteTemplate syntax

# {@const ...}

### On this page

- [{@const ...}](https://svelte.dev/docs/svelte/</docs/svelte/@const>)

The `{@const ...}` tag defines a local constant.

```
{#each boxes as box}
	{@const area = box.width * box.height}
	{box.width} * {box.height} = {area}
{/each}
```

`{@const}` is only allowed as an immediate child of a block — `{#if ...}`, `{#each ...}`, `{#snippet ...}` and so on — a `<Component />` or a `<svelte:boundary>`.
[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/09-@const.md>)
previous next
[{@html ...}](https://svelte.dev/docs/svelte/</docs/svelte/@html>) [{@debug ...}](https://svelte.dev/docs/svelte/</docs/svelte/@debug>)
