SvelteTemplate syntax

# {@debug ...}

### On this page

- [{@debug ...}](https://svelte.dev/docs/svelte/</docs/svelte/@debug>)

The `{@debug ...}` tag offers an alternative to `console.log(...)`. It logs the values of specific variables whenever they change, and pauses code execution if you have devtools open.

```
<script>
	let user = {
		firstname: 'Ada',
		lastname: 'Lovelace'
	};
</script>
{@debug user}
<h1>Hello {user.firstname}!</h1>
```

`{@debug ...}` accepts a comma-separated list of variable names (not arbitrary expressions).

```
<!-- Compiles -->
{@debug user}
{@debug user1, user2, user3}
<!-- WON'T compile -->
{@debug user.firstname}
{@debug myArray[0]}
{@debug !isReady}
{@debug typeof user === 'object'}
```

The `{@debug}` tag without any arguments will insert a `debugger` statement that gets triggered when _any_ state changes, as opposed to the specified variables.
[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/10-@debug.md>)
previous next
[{@const ...}](https://svelte.dev/docs/svelte/</docs/svelte/@const>) [bind:](https://svelte.dev/docs/svelte/</docs/svelte/bind>)
