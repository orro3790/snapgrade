SvelteTemplate syntax

# {@html ...}

### On this page

- [{@html ...}](https://svelte.dev/docs/svelte/</docs/svelte/@html>)
- [Styling](https://svelte.dev/docs/svelte/<#Styling>)

To inject raw HTML into your component, use the `{@html ...}` tag:

```
<article>
	{@html content}
</article>
```

> Make sure that you either escape the passed string or only populate it with values that are under your control in order to prevent [XSS attacks](https://svelte.dev/docs/svelte/<https:/owasp.org/www-community/attacks/xss/>). Never render unsanitized content.
> The expression should be valid standalone HTML — this will not work, because `</div>` is not valid HTML:

```
{@html '<div>'}content{@html '</div>'}
```

It also will not compile Svelte code.

## Styling[](https://svelte.dev/docs/svelte/<#Styling>)

Content rendered this way is ‘invisible’ to Svelte and as such will not receive [scoped styles](https://svelte.dev/docs/svelte/<scoped-styles>) — in other words, this will not work, and the `a` and `img` styles will be regarded as unused:

```
<article>
	{@html content}
</article>
<style>
	article {
		a { color: hotpink }
		img { width: 100% }
	}
</style>
```

Instead, use the `:global` modifier to target everything inside the `<article>`:

```
<style>
	article :global {
		a { color: hotpink }
		img { width: 100% }
	}
</style>
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/08-@html.md>)
previous next
[{@render ...}](https://svelte.dev/docs/svelte/</docs/svelte/@render>) [{@const ...}](https://svelte.dev/docs/svelte/</docs/svelte/@const>)
