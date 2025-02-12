SvelteTemplate syntax

# {#await ...}

### On this page

- [{#await ...}](https://svelte.dev/docs/svelte/</docs/svelte/await>)

```
{#await expression}...{:then name}...{:catch name}...{/await}
```

```
{#await expression}...{:then name}...{/await}
```

```
{#await expression then name}...{/await}
```

```
{#await expression catch name}...{/await}
```

Await blocks allow you to branch on the three possible states of a `Promise`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise>) — pending, fulfilled or rejected.

```
{#await promise}
	<!-- promise is pending -->
	<p>waiting for the promise to resolve...</p>
{:then value}
	<!-- promise was fulfilled or not a Promise -->
	<p>The value is {value}</p>
{:catch error}
	<!-- promise was rejected -->
	<p>Something went wrong: {error.message}</p>
{/await}
```

> During server-side rendering, only the pending branch will be rendered.
> If the provided expression is not a `Promise`, only the `:then` branch will be rendered, including during server-side rendering.
> The `catch` block can be omitted if you don’t need to render anything when the promise rejects (or no error is possible).

```
{#await promise}
	<!-- promise is pending -->
	<p>waiting for the promise to resolve...</p>
{:then value}
	<!-- promise was fulfilled -->
	<p>The value is {value}</p>
{/await}
```

If you don’t care about the pending state, you can also omit the initial block.

```
{#await promise then value}
	<p>The value is {value}</p>
{/await}
```

Similarly, if you only want to show the error state, you can omit the `then` block.

```
{#await promise catch error}
	<p>The error is {error}</p>
{/await}
```

> You can use `#await` with `import(...)`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import>) to render components lazily:
>
> ```
> {#await import('./Component.svelte') then { default: Component }}
> ```

    <Component />

{/await}

```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/05-await.md>)
previous next
[{#key ...}](https://svelte.dev/docs/svelte/</docs/svelte/key>) [{#snippet ...}](https://svelte.dev/docs/svelte/</docs/svelte/snippet>)
```
