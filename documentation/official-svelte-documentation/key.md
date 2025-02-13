SvelteTemplate syntax

# {#key ...}

### On this page

- [{#key ...}](https://svelte.dev/docs/svelte/</docs/svelte/key>)

```
{#key expression}...{/key}
```

Key blocks destroy and recreate their contents when the value of an expression changes. When used around components, this will cause them to be reinstantiated and reinitialised:

```
{#key value}
	<Component />
{/key}
```

It’s also useful if you want a transition to play whenever a value changes:

```
{#key value}
	<div transition:fade>{value}</div>
{/key}
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/04-key.md>)
previous next
[{#each ...}](https://svelte.dev/docs/svelte/</docs/svelte/each>) [{#await ...}](https://svelte.dev/docs/svelte/</docs/svelte/await>)
