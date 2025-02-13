# Forms and fields in components[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#forms-and-fields-in-components>)

Looking at the rather simple [get started tutorial](https://superforms.rocks/</get-started>), it’s obvious that quite a bit of boilerplate code adds up for a Superform:

```
<!-- For each form field -->
<label for="name">Name</label>
<input
 type="text"
 name="name"
 aria-invalid={$errors.name ? 'true' : undefined}
 bind:value={$form.name}
 {...$constraints.name}
/>
{#if $errors.name}
 <span class="invalid">{$errors.name}</span>
{/if}
```

And it also gets bad in the script part when you have more than a couple of forms on the page:

```
<script lang="ts">
 import { superForm } from 'sveltekit-superforms'
 let { data } = $props();
 const {
  form: loginForm,
  errors: loginErrors,
  enhance: loginEnhance,
  //...
 } = superForm(data.loginForm);
 const {
  form: registerForm,
  errors: registerErrors,
  enhance: registerEnhance,
  // ...
 } = superForm(data.registerForm);
</script>
```

This leads to the question of whether a form and its fields can be factored out into components?

## Factoring out a form[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#factoring-out-a-form>)

To do this, you need the type of the schema, which can be defined as follows:
**src/lib/schemas.ts**

```
export const loginSchema = z.object({
 email: z.string().email(),
 password: // ...
});
export type LoginSchema = typeof loginSchema;
```

Now you can import and use this type in a separate component:
**src/routes/LoginForm.svelte**

```
<script lang="ts">
 import type { SuperValidated, Infer } from 'sveltekit-superforms';
 import { superForm } from 'sveltekit-superforms'
 import type { LoginSchema } from '$lib/schemas';
 let { data } : { data : SuperValidated<Infer<LoginSchema>> } = $props();
 const { form, errors, enhance } = superForm(data);
</script>
<form method="POST" use:enhance>
 <!-- Business as usual -->
</form>
```

[SuperValidated](https://superforms.rocks/<https:/superforms.rocks/api#supervalidate-return-type>) is the return type from [superValidate](https://superforms.rocks/<https:/superforms.rocks/api#supervalidateadapter--data-adapter--options-options>), which we called in the load function.
This component can now be passed the `SuperValidated` form data (from the `PageData` we returned from `+page.server.ts`), making the page much less cluttered:
**+page.svelte**

```
<script lang="ts">
 let { data } = $props();
</script>
<LoginForm data={data.loginForm} />
<RegisterForm data={data.registerForm} />
```

If your schema input and output types differ, or you have a strongly typed [status message](https://superforms.rocks/</concepts/messages#strongly-typed-message>), you can add two additional type parameters:

```
<script lang="ts">
 import type { SuperValidated, Infer, InferIn } from 'sveltekit-superforms';
 import { superForm } from 'sveltekit-superforms'
 import type { LoginSchema } from '$lib/schemas';
 let { data } : {
  data : SuperValidated<Infer<LoginSchema>, { status: number, text: string }, InferIn<LoginSchema>>
 } = $props();
 const { form, errors, enhance, message } = superForm(data);
</script>
{#if $message.text}
 ...
{/if}
<form method="POST" use:enhance>
 <!-- Business as usual -->
</form>
```

## Factoring out form fields[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#factoring-out-form-fields>)

Since `bind` is available on Svelte components, we can make a `TextInput` component quite easily:
**TextInput.svelte**

```
<script lang="ts">
 import type { InputConstraint } from 'sveltekit-superforms';
 let {
  name,
  value = $bindable(),
  type = "text",
  label,
  errors,
  constraints,
  ...rest
 } : {
  name: string;
  value: string;
  type?: string;
  label?: string;
  errors?: string[];
  constraints?: InputConstraint;
 } = $props();
</script>
<label>
 {#if label}<span>{label}</span><br />{/if}
 <input
  {name}
  {type}
  bind:value
  aria-invalid={errors ? 'true' : undefined}
  {...constraints}
  {...rest}
 />
</label>
{#if errors}<span class="invalid">{errors}</span>{/if}
```

**+page.svelte**

```
<form method="POST" use:enhance>
 <TextInput
  name="name"
  label="name"
  bind:value={$form.name}
  errors={$errors.name}
  constraints={$constraints.name}
 />
 <h4>Tags</h4>
 {#each $form.tags as _, i}
  <TextInput
   name="tags"
   label="Name"
   bind:value={$form.tags[i].name}
   errors={$errors.tags?.[i]?.name}
   constraints={$constraints.tags?.name}
  />
 {/each}
</form>
```

(Note that you must bind directly to `$form.tags` with the index, you cannot use the each loop variable, hence the underscore.)
This is a bit better and will certainly help when the components require some styling, but there are still plenty of attributes. Can we do even better?
Things will get a bit advanced from here, so an alternative is to use the [Formsnap](https://superforms.rocks/</formsnap>) library, which simplifies componentization a lot.

### Using a fieldProxy[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#using-a-fieldproxy>)

You may have seen [proxy objects](https://superforms.rocks/</concepts/proxy-objects>) being used for converting an input field string like `"2023-04-12"` into a `Date`, but that’s a special usage of proxies. They can actually be used for any part of the form data, to have a store that can modify a part of the `$form` store. If you want to update just `$form.name`, for example:

```
<script lang="ts">
 import { superForm, fieldProxy } from 'sveltekit-superforms/client';
 let { data } = $props();
 const { form } = superForm(data.form);
 const name = fieldProxy(form, 'name');
</script>
<div>Name: {$name}</div>
<button on:click={() => ($name = '')}>Clear name</button>
```

Any updates to `$name` will reflect in `$form.name`, and vice versa. Note that this will also [taint](https://superforms.rocks/</concepts/tainted>) that field, so if this is not intended, you can use the whole superForm object and add an option:

```
const superform = superForm(data.form);
const { form } = superform;
const name = fieldProxy(superform, 'name', { taint: false });
```

A `fieldProxy` isn’t enough here, however. We’d still have to make proxies for `form`, `errors`, and `constraints`, resulting in the same problem again.

### Using a formFieldProxy[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#using-a-formfieldproxy>)

The solution is to use a `formFieldProxy`, which is a helper function for producing the above proxies from a form. To do this, we cannot immediately deconstruct what we need from `superForm`, since `formFieldProxy` takes the form itself as an argument:

```
<script lang="ts">
 import type { PageData } from './$types.js';
 import { superForm, formFieldProxy } from 'sveltekit-superforms/client';
 let { data } : { data: PageData } = $props();
 const superform = superForm(data.form);
 const { path, value, errors, constraints } = formFieldProxy(superform, 'name');
</script>
```

But we didn’t want to pass all those proxies, so let’s imagine a component that will handle even the above proxy creation for us.

## A typesafe, generic component[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#a-typesafe-generic-component>)

```
<TextField {superform} field="name" />
```

How nice would this be? This can actually be pulled off in a typesafe way with a bit of Svelte magic:

```
<script lang="ts" context="module">
 type T = Record<string, unknown>;
</script>
<script lang="ts" generics="T extends Record<string, unknown>">
 import { formFieldProxy, type SuperForm, type FormPathLeaves } from 'sveltekit-superforms';
 let { superForm, field } : { superform: SuperForm<T>, field: FormPathLeaves<T> } = $props();
 const { value, errors, constraints } = formFieldProxy(superform, field);
</script>
<label>
 {field}<br />
 <input
  name={field}
  type="text"
  aria-invalid={$errors ? 'true' : undefined}
  bind:value={$value}
  {...$constraints}
  {...$$restProps} />
</label>
{#if $errors}<span class="invalid">{$errors}</span>{/if}
```

The Svelte syntax requires `Record<string, unknown>` to be defined before its used in the `generics` attribute, so we have to import it in a module context. Now when `T` is defined (the schema object type), we can use it in the `form` prop to ensure that only a `SuperForm` matching the `field` prop is used.
The `FormPathLeaves` type prevents using a field that isn’t at the end of the schema (the “leaves” of the schema tree). This means that arrays and objects cannot be used in `formFieldProxy`. Array-level errors are handled [like this](https://superforms.rocks/</concepts/error-handling#form-level-and-array-errors>).

## Type narrowing for paths[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#type-narrowing-for-paths>)

Checkboxes don’t bind with `bind:value` but with `bind:checked`, which requires a `boolean`.
Because our component is generic, `value` returned from `formFieldProxy` is unknown, but we need a `boolean` here. Then we can add a type parameter to `FormPathLeaves` to narrow it down to a specific type, and use the [satisfies](https://superforms.rocks/<https:/www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator>) operator to specify the type:

```
<script lang="ts" context="module">
 type T = Record<string, unknown>;
</script>
<script lang="ts" generics="T extends Record<string, unknown>">
 import {
  formFieldProxy, type FormFieldProxy,
  type SuperForm, type FormPathLeaves
 } from 'sveltekit-superforms';
 let { superForm, field, ...rest } : { superform: SuperForm<T>, field: FormPathLeaves<T, boolean> } = $props();
 const { value, errors, constraints } = formFieldProxy(superform, field) satisfies FormFieldProxy<boolean>;
</script>
<input
 name={field}
 type="checkbox"
 class="checkbox"
 bind:checked={$value}
 {...$constraints}
 {...rest}
/>
```

This will also narrow the `field` prop, so only `boolean` fields in the schema can be selected when using the component.
Checkboxes, especially grouped ones, can be tricky to handle. Read the Svelte tutorial about [bind:group](https://superforms.rocks/<https:/svelte.dev/tutorial/group-inputs>), and see the [Ice cream example](https://superforms.rocks/<https:/stackblitz.com/edit/superforms-2-group-inputs?file=src%2Froutes%2F%2Bpage.server.ts,src%2Froutes%2F%2Bpage.svelte>) on Stackblitz if you’re having trouble with it.

## Using the componentized field in awesome ways[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#using-the-componentized-field-in-awesome-ways>)

Using this component is now as simple as:

```
<TextField {superform} field="name" />
```

But to show off some super proxy power, let’s recreate the tags example above with the `TextField` component:

```
<form method="POST" use:enhance>
 <TextField name="name" {superform} field="name" />
 <h4>Tags</h4>
 {#each $form.tags as _, i}
  <TextField name="tags" {superform} field="tags[{i}].name" />
 {/each}
</form>
```

We can now produce a type-safe text field for any object inside our data, which will update the `$form` store, and to add new tags, just append a tag object to the tags array:

```
$form.tags = [...$form.tags, { id: undefined, name: '' }];
```

In general, nested data requires the `dataType` option to be set to `'json'`, except arrays of primitive values, which are [coerced automatically](https://superforms.rocks/</concepts/nested-data#an-exception-arrays-with-primitive-values>).
I hope you now feel under your fingers the superpowers that Superforms bring! 💥
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/components/+page.md>)!
Table of Contents

- [Factoring out a form](https://superforms.rocks/<#factoring-out-a-form>)
- [Factoring out form fields](https://superforms.rocks/<#factoring-out-form-fields>)
- [Using a fieldProxy](https://superforms.rocks/<#using-a-fieldproxy>)
- [Using a formFieldProxy](https://superforms.rocks/<#using-a-formfieldproxy>)
- [A typesafe, generic component](https://superforms.rocks/<#a-typesafe-generic-component>)
- [Type narrowing for paths](https://superforms.rocks/<#type-narrowing-for-paths>)
- [Using the componentized field in awesome ways](https://superforms.rocks/<#using-the-componentized-field-in-awesome-ways>)
