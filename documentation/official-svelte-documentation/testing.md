SvelteMisc

# Testing

### On this page

- [Testing](https://svelte.dev/docs/svelte/</docs/svelte/testing>)
- [Unit and integration testing using Vitest](https://svelte.dev/docs/svelte/<#Unit-and-integration-testing-using-Vitest>)
- [E2E tests using Playwright](https://svelte.dev/docs/svelte/<#E2E-tests-using-Playwright>)

Testing helps you write and maintain your code and guard against regressions. Testing frameworks help you with that, allowing you to describe assertions or expectations about how your code should behave. Svelte is unopinionated about which testing framework you use — you can write unit tests, integration tests, and end-to-end tests using solutions like [Vitest](https://svelte.dev/docs/svelte/<https:/vitest.dev/>), [Jasmine](https://svelte.dev/docs/svelte/<https:/jasmine.github.io/>), [Cypress](https://svelte.dev/docs/svelte/<https:/www.cypress.io/>) and [Playwright](https://svelte.dev/docs/svelte/<https:/playwright.dev/>).

## Unit and integration testing using Vitest[](https://svelte.dev/docs/svelte/<#Unit-and-integration-testing-using-Vitest>)

Unit tests allow you to test small isolated parts of your code. Integration tests allow you to test parts of your application to see if they work together. If you’re using Vite (including via SvelteKit), we recommend using [Vitest](https://svelte.dev/docs/svelte/<https:/vitest.dev/>).
To get started, install Vitest:

```
npm install -D vitest
```

Then adjust your `vite.config.js`:
vite.config

````
import { function defineConfig(config: UserConfig): UserConfig (+3 overloads)defineConfig } from 'vitest/config';
export default function defineConfig(config: UserConfig): UserConfig (+3 overloads)defineConfig({
	// ...
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	```
UserConfig.resolve?: (ResolveOptions & {
  alias?: AliasOptions;
}) | undefined
````

`Configure resolver
resolve:`var process: NodeJS.Process`process.`NodeJS.Process.env: NodeJS.ProcessEnv`The`process.env`property returns an object containing the user environment. See`environ(7)`[](https://svelte.dev/docs/svelte/<http:/man7.org/linux/man-pages/man7/environ.7.html>).
An example of this object looks like:

```
{
 TERM: 'xterm-256color',
 SHELL: '/usr/local/bin/bash',
 USER: 'maciej',
 PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
 PWD: '/Users/maciej',
 EDITOR: 'vim',
 SHLVL: '1',
 HOME: '/Users/maciej',
 LOGNAME: 'maciej',
 _: '/usr/local/bin/node'
}
```

It is possible to modify this object, but such modifications will not be reflected outside the Node.js process, or (unless explicitly requested) to other `Worker` threads. In other words, the following example would not work:

```
node -e 'process.env.foo = "bar"' &#x26;#x26;&#x26;#x26; echo $foo
```

While the following will:

```
import { env } from 'node:process';
env.foo = 'bar';
console.log(env.foo);
```

Assigning a property on `process.env` will implicitly convert the value to a string. **This behavior is deprecated.** Future versions of Node.js may throw an error when the value is not a string, number, or boolean.

```
import { env } from 'node:process';
env.test = null;
console.log(env.test);
// => 'null'
env.test = undefined;
console.log(env.test);
// => 'undefined'
```

Use `delete` to delete a property from `process.env`.

```
import { env } from 'node:process';
env.TEST = 1;
delete env.TEST;
console.log(env.TEST);
// => undefined
```

On Windows operating systems, environment variables are case-insensitive.

```
import { env } from 'node:process';
env.TEST = 1;
console.log(env.test);
// => 1
```

Unless explicitly specified when creating a `Worker` instance, each `Worker` thread has its own copy of `process.env`, based on its parent thread’s `process.env`, or whatever was specified as the `env` option to the `Worker` constructor. Changes to `process.env` will not be visible across `Worker` threads, and only the main thread can make changes that are visible to the operating system or to native add-ons. On Windows, a copy of `process.env` on a `Worker` instance operates in a case-sensitive manner unlike the main thread.
@sincev0.1.27
env.`string | undefined`VITEST ? { `ResolveOptions.conditions?: string[] | undefined`conditions: ['browser'] } : `var undefined`undefined });`

```

> If loading the browser version of all your packages is undesirable, because (for example) you also test backend libraries, [you may need to resort to an alias configuration](https://svelte.dev/docs/svelte/<https:/github.com/testing-library/svelte-testing-library/issues/222#issuecomment-1909993331>)
You can now write unit tests for code inside your `.js/.ts` files:
multiplier.svelte.test
```

import { function flushSync(fn?: (() => void) | undefined): void
Synchronously flushes any pending state changes and those that result from it.

flushSync } from 'svelte';
import { const expect: ExpectStaticexpect, const test: TestAPI
Defines a test case with a given name and test function. The test function can optionally be configured with test options.

@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@examplets // Define a simple test test('should add two numbers', () => { expect(add(1, 2)).toBe(3); });
@examplets // Define a test with options test('should subtract two numbers', { retry: 3 }, () => { expect(subtract(5, 2)).toBe(3); });
test } from 'vitest';
import { import multipliermultiplier } from './multiplier.svelte.js';
test<object>(name: string | Function, fn?: TestFunction<object> | undefined, options?: number | TestOptions): void (+2 overloads)
Defines a test case with a given name and test function. The test function can optionally be configured with test options.

@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@examplets // Define a simple test test('should add two numbers', () => { expect(add(1, 2)).toBe(3); });
@examplets // Define a test with options test('should subtract two numbers', { retry: 3 }, () => { expect(subtract(5, 2)).toBe(3); });
test('Multiplier', () => {
let let double: anydouble = import multipliermultiplier(0, 2);
expect<any>(actual: any, message?: string): Assertion<any> (+1 overload)expect(let double: anydouble.value).JestAssertion<any>.toEqual: <number>(expected: number) => void
Used when you want to check that two objects have the same value.
This matcher recursively checks the equality of all fields, rather than checking for object identity.

@exampleexpect(user).toEqual({ name: 'Alice', age: 30 });
toEqual(0);
let double: anydouble.set(5);
expect<any>(actual: any, message?: string): Assertion<any> (+1 overload)expect(let double: anydouble.value).JestAssertion<any>.toEqual: <number>(expected: number) => void
Used when you want to check that two objects have the same value.
This matcher recursively checks the equality of all fields, rather than checking for object identity.

@exampleexpect(user).toEqual({ name: 'Alice', age: 30 });
toEqual(10);
});

```

multiplier.svelte
```

/\*\*

- @param {number} initial
- @param {number} k
  \*/
  export function ```
  function multiplier(initial: number, k: number): {
  readonly value: number;
  set: (c: number) => void;
  }

`````
`
@paraminitial
@paramk
multiplier(`initial: number`
@paraminitial
initial, `k: number`
@paramk
k) { let `let count: number`count = ````
function $state<number>(initial: number): number (+1 overload)
namespace $state
`````

`
Declares reactive state.
Example:

```
let count = $state(0);
```

<https://svelte.dev/docs/svelte/$state>
@paraminitial The initial value
$state(`initial: number`
@paraminitial
initial); return { get `value: number`value() { return `let count: number`count _ `k: number`
@paramk
k; }, /\*\* @param {number} c _/ `set: (c: number) => void`
@paramc
set: (`c: number`
@paramc
c) => { `let count: number`count = `c: number`
@paramc
c; } }; }`

```

```

export function ```
function multiplier(initial: number, k: number): {
readonly value: number;
set: (c: number) => void;
}

`````
`multiplier(`initial: number`initial: number, `k: number`k: number) { let `let count: number`count = ````
function $state<number>(initial: number): number (+1 overload)
namespace $state
`````

`
Declares reactive state.
Example:

```
let count = $state(0);
```

<https://svelte.dev/docs/svelte/$state>
@paraminitial The initial value
$state(`initial: number`initial); return { get `value: number`value() { return `let count: number`count \* `k: number`k; }, `set: (c: number) => void`set: (`c: number`c: number) => { `let count: number`count = `c: number`c; } }; }`

```

### Using runes inside your test files[](https://svelte.dev/docs/svelte/<#Unit-and-integration-testing-using-Vitest-Using-runes-inside-your-test-files>)
Since Vitest processes your test files the same way as your source files, you can use runes inside your tests as long as the filename includes `.svelte`:
multiplier.svelte.test
```

import { function flushSync(fn?: (() => void) | undefined): void
Synchronously flushes any pending state changes and those that result from it.

flushSync } from 'svelte';
import { const expect: ExpectStaticexpect, const test: TestAPI
Defines a test case with a given name and test function. The test function can optionally be configured with test options.

@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@examplets // Define a simple test test('should add two numbers', () => { expect(add(1, 2)).toBe(3); });
@examplets // Define a test with options test('should subtract two numbers', { retry: 3 }, () => { expect(subtract(5, 2)).toBe(3); });
test } from 'vitest';
import { import multipliermultiplier } from './multiplier.svelte.js';
test<object>(name: string | Function, fn?: TestFunction<object> | undefined, options?: number | TestOptions): void (+2 overloads)
Defines a test case with a given name and test function. The test function can optionally be configured with test options.

@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@examplets // Define a simple test test('should add two numbers', () => { expect(add(1, 2)).toBe(3); });
@examplets // Define a test with options test('should subtract two numbers', { retry: 3 }, () => { expect(subtract(5, 2)).toBe(3); });
test('Multiplier', () => {
let let count: numbercount = ```
function $state<0>(initial: 0): 0 (+1 overload)
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
$state(0); let `let double: any`double = `import multiplier`multiplier(() => `let count: number`count, 2); `expect<any>(actual: any, message?: string): Assertion<any> (+1 overload)`expect(`let double: any`double.value).`JestAssertion<any>.toEqual: <number>(expected: number) => void`
Used when you want to check that two objects have the same value. This matcher recursively checks the equality of all fields, rather than checking for object identity.
@exampleexpect(user).toEqual({ name: 'Alice', age: 30 });
toEqual(0); `let count: number`count = 5; `expect<any>(actual: any, message?: string): Assertion<any> (+1 overload)`expect(`let double: any`double.value).`JestAssertion<any>.toEqual: <number>(expected: number) => void`
Used when you want to check that two objects have the same value. This matcher recursively checks the equality of all fields, rather than checking for object identity.
@exampleexpect(user).toEqual({ name: 'Alice', age: 30 });
toEqual(10); });`
```

multiplier.svelte

````
/**
 * @param {() => number} getCount
 * @param {number} k
 */
export function ```
function multiplier(getCount: () => number, k: number): {
  readonly value: number;
}
````

`
@paramgetCount
@paramk
multiplier(`getCount: () => number`@paramgetCount
getCount,`k: number`@paramk
k) { return { get`value: number`value() { return `getCount: () => number`@paramgetCount
getCount() *`k: number`
@paramk
k; } }; }`

```

```

export function ```
function multiplier(getCount: () => number, k: number): {
readonly value: number;
}

```
`multiplier(`getCount: () => number`getCount: () => number, `k: number`k: number) { return { get `value: number`value() { return `getCount: () => number`getCount() * `k: number`k; } }; }`
```

If the code being tested uses effects, you need to wrap the test inside `$effect.root`:
logger.svelte.test

````
import { function flushSync(fn?: (() => void) | undefined): void
Synchronously flushes any pending state changes and those that result from it.


flushSync } from 'svelte';
import { const expect: ExpectStaticexpect, const test: TestAPI
Defines a test case with a given name and test function. The test function can optionally be configured with test options.


@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@examplets // Define a simple test test('should add two numbers', () => {  expect(add(1, 2)).toBe(3); });
@examplets // Define a test with options test('should subtract two numbers', { retry: 3 }, () => {  expect(subtract(5, 2)).toBe(3); });
test } from 'vitest';
import { import loggerlogger } from './logger.svelte.js';
test<object>(name: string | Function, fn?: TestFunction<object> | undefined, options?: number | TestOptions): void (+2 overloads)
Defines a test case with a given name and test function. The test function can optionally be configured with test options.


@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@examplets // Define a simple test test('should add two numbers', () => {  expect(add(1, 2)).toBe(3); });
@examplets // Define a test with options test('should subtract two numbers', { retry: 3 }, () => {  expect(subtract(5, 2)).toBe(3); });
test('Effect', () => {
	const const cleanup: () => voidcleanup = ```
namespace $effect
function $effect(fn: () => void | (() => void)): void
````

`Runs code when a component is mounted to the DOM, and then whenever its dependencies change, i.e.`$state` or `$derived` values. The timing of the execution is after the DOM has been updated.
Example:

```
$effect(() => console.log('The count is now ' + count));
```

If you return a function from the effect, it will be called right before the effect is run again, or when the component is unmounted.
Does not run during server side rendering.
<https://svelte.dev/docs/svelte/$effect>
@paramfn The function to execute
$effect.`function $effect.root(fn: () => void | (() => void)): () => void`
The `$effect.root` rune is an advanced feature that creates a non-tracked scope that doesn’t auto-cleanup. This is useful for nested effects that you want to manually control. This rune also allows for creation of effects outside of the component initialisation phase.
Example:

```
&#x3C;script>
 let count = $state(0);
 const cleanup = $effect.root(() => {
	$effect(() => {
			console.log(count);
		})
	 return () => {
	  console.log('effect root cleanup');
			}
 });
&#x3C;/script>
&#x3C;button onclick={() => cleanup()}>cleanup&#x3C;/button>
```

<https://svelte.dev/docs/svelte/$effect#$effect.root>
root(() => { let `let count: number`count = ````
function $state<0>(initial: 0): 0 (+1 overload)
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
$state(0); // logger uses an $effect to log updates of its input let `let log: any`log = `import logger`logger(() => `let count: number`count); // effects normally run after a microtask, // use flushSync to execute all pending effects synchronously `function flushSync(fn?: (() => void) | undefined): void`
Synchronously flushes any pending state changes and those that result from it.
flushSync(); `expect<any>(actual: any, message?: string): Assertion<any> (+1 overload)`expect(`let log: any`log.value).`JestAssertion<any>.toEqual: <number[]>(expected: number[]) => void`
Used when you want to check that two objects have the same value. This matcher recursively checks the equality of all fields, rather than checking for object identity.
@exampleexpect(user).toEqual({ name: 'Alice', age: 30 });
toEqual([0]); `let count: number`count = 1; `function flushSync(fn?: (() => void) | undefined): void`
Synchronously flushes any pending state changes and those that result from it.
flushSync(); `expect<any>(actual: any, message?: string): Assertion<any> (+1 overload)`expect(`let log: any`log.value).`JestAssertion<any>.toEqual: <number[]>(expected: number[]) => void`
Used when you want to check that two objects have the same value. This matcher recursively checks the equality of all fields, rather than checking for object identity.
@exampleexpect(user).toEqual({ name: 'Alice', age: 30 });
toEqual([0, 1]); }); `const cleanup: () => void`cleanup(); });`
```

logger.svelte

````
/**
 * @param {() => any} getValue
 */
export function ```
function logger(getValue: () => any): {
  readonly value: any[];
}
````

`
@paramgetValue
logger(`getValue: () => any`@paramgetValue
getValue) { /** @type {any[]} */ let`let log: any[]`
@type{any[]}
log = ````
function $state<never[]>(initial: never[]): never[] (+1 overload)
namespace $state

```
`
Declares reactive state.
Example:
```

let count = $state(0);

`````

<https://svelte.dev/docs/svelte/$state>
@paraminitial The initial value
$state([]); ````
function $effect(fn: () => void | (() => void)): void
namespace $effect
`````

`Runs code when a component is mounted to the DOM, and then whenever its dependencies change, i.e.`$state` or `$derived` values. The timing of the execution is after the DOM has been updated.
Example:

```
$effect(() => console.log('The count is now ' + count));
```

If you return a function from the effect, it will be called right before the effect is run again, or when the component is unmounted.
Does not run during server side rendering.
<https://svelte.dev/docs/svelte/$effect>
@paramfn The function to execute
$effect(() => { `let log: any[]`
@type{any[]}
log.`Array<any>.push(...items: any[]): number`
Appends new elements to the end of an array, and returns the new length of the array.
@paramitems New elements to add to the array.
push(`getValue: () => any`
@paramgetValue
getValue()); }); return { get `value: any[]`value() { return `let log: any[]`
@type{any[]}
log; } }; }`

```

```

export function ```
function logger(getValue: () => any): {
readonly value: any[];
}

`````
`logger(`getValue: () => any`getValue: () => any) { let `let log: any[]`log: any[] = ````
function $state<never[]>(initial: never[]): never[] (+1 overload)
namespace $state
`````

`
Declares reactive state.
Example:

```
let count = $state(0);
```

<https://svelte.dev/docs/svelte/$state>
@paraminitial The initial value
$state([]); ````
function $effect(fn: () => void | (() => void)): void
namespace $effect

```
`
Runs code when a component is mounted to the DOM, and then whenever its dependencies change, i.e. `$state` or `$derived` values. The timing of the execution is after the DOM has been updated.
Example:
```

$effect(() => console.log('The count is now ' + count));

```

If you return a function from the effect, it will be called right before the effect is run again, or when the component is unmounted.
Does not run during server side rendering.
<https://svelte.dev/docs/svelte/$effect>
@paramfn The function to execute
$effect(() => { `let log: any[]`log.`Array<any>.push(...items: any[]): number`
Appends new elements to the end of an array, and returns the new length of the array.
@paramitems New elements to add to the array.
push(`getValue: () => any`getValue()); }); return { get `value: any[]`value() { return `let log: any[]`log; } }; }`
```

### Component testing[](https://svelte.dev/docs/svelte/<#Unit-and-integration-testing-using-Vitest-Component-testing>)

It is possible to test your components in isolation using Vitest.

> Before writing component tests, think about whether you actually need to test the component, or if it’s more about the logic _inside_ the component. If so, consider extracting out that logic to test it in isolation, without the overhead of a component
> To get started, install jsdom (a library that shims DOM APIs):

```
npm install -D jsdom
```

Then adjust your `vite.config.js`:
vite.config

````
import { function defineConfig(config: UserConfig): UserConfig (+3 overloads)defineConfig } from 'vitest/config';
export default function defineConfig(config: UserConfig): UserConfig (+3 overloads)defineConfig({
	UserConfig.plugins?: PluginOption[] | undefined
Array of vite plugins to use.


plugins: [
		/* ... */
	],
	UserConfig.test?: InlineConfig | undefined
Options for Vitest


test: {
		// If you are testing components client-side, you need to setup a DOM environment.
		// If not all your files should have this environment, you can use a
		// `// @vitest-environment jsdom` comment at the top of the test files instead.
		InlineConfig.environment?: VitestEnvironment | undefined
Running environment


Supports ‘node’, ‘jsdom’, ‘happy-dom’, ‘edge-runtime’


If used unsupported string, will try to load the package vitest-environment-${env}


@default'node'
environment: 'jsdom'
	},
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	```
UserConfig.resolve?: (ResolveOptions & {
  alias?: AliasOptions;
}) | undefined
````

`Configure resolver
resolve:`var process: NodeJS.Process`process.`NodeJS.Process.env: NodeJS.ProcessEnv`The`process.env`property returns an object containing the user environment. See`environ(7)`[](https://svelte.dev/docs/svelte/<http:/man7.org/linux/man-pages/man7/environ.7.html>).
An example of this object looks like:

```
{
 TERM: 'xterm-256color',
 SHELL: '/usr/local/bin/bash',
 USER: 'maciej',
 PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
 PWD: '/Users/maciej',
 EDITOR: 'vim',
 SHLVL: '1',
 HOME: '/Users/maciej',
 LOGNAME: 'maciej',
 _: '/usr/local/bin/node'
}
```

It is possible to modify this object, but such modifications will not be reflected outside the Node.js process, or (unless explicitly requested) to other `Worker` threads. In other words, the following example would not work:

```
node -e 'process.env.foo = "bar"' &#x26;#x26;&#x26;#x26; echo $foo
```

While the following will:

```
import { env } from 'node:process';
env.foo = 'bar';
console.log(env.foo);
```

Assigning a property on `process.env` will implicitly convert the value to a string. **This behavior is deprecated.** Future versions of Node.js may throw an error when the value is not a string, number, or boolean.

```
import { env } from 'node:process';
env.test = null;
console.log(env.test);
// => 'null'
env.test = undefined;
console.log(env.test);
// => 'undefined'
```

Use `delete` to delete a property from `process.env`.

```
import { env } from 'node:process';
env.TEST = 1;
delete env.TEST;
console.log(env.TEST);
// => undefined
```

On Windows operating systems, environment variables are case-insensitive.

```
import { env } from 'node:process';
env.TEST = 1;
console.log(env.test);
// => 1
```

Unless explicitly specified when creating a `Worker` instance, each `Worker` thread has its own copy of `process.env`, based on its parent thread’s `process.env`, or whatever was specified as the `env` option to the `Worker` constructor. Changes to `process.env` will not be visible across `Worker` threads, and only the main thread can make changes that are visible to the operating system or to native add-ons. On Windows, a copy of `process.env` on a `Worker` instance operates in a case-sensitive manner unlike the main thread.
@sincev0.1.27
env.`string | undefined`VITEST ? { `ResolveOptions.conditions?: string[] | undefined`conditions: ['browser'] } : `var undefined`undefined });`

```

After that, you can create a test file in which you import the component to test, interact with it programmatically and write expectations about the results:
component.test
```

import { function flushSync(fn?: (() => void) | undefined): void
Synchronously flushes any pending state changes and those that result from it.

flushSync, function mount<Props extends Record<string, any>, Exports extends Record<string, any>>(component: ComponentType<SvelteComponent<Props>> | Component<Props, Exports, any>, options: MountOptions<Props>): Exports
Mounts a component to the given target and returns the exports and potentially the props (if compiled with accessors: true) of the component.
Transitions will play during the initial render unless the intro option is set to false.

mount, ```
function unmount(component: Record<string, any>, options?: {
outro?: boolean;
} | undefined): Promise<void>

```
`
Unmounts a component that was previously mounted using `mount` or `hydrate`.
Since 5.13.0, if `options.outro` is `true`, [transitions](https://svelte.dev/docs/svelte/<https:/svelte.dev/docs/svelte/transition>) will play before the component is removed from the DOM.
Returns a `Promise` that resolves after transitions have completed if `options.outro` is true, or immediately otherwise (prior to 5.13.0, returns `void`).
```

import { mount, unmount } from 'svelte';
import App from './App.svelte';
const app = mount(App, { target: document.body });
// later...
unmount(app, { outro: true });

`````

unmount } from 'svelte'; import { `const expect: ExpectStatic`expect, `const test: TestAPI`
Defines a test case with a given name and test function. The test function can optionally be configured with test options.
@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@example`ts // Define a simple test test('should add two numbers', () => {  expect(add(1, 2)).toBe(3); }); `
@example`ts // Define a test with options test('should subtract two numbers', { retry: 3 }, () => {  expect(subtract(5, 2)).toBe(3); }); `
test } from 'vitest'; import ````
type Component = SvelteComponent<Record<string, any>, any, any>
const Component: LegacyComponentType
`````

`Component from './Component.svelte'; `test<object>(name: string | Function, fn?: TestFunction<object> | undefined, options?: number | TestOptions): void (+2 overloads)`
Defines a test case with a given name and test function. The test function can optionally be configured with test options.
@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@example`ts // Define a simple test test('should add two numbers', () => { expect(add(1, 2)).toBe(3); }); `
@example`ts // Define a test with options test('should subtract two numbers', { retry: 3 }, () => { expect(subtract(5, 2)).toBe(3); }); `test('Component', () => { // Instantiate the component using Svelte's`mount` API const ````
const component: {
$on?(type: string, callback: (e: any) => void): () => void;
$set?(props: Partial<Record<string, any>>): void;
} & Record<string, any>

`````
`component = ````
mount<Record<string, any>, {
  $on?(type: string, callback: (e: any) => void): () => void;
  $set?(props: Partial<Record<string, any>>): void;
} & Record<...>>(component: ComponentType<...> | Component<...>, options: MountOptions<...>): {
  ...;
} & Record<...>
`````

`Mounts a component to the given target and returns the exports and potentially the props (if compiled with`accessors: true`) of the component. Transitions will play during the initial render unless the `intro`option is set to`false`.
mount(`const Component: LegacyComponentType`Component, { `target: Document | Element | ShadowRoot`Target element where the component will be mounted.
target:`var document: Document`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/document>)
document.`Document.body: HTMLElement`Specifies the beginning and end of the document body.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/body>)
body, //`document`exists because of jsdom`props?: Record<string, any> | undefined`Component properties.
props: {`initial: number`initial: 0 } }); `expect<string>(actual: string, message?: string): Assertion<string> (+1 overload)`expect(`var document: Document`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/document>)
document.`Document.body: HTMLElement`
Specifies the beginning and end of the document body.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/body>)
body.`InnerHTML.innerHTML: string`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Element/innerHTML>)
innerHTML).`JestAssertion<string>.toBe: <string>(expected: string) => void`Checks that a value is what you expect. It calls`Object.is`to compare values. Don’t use`toBe`with floating-point numbers.
@exampleexpect(result).toBe(42); expect(status).toBe(true);
toBe('<button>0</button>'); // Click the button, then flush the changes so you can synchronously write expectations`var document: Document`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/document>)
document.`Document.body: HTMLElement`
Specifies the beginning and end of the document body.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/body>)
body.`ParentNode.querySelector<"button">(selectors: "button"): HTMLButtonElement | null (+4 overloads)`
Returns the first element that is a descendant of node that matches selectors.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/querySelector>)
querySelector('button').`HTMLElement.click(): void`[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/HTMLElement/click>)
click();`function flushSync(fn?: (() => void) | undefined): void`Synchronously flushes any pending state changes and those that result from it.
flushSync();`expect<string>(actual: string, message?: string): Assertion<string> (+1 overload)`expect(`var document: Document`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Window/document>)
document.`Document.body: HTMLElement`
Specifies the beginning and end of the document body.
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Document/body>)
body.`InnerHTML.innerHTML: string`
[MDN Reference](https://svelte.dev/docs/svelte/<https:/developer.mozilla.org/docs/Web/API/Element/innerHTML>)
innerHTML).`JestAssertion<string>.toBe: <string>(expected: string) => void`Checks that a value is what you expect. It calls`Object.is`to compare values. Don’t use`toBe` with floating-point numbers.
@exampleexpect(result).toBe(42); expect(status).toBe(true);
toBe('<button>1</button>'); // Remove the component from the DOM ````
function unmount(component: Record<string, any>, options?: {
outro?: boolean;
} | undefined): Promise<void>

