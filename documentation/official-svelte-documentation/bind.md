SvelteTemplate syntax

# bind:

### On this page

- [bind:](https://svelte.dev/docs/svelte/</docs/svelte/bind>)
- [Function bindings](https://svelte.dev/docs/svelte/<#Function-bindings>)
- [<input bind:value>](https://svelte.dev/docs/svelte/<#input-bind:value>)
- [<input bind:checked>](https://svelte.dev/docs/svelte/<#input-bind:checked>)
- [<input bind:group>](https://svelte.dev/docs/svelte/<#input-bind:group>)
- [<input bind:files>](https://svelte.dev/docs/svelte/<#input-bind:files>)
- [<select bind:value>](https://svelte.dev/docs/svelte/<#select-bind:value>)
- [<audio>](https://svelte.dev/docs/svelte/<#audio>)
- [<video>](https://svelte.dev/docs/svelte/<#video>)
- [<img>](https://svelte.dev/docs/svelte/<#img>)
- [<details bind:open>](https://svelte.dev/docs/svelte/<#details-bind:open>)
- [Contenteditable bindings](https://svelte.dev/docs/svelte/<#Contenteditable-bindings>)
- [Dimensions](https://svelte.dev/docs/svelte/<#Dimensions>)
- [bind:this](https://svelte.dev/docs/svelte/<#bind:this>)
- [bind:_property_ for components](https://svelte.dev/docs/svelte/<#bind:property-for-components>)

Data ordinarily flows down, from parent to child. The `bind:` directive allows data to flow the other way, from child to parent.
The general syntax is `bind:property={expression}`, where `expression` is an _lvalue_ (i.e. a variable or an object property). When the expression is an identifier with the same name as the property, we can omit the expression — in other words these are equivalent:

```
<input bind:value={value} />
<input bind:value />
```

Svelte creates an event listener that updates the bound value. If an element already has a listener for the same event, that listener will be fired before the bound value is updated.
Most bindings are _two-way_ , meaning that changes to the value will affect the element and vice versa. A few bindings are _readonly_ , meaning that changing their value will have no effect on the element.

## Function bindings[](https://svelte.dev/docs/svelte/<#Function-bindings>)

You can also use `bind:property={get, set}`, where `get` and `set` are functions, allowing you to perform validation and transformation:

```
<input bind:value={
	() => value,
	(v) => value = v.toLowerCase()}
/>
```

In the case of readonly bindings like [dimension bindings](https://svelte.dev/docs/svelte/<#Dimensions>), the `get` value should be `null`:

```
<div
	bind:clientWidth={null, redraw}
	bind:clientHeight={null, redraw}
>...</div>
```

> Function bindings are available in Svelte 5.9.0 and newer.

## <input bind:value>[](https://svelte.dev/docs/svelte/<#input-bind:value>)

A `bind:value` directive on an `<input>` element binds the input’s `value` property:

```
<script>
	let message = $state('hello');
</script>
<input bind:value={message} />
<p>{message}</p>
```

In the case of a numeric input (`type="number"` or `type="range"`), the value will be coerced to a number ([demo](https://svelte.dev/docs/svelte/</playground/untitled#H4sIAAAAAAAAE6WPwYoCMQxAfyWEPeyiOOqx2w74Hds9pBql0IllmhGXYf5dKqwiyILsLXnwwsuI-5i4oPkaUX8yo7kCnKNQV7dNzoty4qSVBSr8jG-Poixa0KAt2z5mbb14TaxA4OCtKCm_rz4-f2m403WltrlrYhMFTtcLNkoeFGqZ8yhDF7j3CCHKzpwoDexGmqCL4jwuPUJHZ-dxVcfmyYGe5MAv-La5pbxYFf5Z9Zf_UJXb-sEMquFgJJhBmGyTW5yj8lnRaD_w9D1dAKSSj7zqAQAA>)):

```
<script>
	let a = $state(1);
	let b = $state(2);
</script>
<label>
	<input type="number" bind:value={a} min="0" max="10" />
	<input type="range" bind:value={a} min="0" max="10" />
</label>
<label>
	<input type="number" bind:value={b} min="0" max="10" />
	<input type="range" bind:value={b} min="0" max="10" />
</label>
<p>{a} + {b} = {a + b}</p>
```

If the input is empty or invalid (in the case of `type="number"`), the value is `undefined`.
Since 5.6.0, if an `<input>` has a `defaultValue` and is part of a form, it will revert to that value instead of the empty string when the form is reset. Note that for the initial render the value of the binding takes precedence unless it is `null` or `undefined`.

```
<script>
	let value = $state('');
</script>
<form>
	<input bind:value defaultValue="not the empty string">
	<input type="reset" value="Reset">
</form>
```

> Use reset buttons sparingly, and ensure that users won’t accidentally click them while trying to submit the form.

## <input bind:checked>[](https://svelte.dev/docs/svelte/<#input-bind:checked>)

Checkbox and radio inputs can be bound with `bind:checked`:

```
<label>
	<input type="checkbox" bind:checked={accepted} />
	Accept terms and conditions
</label>
```

Since 5.6.0, if an `<input>` has a `defaultChecked` attribute and is part of a form, it will revert to that value instead of `false` when the form is reset. Note that for the initial render the value of the binding takes precedence unless it is `null` or `undefined`.

```
<script>
	let checked = $state(true);
</script>
<form>
	<input type="checkbox" bind:checked defaultChecked={true}>
	<input type="reset" value="Reset">
</form>
```

## <input bind:group>[](https://svelte.dev/docs/svelte/<#input-bind:group>)

Inputs that work together can use `bind:group`.

```
<script>
	let tortilla = $state('Plain');
	/** @type {Array<string>} */
	let fillings = $state([]);
</script>
<!-- grouped radio inputs are mutually exclusive -->
<input type="radio" bind:group={tortilla} value="Plain" />
<input type="radio" bind:group={tortilla} value="Whole wheat" />
<input type="radio" bind:group={tortilla} value="Spinach" />
<!-- grouped checkbox inputs populate an array -->
<input type="checkbox" bind:group={fillings} value="Rice" />
<input type="checkbox" bind:group={fillings} value="Beans" />
<input type="checkbox" bind:group={fillings} value="Cheese" />
<input type="checkbox" bind:group={fillings} value="Guac (extra)" />
```

> `bind:group` only works if the inputs are in the same Svelte component.

## <input bind:files>[](https://svelte.dev/docs/svelte/<#input-bind:files>)

On `<input>` elements with `type="file"`, you can use `bind:files` to get the `FileList`[ of selected files](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/FileList>). When you want to update the files programmatically, you always need to use a `FileList` object. Currently `FileList` objects cannot be constructed directly, so you need to create a new `DataTransfer`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/DataTransfer>) object and get `files` from there.

```
<script>
	let files = $state();
	function clear() {
		files = new DataTransfer().files; // null or undefined does not work
	}
</script>
<label for="avatar">Upload a picture:</label>
<input accept="image/png, image/jpeg" bind:files id="avatar" name="avatar" type="file" />
<button onclick={clear}>clear</button>
```

`FileList` objects also cannot be modified, so if you want to e.g. delete a single file from the list, you need to create a new `DataTransfer` object and add the files you want to keep.

> `DataTransfer` may not be available in server-side JS runtimes. Leaving the state that is bound to `files` uninitialized prevents potential errors if components are server-side rendered.

## <select bind:value>[](https://svelte.dev/docs/svelte/<#select-bind:value>)

A `<select>` value binding corresponds to the `value` property on the selected `<option>`, which can be any value (not just strings, as is normally the case in the DOM).

```
<select bind:value={selected}>
	<option value={a}>a</option>
	<option value={b}>b</option>
	<option value={c}>c</option>
</select>
```

A `<select multiple>` element behaves similarly to a checkbox group. The bound variable is an array with an entry corresponding to the `value` property of each selected `<option>`.

```
<select multiple bind:value={fillings}>
	<option value="Rice">Rice</option>
	<option value="Beans">Beans</option>
	<option value="Cheese">Cheese</option>
	<option value="Guac (extra)">Guac (extra)</option>
</select>
```

When the value of an `<option>` matches its text content, the attribute can be omitted.

```
<select multiple bind:value={fillings}>
	<option>Rice</option>
	<option>Beans</option>
	<option>Cheese</option>
	<option>Guac (extra)</option>
</select>
```

You can give the `<select>` a default value by adding a `selected` attribute to the`<option>` (or options, in the case of `<select multiple>`) that should be initially selected. If the `<select>` is part of a form, it will revert to that selection when the form is reset. Note that for the initial render the value of the binding takes precedence if it’s not `undefined`.

```
<select bind:value={selected}>
	<option value={a}>a</option>
	<option value={b} selected>b</option>
	<option value={c}>c</option>
</select>
```

## <audio>[](https://svelte.dev/docs/svelte/<#audio>)

`<audio>` elements have their own set of bindings — five two-way ones...

- `currentTime`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime>)
- `playbackRate`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate>)
- `paused`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/paused>)
- `volume`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume>)
- `muted`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/muted>)

...and six readonly ones:

- `duration`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration>)
- `buffered`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered>)
- `seekable`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seekable>)
- `seeking`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeking_event>)
- `ended`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended>)
- `readyState`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState>)

```
<audio src={clip} bind:duration bind:currentTime bind:paused></audio>
```

## <video>[](https://svelte.dev/docs/svelte/<#video>)

`<video>` elements have all the same bindings as `<audio>`[](https://svelte.dev/docs/svelte/<#audio>) elements, plus readonly `videoWidth`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth>) and `videoHeight`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoHeight>) bindings.

## <img>[](https://svelte.dev/docs/svelte/<#img>)

`<img>` elements have two readonly bindings:

- `naturalWidth`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalWidth>)
- `naturalHeight`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalHeight>)

## <details bind:open>[](https://svelte.dev/docs/svelte/<#details-bind:open>)

`<details>` elements support binding to the `open` property.

```
<details bind:open={isOpen}>
	<summary>How do you comfort a JavaScript bug?</summary>
	<p>You console it.</p>
</details>
```

## Contenteditable bindings[](https://svelte.dev/docs/svelte/<#Contenteditable-bindings>)

Elements with the `contenteditable` attribute support the following bindings:

- `innerHTML`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML>)
- `innerText`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText>)
- `textContent`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/Node/textContent>)

> There are [subtle differences between `innerText` and `textContent`](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/Node/textContent#differences_from_innertext>).

```
<div contenteditable="true" bind:innerHTML={html} />
```

## Dimensions[](https://svelte.dev/docs/svelte/<#Dimensions>)

All visible elements have the following readonly bindings, measured with a `ResizeObserver`:

- `clientWidth`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth>)
- `clientHeight`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight>)
- `offsetWidth`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetWidth>)
- `offsetHeight`[](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight>)

