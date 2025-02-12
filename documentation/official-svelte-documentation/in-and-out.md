SvelteTemplate syntax

# in: and out:

### On this page

- [in: and out:](https://svelte.dev/docs/svelte/</docs/svelte/in-and-out>)

The `in:` and `out:` directives are identical to `transition:`[](https://svelte.dev/docs/svelte/<transition>), except that the resulting transitions are not bidirectional — an `in` transition will continue to ‘play’ alongside the `out` transition, rather than reversing, if the block is outroed while the transition is in progress. If an out transition is aborted, transitions will restart from scratch.

```
<script>
 import { fade, fly } from 'svelte/transition';
 let visible = $state(false);
</script>
<label>
 <input type="checkbox" bind:checked={visible}>
 visible
</label>
{#if visible}
	<div in:fly={{ y: 200 }} out:fade>flies in, fades out</div>
{/if}
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/14-in-and-out.md>)
previous next
[transition:](https://svelte.dev/docs/svelte/</docs/svelte/transition>) [animate:](https://svelte.dev/docs/svelte/</docs/svelte/animate>)
