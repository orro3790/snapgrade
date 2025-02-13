SvelteTemplate syntax

# style:

### On this page

- [style:](https://svelte.dev/docs/svelte/</docs/svelte/style>)

The `style:` directive provides a shorthand for setting multiple styles on an element.

```
<!-- These are equivalent -->
<div style:color="red">...</div>
<div style="color: red;">...</div>
```

The value can contain arbitrary expressions:

```
<div style:color={myColor}>...</div>
```

The shorthand form is allowed:

```
<div style:color>...</div>
```

Multiple styles can be set on a single element:

```
<div style:color style:width="12rem" style:background-color={darkMode ? 'black' : 'white'}>...</div>
```

To mark a style as important, use the `|important` modifier:

```
<div style:color|important="red">...</div>
```

When `style:` directives are combined with `style` attributes, the directives will take precedence:

```
<div style="color: blue;" style:color="red">This will be red</div>
```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/17-style.md>)
previous next
[animate:](https://svelte.dev/docs/svelte/</docs/svelte/animate>) [class](https://svelte.dev/docs/svelte/</docs/svelte/class>)
