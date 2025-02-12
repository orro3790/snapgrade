SvelteRuntime

# Context

### On this page

- [Context](https://svelte.dev/docs/svelte/</docs/svelte/context>)
- [Setting and getting context](https://svelte.dev/docs/svelte/<#Setting-and-getting-context>)
- [Encapsulating context interactions](https://svelte.dev/docs/svelte/<#Encapsulating-context-interactions>)

Most state is component-level state that lives as long as its component lives. There’s also section-wide or app-wide state however, which also needs to be handled somehow.
The easiest way to do that is to create global state and just import that.
state.svelte

````
export const ```
const myGlobalState: {
  user: {};
}
````

`myGlobalState = ````
function $state<{
user: {};
}>(initial: {
user: {};
}): {
user: {};
} (+1 overload)
namespace $state

```
`
Declares reactive state.
Example:
```

let count = $state(0);

```

<https://svelte.dev/docs/svelte/$state>
@paraminitial The initial value
$state({ `user: {}`user: { /* ... */ } /* ... */ });`
```

App

```
<script>
	import { myGlobalState } from './state.svelte.js';
	// ...
</script>
```

```
<script lang="ts">
	import { myGlobalState } from './state.svelte.js';
	// ...
</script>
```

This has a few drawbacks though:

- it only safely works when your global state is only used client-side - for example, when you’re building a single page application that does not render any of your components on the server. If your state ends up being managed and updated on the server, it could end up being shared between sessions and/or users, causing bugs
- it may give the false impression that certain state is global when in reality it should only used in a certain part of your app

To solve these drawbacks, Svelte provides a few `context` primitives which alleviate these problems.

## Setting and getting context[](https://svelte.dev/docs/svelte/<#Setting-and-getting-context>)

To associate an arbitrary object with the current component, use `setContext`.

```
<script>
	import { setContext } from 'svelte';
	setContext('key', value);
</script>
```

The context is then available to children of the component (including slotted content) with `getContext`.

```
<script>
	import { getContext } from 'svelte';
	const value = getContext('key');
</script>
```

`setContext` and `getContext` solve the above problems:

- the state is not global, it’s scoped to the component. That way it’s safe to render your components on the server and not leak state
- it’s clear that the state is not global but rather scoped to a specific component tree and therefore can’t be used in other parts of your app

> `setContext` / `getContext` must be called during component initialisation.
> Context is not inherently reactive. If you need reactive values in context then you can pass a `$state` object into context, whose properties _will_ be reactive.
> Parent

```
<script>
	import { setContext } from 'svelte';
	let value = $state({ count: 0 });
	setContext('counter', value);
</script>
<button onclick={() => value.count++}>increment</button>
```

```
<script lang="ts">
	import { setContext } from 'svelte';
	let value = $state({ count: 0 });
	setContext('counter', value);
</script>
<button onclick={() => value.count++}>increment</button>
```

Child

```
<script>
	import { getContext } from 'svelte';
	const value = getContext('counter');
</script>
<p>Count is {value.count}</p>
```

```
<script lang="ts">
	import { getContext } from 'svelte';
	const value = getContext('counter');
</script>
<p>Count is {value.count}</p>
```

To check whether a given `key` has been set in the context of a parent component, use `hasContext`.

```
<script>
	import { hasContext } from 'svelte';
	if (hasContext('key')) {
		// do something
	}
</script>
```

You can also retrieve the whole context map that belongs to the closest parent component using `getAllContexts`. This is useful, for example, if you programmatically create a component and want to pass the existing context to it.

```
<script>
	import { getAllContexts } from 'svelte';
	const contexts = getAllContexts();
</script>
```

## Encapsulating context interactions[](https://svelte.dev/docs/svelte/<#Encapsulating-context-interactions>)

The above methods are very unopinionated about how to use them. When your app grows in scale, it’s worthwhile to encapsulate setting and getting the context into functions and properly type them.

````
import { function getContext<T>(key: any): T
Retrieves the context that belongs to the closest parent component with the specified key.
Must be called during component initialisation.


getContext, function setContext<T>(key: any, context: T): T
Associates an arbitrary context object with the current component and the specified key
and returns that object. The context is then available to children of the component
(including slotted content) with getContext.


Like lifecycle functions, this must be called during component initialisation.


setContext } from 'svelte';
let let userKey: symboluserKey = ```
var Symbol: SymbolConstructor
(description?: string | number) => symbol
````

`Returns a new unique Symbol value.
@paramdescription Description of the new Symbol object.
Symbol('user'); export function`function setUserContext(user: User): void`setUserContext(`user: User`user: `type User = /_unresolved_/ any`User) { `setContext<User>(key: any, context: User): User`Associates an arbitrary`context`object with the current component and the specified`key`and returns that object. The context is then available to children of the component (including slotted content) with`getContext`.
Like lifecycle functions, this must be called during component initialisation.
setContext(`let userKey: symbol`userKey, `user: User`user); } export function `function getUserContext(): User`getUserContext(): `type User = /_unresolved_/ any`User { return `getContext<User>(key: any): User`Retrieves the context that belongs to the closest parent component with the specified`key`. Must be called during component initialisation.
getContext(`let userKey: symbol`userKey) as `type User = /_unresolved_/ any`User; }`

```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/06-runtime/02-context.md>)
previous next
[Stores](https://svelte.dev/docs/svelte/</docs/svelte/stores>) [Lifecycle hooks](https://svelte.dev/docs/svelte/</docs/svelte/lifecycle-hooks>)
```