```
<div bind:offsetWidth={width} bind:offsetHeight={height}>
	<Chart {width} {height} />
</div>
```

> `display: inline` elements do not have a width or height (except for elements with ‘intrinsic’ dimensions, like `<img>` and `<canvas>`), and cannot be observed with a `ResizeObserver`. You will need to change the `display` style of these elements to something else, such as `inline-block`.

## bind:this[](https://svelte.dev/docs/svelte/<#bind:this>)

```
bind:this={dom_node}
```

To get a reference to a DOM node, use `bind:this`. The value will be `undefined` until the component is mounted — in other words, you should read it inside an effect or an event handler, but not during component initialisation:

```
<script>
	/** @type {HTMLCanvasElement} */
	let canvas;
	$effect(() => {
		const ctx = canvas.getContext('2d');
		drawStuff(ctx);
	});
</script>
<canvas bind:this={canvas} />
```

Components also support `bind:this`, allowing you to interact with component instances programmatically.
App

```
<ShoppingCart bind:this={cart} />
<button onclick={() => cart.empty()}> Empty shopping cart </button>
```

ShoppingCart

```
<script>
	// All instance exports are available on the instance object
	export function empty() {
		// ...
	}
</script>
```

```
<script lang="ts">
	// All instance exports are available on the instance object
	export function empty() {
		// ...
	}
</script>
```

