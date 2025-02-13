SvelteMisc

# Custom elements

### On this page

- [Custom elements](https://svelte.dev/docs/svelte/</docs/svelte/custom-elements>)
- [Component lifecycle](https://svelte.dev/docs/svelte/<#Component-lifecycle>)
- [Component options](https://svelte.dev/docs/svelte/<#Component-options>)
- [Caveats and limitations](https://svelte.dev/docs/svelte/<#Caveats-and-limitations>)

Svelte components can also be compiled to custom elements (aka web components) using the `customElement: true` compiler option. You should specify a tag name for the component using the `<svelte:options>` [element](https://svelte.dev/docs/svelte/<svelte-options>).

```
<svelte:options customElement="my-element" />
<script>
	let { name = 'world' } = $props();
</script>
<h1>Hello {name}!</h1>
<slot />
```

You can leave out the tag name for any of your inner components which you don’t want to expose and use them like regular Svelte components. Consumers of the component can still name it afterwards if needed, using the static `element` property which contains the custom element constructor and which is available when the `customElement` compiler option is `true`.

````
import ```
type MyElement = SvelteComponent<Record<string, any>, any, any>
const MyElement: LegacyComponentType
````

`MyElement from './MyElement.svelte'; `var customElements: CustomElementRegistry`
Defines a new custom element, mapping the given name to the given constructor as an autonomous custom element.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/customElements>)
customElements.`CustomElementRegistry.define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions): void`[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/CustomElementRegistry/define>)
define('my-element',`const MyElement: LegacyComponentType`MyElement.element);`

```

Once a custom element has been defined, it can be used as a regular DOM element:
```

```
module document
var document: Document
```

`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/document>)
document.`Document.body: HTMLElement`
Specifies the beginning and end of the document body.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/body>)
body.`InnerHTML.innerHTML: string`[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Element/innerHTML>)
innerHTML =` <my-element> <p>This is some slotted content</p> </my-element> `;`

```

Any [props](https://svelte.dev/docs/svelte/<basic-markup#Component-props>) are exposed as properties of the DOM element (as well as being readable/writable as attributes, where possible).
```

const ```
module el
const el: Element | null

```
`el = `var document: Document`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/document>)
document.`ParentNode.querySelector<Element>(selectors: string): Element | null (+4 overloads)`
Returns the first element that is a descendant of node that matches selectors.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/querySelector>)
querySelector('my-element'); // get the current value of the 'name' prop `var console: Console`
The `console` module provides a simple debugging console that is similar to the JavaScript console mechanism provided by web browsers.
The module exports two specific components:
  * A `Console` class with methods such as `console.log()`, `console.error()` and `console.warn()` that can be used to write to any Node.js stream.
  * A global `console` instance configured to write to `process.stdout`[](https://svelte.dev/docs/svelte/<https:/nodejs.org/docs/latest-v20.x/api/process.html#processstdout>) and `process.stderr`[](https://svelte.dev/docs/svelte/<https:/nodejs.org/docs/latest-v20.x/api/process.html#processstderr>). The global `console` can be used without calling `require('console')`.


_**Warning**_ : The global console object’s methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. See the `note on process I/O`[](https://svelte.dev/docs/svelte/<https:/nodejs.org/docs/latest-v20.x/api/process.html#a-note-on-process-io>) for more information.
Example using the global `console`:
```

console.log('hello world');
// Prints: hello world, to stdout
console.log('hello %s', 'world');
// Prints: hello world, to stdout
console.error(new Error('Whoops, something bad happened'));
// Prints error message and stack trace to stderr:
// Error: Whoops, something bad happened
// at [eval]:5:15
// at Script.runInThisContext (node:vm:132:18)
// at Object.runInThisContext (node:vm:309:38)
// at node:internal/process/execution:77:19
// at [eval]-wrapper:6:22
// at evalScript (node:internal/process/execution:76:60)
// at node:internal/main/eval_string:23:3
const name = 'Will Robinson';
console.warn(`Danger ${name}! Danger!`);
// Prints: Danger Will Robinson! Danger!, to stderr

```

Example using the `Console` class:
```

const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);
myConsole.log('hello world');
// Prints: hello world, to out
myConsole.log('hello %s', 'world');
// Prints: hello world, to out
myConsole.error(new Error('Whoops, something bad happened'));
// Prints: [Error: Whoops, something bad happened], to err
const name = 'Will Robinson';
myConsole.warn(`Danger ${name}! Danger!`);
// Prints: Danger Will Robinson! Danger!, to err

```

@see[source](https://svelte.dev/docs/svelte/<https:/github.com/nodejs/node/blob/v20.11.1/lib/console.js>)
console.`Console.log(message?: any, ...optionalParams: any[]): void (+1 overload)`
Prints to `stdout` with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to `printf(3)`[](https://svelte.dev/docs/svelte/<http:/man7.org/linux/man-pages/man3/printf.3.html>) (the arguments are all passed to `util.format()`[](https://svelte.dev/docs/svelte/<https:/nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args>)).
```

const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout

`````

See `util.format()`[](https://svelte.dev/docs/svelte/<https:/nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args>) for more information.
@sincev0.1.100
log(````
module el
const el: Element | null
`````

`el.name); // set a new value, updating the shadow DOM ````
module el
const el: Element | null

```
`el.name = 'everybody';`
```

Note that you need to list out all properties explicitly, i.e. doing `let props = $props()` without declaring `props` in the [component options](https://svelte.dev/docs/svelte/<#Component-options>) means that Svelte can’t know which props to expose as properties on the DOM element.

## Component lifecycle[](https://svelte.dev/docs/svelte/<#Component-lifecycle>)

Custom elements are created from Svelte components using a wrapper approach. This means the inner Svelte component has no knowledge that it is a custom element. The custom element wrapper takes care of handling its lifecycle appropriately.
When a custom element is created, the Svelte component it wraps is _not_ created right away. It is only created in the next tick after the `connectedCallback` is invoked. Properties assigned to the custom element before it is inserted into the DOM are temporarily saved and then set on component creation, so their values are not lost. The same does not work for invoking exported functions on the custom element though, they are only available after the element has mounted. If you need to invoke functions before component creation, you can work around it by using the `extend`[ option](https://svelte.dev/docs/svelte/<#Component-options>).
When a custom element written with Svelte is created or updated, the shadow DOM will reflect the value in the next tick, not immediately. This way updates can be batched, and DOM moves which temporarily (but synchronously) detach the element from the DOM don’t lead to unmounting the inner component.
The inner Svelte component is destroyed in the next tick after the `disconnectedCallback` is invoked.

## Component options[](https://svelte.dev/docs/svelte/<#Component-options>)

When constructing a custom element, you can tailor several aspects by defining `customElement` as an object within `<svelte:options>` since Svelte 4. This object may contain the following properties:

- `tag: string`: an optional `tag` property for the custom element’s name. If set, a custom element with this tag name will be defined with the document’s `customElements` registry upon importing this component.
- `shadow`: an optional property that can be set to `"none"` to forgo shadow root creation. Note that styles are then no longer encapsulated, and you can’t use slots
- `props`: an optional property to modify certain details and behaviors of your component’s properties. It offers the following settings:
  - `attribute: string`: To update a custom element’s prop, you have two alternatives: either set the property on the custom element’s reference as illustrated above or use an HTML attribute. For the latter, the default attribute name is the lowercase property name. Modify this by assigning `attribute: "<desired name>"`.
  - `reflect: boolean`: By default, updated prop values do not reflect back to the DOM. To enable this behavior, set `reflect: true`.
  - `type: 'String' | 'Boolean' | 'Number' | 'Array' | 'Object'`: While converting an attribute value to a prop value and reflecting it back, the prop value is assumed to be a `String` by default. This may not always be accurate. For instance, for a number type, define it using `type: "Number"` You don’t need to list all properties, those not listed will use the default settings.
- `extend`: an optional property which expects a function as its argument. It is passed the custom element class generated by Svelte and expects you to return a custom element class. This comes in handy if you have very specific requirements to the life cycle of the custom element or want to enhance the class to for example use [ElementInternals](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/en-US/docs/Web/API/ElementInternals#examples>) for better HTML form integration.

```
<svelte:options
	customElement={{
		tag: 'custom-element',
		shadow: 'none',
		props: {
			name: { reflect: true, type: 'Number', attribute: 'element-index' }
		},
		extend: (customElementConstructor) => {
			// Extend the class so we can let it participate in HTML forms
			return class extends customElementConstructor {
				static formAssociated = true;
				constructor() {
					super();
					this.attachedInternals = this.attachInternals();
				}
				// Add the function here, not below in the component so that
				// it's always available, not just when the inner Svelte component
				// is mounted
				randomIndex() {
					this.elementIndex = Math.random();
				}
			};
		}
	}}
/>
<script>
	let { elementIndex, attachedInternals } = $props();
	// ...
	function check() {
		attachedInternals.checkValidity();
	}
</script>
...
```

## Caveats and limitations[](https://svelte.dev/docs/svelte/<#Caveats-and-limitations>)

Custom elements can be a useful way to package components for consumption in a non-Svelte app, as they will work with vanilla HTML and JavaScript as well as [most frameworks](https://svelte.dev/docs/svelte/<https:/custom-elements-everywhere.com/>). There are, however, some important differences to be aware of:

- Styles are _encapsulated_ , rather than merely _scoped_ (unless you set `shadow: "none"`). This means that any non-component styles (such as you might have in a `global.css` file) will not apply to the custom element, including styles with the `:global(...)` modifier
- Instead of being extracted out as a separate .css file, styles are inlined into the component as a JavaScript string
- Custom elements are not generally suitable for server-side rendering, as the shadow DOM is invisible until JavaScript loads
- In Svelte, slotted content renders _lazily_. In the DOM, it renders _eagerly_. In other words, it will always be created even if the component’s `<slot>` element is inside an `{#if ...}` block. Similarly, including a `<slot>` in an `{#each ...}` block will not cause the slotted content to be rendered multiple times
- The deprecated `let:` directive has no effect, because custom elements do not have a way to pass data to the parent component that fills the slot
- Polyfills are required to support older browsers
- You can use Svelte’s context feature between regular Svelte components within a custom element, but you can’t use them across custom elements. In other words, you can’t use `setContext` on a parent custom element and read that with `getContext` in a child custom element.
- Don’t declare properties or attributes starting with `on`, as their usage will be interpreted as an event listener. In other words, Svelte treats `<custom-element oneworld={true}></custom-element>` as `customElement.addEventListener('eworld', true)` (and not as `customElement.oneworld = true`)

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/07-misc/04-custom-elements.md>)
previous next
[TypeScript](https://svelte.dev/docs/svelte/</docs/svelte/typescript>) [Svelte 4 migration guide](https://svelte.dev/docs/svelte/</docs/svelte/v4-migration-guide>)