```
`
Unmounts a component that was previously mounted using `mount` or `hydrate`.
Since 5.13.0, if `options.outro` is `true`, [transitions](https://svelte.dev/docs/svelte/<https:/svelte.dev/docs/svelte/transition>) will play before the component is removed from the DOM.
Returns a `Promise` that resolves after transitions have completed if `options.outro` is true, or immediately otherwise (prior to 5.13.0, returns `void`).
```

import { mount, unmount } from 'svelte';
import App from './App.svelte';
const app = mount(App, { target: document.body });
// later...
unmount(app, { outro: true });

`````

unmount(````
const component: {
  $on?(type: string, callback: (e: any) => void): () => void;
  $set?(props: Partial<Record<string, any>>): void;
} & Record<string, any>
`````

`component); });`

```

While the process is very straightforward, it is also low level and somewhat brittle, as the precise structure of your component may change frequently. Tools like [@testing-library/svelte](https://svelte.dev/docs/svelte/<https:/testing-library.com/docs/svelte-testing-library/intro/>) can help streamline your tests. The above test could be rewritten like this:
component.test
```

import { function render<C extends unknown, Q extends Queries = typeof import("/vercel/path0/node_modules/.pnpm/@testing-library+dom@10.4.0/node_modules/@testing-library/dom/types/queries")>(Component: ComponentType<...>, options?: SvelteComponentOptions<C>, renderOptions?: RenderOptions<Q>): RenderResult<C, Q>
Render a component into the document.

@template{import('./component-types.js').Component} C
@template{import('@testing-library/dom').Queries} [Q=typeof import('@testing-library/dom').queries]
@paramComponent - The component to render.
@paramoptions - Customize how Svelte renders the component.
@paramrenderOptions - Customize how Testing Library sets up the document and binds queries.
@returnsThe rendered component and bound testing functions.
render, const screen: Screen<typeof import("/vercel/path0/node_modules/.pnpm/@testing-library+dom@10.4.0/node_modules/@testing-library/dom/types/queries")>screen } from '@testing-library/svelte';
import ```
const userEvent: {
readonly setup: typeof setupMain;
readonly clear: typeof clear;
readonly click: typeof click;
readonly copy: typeof copy;
... 12 more ...;
readonly tab: typeof tab;
}

`````
`userEvent from '@testing-library/user-event'; import { `const expect: ExpectStatic`expect, `const test: TestAPI`
Defines a test case with a given name and test function. The test function can optionally be configured with test options.
@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@example`ts // Define a simple test test('should add two numbers', () => {  expect(add(1, 2)).toBe(3); }); `
@example`ts // Define a test with options test('should subtract two numbers', { retry: 3 }, () => {  expect(subtract(5, 2)).toBe(3); }); `
test } from 'vitest'; import ````
type Component = SvelteComponent<Record<string, any>, any, any>
const Component: LegacyComponentType
`````

`Component from './Component.svelte'; `test<object>(name: string | Function, fn?: TestFunction<object> | undefined, options?: number | TestOptions): void (+2 overloads)`
Defines a test case with a given name and test function. The test function can optionally be configured with test options.
@paramname - The name of the test or a function that will be used as a test name.
@paramoptionsOrFn - Optional. The test options or the test function if no explicit name is provided.
@paramoptionsOrTest - Optional. The test function or options, depending on the previous parameters.
@throwsError If called inside another test function.
@example`ts // Define a simple test test('should add two numbers', () => { expect(add(1, 2)).toBe(3); }); `
@example`ts // Define a test with options test('should subtract two numbers', { retry: 3 }, () => { expect(subtract(5, 2)).toBe(3); }); `test('Component', async () => { const`const user: UserEvent`user = ````
const userEvent: {
readonly setup: typeof setupMain;
readonly clear: typeof clear;
readonly click: typeof click;
readonly copy: typeof copy;
... 12 more ...;
readonly tab: typeof tab;
}

```
`userEvent.`setup: (options?: Options) => UserEvent`
Start a “session” with userEvent. All APIs returned by this function share an input device state and a default configuration.
setup(); `render<SvelteComponent<Record<string, any>, any, any>, typeof import("/vercel/path0/node_modules/.pnpm/@testing-library+dom@10.4.0/node_modules/@testing-library/dom/types/queries")>(Component: ComponentType<...>, options?: SvelteComponentOptions<...> | undefined, renderOptions?: RenderOptions<...> | undefined): RenderResult<...>`
Render a component into the document.
@template{import('./component-types.js').Component} C
@template{import('@testing-library/dom').Queries} [Q=typeof import('@testing-library/dom').queries]
@paramComponent - The component to render.
@paramoptions - Customize how Svelte renders the component.
@paramrenderOptions - Customize how Testing Library sets up the document and binds queries.
@returnsThe rendered component and bound testing functions.
render(`const Component: LegacyComponentType`Component); const `const button: HTMLElement`button = `const screen: Screen<typeof import("/vercel/path0/node_modules/.pnpm/@testing-library+dom@10.4.0/node_modules/@testing-library/dom/types/queries")>`screen.`getByRole<HTMLElement>(role: ByRoleMatcher, options?: ByRoleOptions | undefined): HTMLElement (+1 overload)`getByRole('button'); `expect<HTMLElement>(actual: HTMLElement, message?: string): Assertion<HTMLElement> (+1 overload)`expect(`const button: HTMLElement`button).toHaveTextContent(0); await `const user: UserEvent`user.`click: (element: Element) => Promise<void>`click(`const button: HTMLElement`button); `expect<HTMLElement>(actual: HTMLElement, message?: string): Assertion<HTMLElement> (+1 overload)`expect(`const button: HTMLElement`button).toHaveTextContent(1); });`
```

When writing component tests that involve two-way bindings, context or snippet props, it’s best to create a wrapper component for your specific test and interact with that. `@testing-library/svelte` contains some [examples](https://svelte.dev/docs/svelte/<https:/testing-library.com/docs/svelte-testing-library/example>).

## E2E tests using Playwright[](https://svelte.dev/docs/svelte/<#E2E-tests-using-Playwright>)

E2E (short for ‘end to end’) tests allow you to test your full application through the eyes of the user. This section uses [Playwright](https://svelte.dev/docs/svelte/<https:/playwright.dev/>) as an example, but you can also use other solutions like [Cypress](https://svelte.dev/docs/svelte/<https:/www.cypress.io/>) or [NightwatchJS](https://svelte.dev/docs/svelte/<https:/nightwatchjs.org/>).
To get started with Playwright, either install it via [the VS Code extension](https://svelte.dev/docs/svelte/<https:/playwright.dev/docs/getting-started-vscode>), or install it from the command line using `npm init playwright`. It is also part of the setup CLI when you run `npx sv create`.
After you’ve done that, you should have a `tests` folder and a Playwright config. You may need to adjust that config to tell Playwright what to do before running the tests - mainly starting your application at a certain port:
playwright.config

````
const ```
const config: {
  webServer: {
    command: string;
    port: number;
  };
  testDir: string;
  testMatch: RegExp;
}
````

`config = { ````
webServer: {
command: string;
port: number;
}

`````
`webServer: { `command: string`command: 'npm run build && npm run preview', `port: number`port: 4173 }, `testDir: string`testDir: 'tests', `testMatch: RegExp`testMatch: /(.+\\.)?(test|spec)\\.[jt]s/ }; export default ````
const config: {
  webServer: {
    command: string;
    port: number;
  };
  testDir: string;
  testMatch: RegExp;
}
`````

`config;`

```

You can now start writing tests. These are totally unaware of Svelte as a framework, so you mainly interact with the DOM and write assertions.
tests/hello-world.spec
```

import { import expectexpect, import testtest } from '@playwright/test';
import testtest('home page has expected h1', async ({ page }) => {
await page: anypage.goto('/');
await import expectexpect(page: anypage.locator('h1')).toBeVisible();
});

```

[ Edit this page on GitHub](https://svelte.dev/docs/svelte/<https:/github.com/sveltejs/svelte/edit/main/documentation/docs/07-misc/02-testing.md>)
previous next
[Imperative component API](https://svelte.dev/docs/svelte/</docs/svelte/imperative-component-api>) [TypeScript](https://svelte.dev/docs/svelte/</docs/svelte/typescript>)
```