## bind:_property_ for components[](https://svelte.dev/docs/svelte/<#bind:property-for-components>)

```
bind:property={variable}
```

You can bind to component props using the same syntax as for elements.

```
<Keypad bind:value={pin} />
```

While Svelte props are reactive without binding, that reactivity only flows downward into the component by default. Using `bind:property` allows changes to the property from within the component to flow back up out of the component.
To mark a property as bindable, use the `$bindable`[](https://svelte.dev/docs/svelte/<$bindable>) rune:

```
<script>
	let { readonlyProperty, bindableProperty = $bindable() } = $props();
</script>
```

Declaring a property as bindable means it _can_ be used using `bind:`, not that it _must_ be used using `bind:`.
Bindable properties can have a fallback value:

```
<script>
	let { bindableProperty = $bindable('fallback value') } = $props();
</script>
```

This fallback value _only_ applies when the property is _not_ bound. When the property is bound and a fallback value is present, the parent is expected to provide a value other than `undefined`, else a runtime error is thrown. This prevents hard-to-reason-about situations where it’s unclear which value should apply.
[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/03-template-syntax/11-bind.md>)
previous next
[{@debug ...}](https://svelte.dev/docs/svelte/</docs/svelte/@debug>) [use:](https://svelte.dev/docs/svelte/</docs/svelte/use>)
