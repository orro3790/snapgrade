# Nested data[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#nested-data>)

HTML forms can only handle string values, and the `<form>` element cannot nest other forms, so there is no standardized way to represent a nested data structure or more complex values like dates. Fortunately, Superforms has a solution for this!

## Usage[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#usage>)

```
const { form, enhance } = superForm(data.form, {
 dataType: 'form' | 'json' = 'form'
})
```

### dataType[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#datatype>)

By simply setting `dataType` to `'json'`, you can store any data structure allowed by [devalue](https://superforms.rocks/concepts/<https:/github.com/Rich-Harris/devalue>) in the `$form` store, and you don’t have to worry about failed coercion, converting strings to objects and arrays, etc.
You don’t even have to set a name on the form fields anymore, since the actual data in `$form` is now posted, not the input fields in the HTML. They are now simply UI components for modifying a data model, [as they should be](https://superforms.rocks/concepts/<https:/blog.encodeart.dev/rediscovering-mvc>). (Name attributes can still be useful for the browser to pre-fill fields though.)
When `dataType` is set to `'json'`, the `onSubmit` event will contain `FormData`, but it cannot be used to modify the posted data. You need to set or update `$form`, or in special cases, use [jsonData in onSubmit](https://superforms.rocks/concepts/</concepts/events#jsondata>).This also means that the `disabled` attribute, which normally prevents input fields from being submitted, will not have that effect. Everything in `$form` will be posted when `dataType` is set to `'json'`.

## Requirements[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#requirements>)

The requirements for nested data to work are as follows:

1. **JavaScript is enabled in the browser.**
2. **The form has the Superforms[use:enhance](https://superforms.rocks/concepts/</concepts/enhance>) applied.**

## Modifying the form programmatically[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#modifying-the-form-programmatically>)

To modify the form in code, you can assign `$form.field = ...` directly, but note that this will [taint](https://superforms.rocks/concepts/</concepts/tainted>) the affected fields. If you’re using the tainted feature and want to prevent it from happening, instead of an assignment you can use `form.update` with an extra option:

```
form.update(
 ($form) => {
  $form.name = "New name";
  return $form;
 },
 { taint: false }
);
```

The `taint` options are:

```
{ taint: boolean | 'untaint' | 'untaint-form' }
```

Which can be used to not only prevent tainting, but also untaint the modified field(s), or the whole form.

## Nested errors and constraints[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#nested-errors-and-constraints>)

When your schema contains arrays or objects, you can access them through `$form` as an ordinary object. But how does it work with errors and constraints?
`$errors` and `$constraints` mirror the `$form` data, but with every field or “leaf” in the object replaced with `string[]` and `InputConstraints`, respectively.

### Example[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#example>)

Given the following schema, which describes an array of tag objects:

```
const schema = z.object({
 tags: z
  .object({
   id: z.number().int().min(1),
   name: z.string().min(2)
  })
  .array()
});
const tags = [{ id: 1, name: 'test' }];
export const load = async () => {
 const form = await superValidate({ tags }, zod(schema));
 return { form };
};
```

You can build a HTML form for these tags using an `{#each}` loop:

```
<script lang="ts">
 const { form, errors, enhance } = superForm(data.form, {
  dataType: 'json'
 });
</script>
<form method="POST" use:enhance>
 {#each $form.tags as _, i}
  <div>
   Id
   <input
    type="number"
    data-invalid={$errors.tags?.[i]?.id}
    bind:value={$form.tags[i].id} />
   Name
   <input
    data-invalid={$errors.tags?.[i]?.name}
    bind:value={$form.tags[i].name} />
   {#if $errors.tags?.[i]?.id}
    <br />
    <span class="invalid">{$errors.tags[i].id}</span>
   {/if}
   {#if $errors.tags?.[i]?.name}
    <br />
    <span class="invalid">{$errors.tags[i].name}</span>
   {/if}
  </div>
 {/each}
 <button>Submit</button>
</form>
```

You can’t use the loop variable directly, as the value must be bound directly to `$form`, hence the usage of the loop index `i`.
Take extra care with the [optional chaining operator](https://superforms.rocks/concepts/<https:/developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining>) `?.`, it’s easy to miss a question mark, which will lead to confusing errors.

### The result[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#the-result>)

Toggle SuperDebug
Id
Name
Id
Name
Submit

## Arbitrary types in the form[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#arbitrary-types-in-the-form>)

Using the [transport](https://superforms.rocks/concepts/<https:/svelte.dev/docs/kit/hooks#Universal-hooks-transport>) feature of SvelteKit, it’s possible to use any type of value in the form and send it back and forth between server and client. To do this, you use the `transport` export from `hooks.ts` and its corresponding option for both `superValidate` and `superForm`. Here’s an example with the [decimal.js](https://superforms.rocks/concepts/<https:/mikemcl.github.io/decimal.js/>) library.
**src/hooks.ts**

```
import type { Transport } from '@sveltejs/kit';
import { Decimal } from 'decimal.js';
export const transport: Transport = {
	Decimal: {
		encode: (value) => value instanceof Decimal && value.toString(),
		decode: (str) => new Decimal(str)
	}
};
```

When calling `superValidate`:

```
import { transport } from '../../hooks.js';
const form = await superValidate(formData, zod(schema), { transport });
```

When calling `superForm`:

```
import { transport } from '../../hooks.js';
const { form, errors, enhance } = superForm(data.form, {
 dataType: 'json',
 transport
});
```

The transport feature requires at least version 2.11 of SvelteKit! Also note that classes have to be relatively simple to work. Static methods, getters/setters, etc, may cause problems due to how cloning works within Superforms.

## Arrays with primitive values[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#arrays-with-primitive-values>)

It’s possible to post multiple HTML elements with the same name, so you don’t have to use `dataType: 'json'` for arrays of primitive values like numbers and strings. Just add the input fields, **all with the same name as the schema field** , which can only be at the top level of the schema. Superforms will handle the type coercion to array automatically, as long as the fields have the same name attribute:

```
export const schema = z.object({
 tags: z.string().min(2).array().max(3)
});
```

```
<script lang="ts">
 const { form, errors } = superForm(data.form);
</script>
<form method="POST">
 <div>Tags</div>
 <!-- Display array-level errors (in this case array length) -->
 {#if $errors.tags?._errors}
  <div class="invalid">{$errors.tags._errors}</div>
 {/if}
 {#each $form.tags as _, i}
  <div>
   <input name="tags" bind:value={$form.tags[i]} />
   <!-- Display individual tag errors (string length) -->
   {#if $errors.tags?.[i]}
    <span class="invalid">{$errors.tags[i]}</span>
   {/if}
  </div>
 {/each}
 <button>Submit</button>
</form>
```

To summarize, the index `i` of the `#each` loop is used to access `$form.tags`, where the current values are (you cannot use the loop variable), and then the `name` attribute is set to the schema field `tags`, so its array will be populated when posted.
This example, having a `max(3)` limitation of the number of tags, also shows how to display array-level errors with the `$errors.tags._errors` field.

## Validation schemas and nested paths[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#validation-schemas-and-nested-paths>)

Validation libraries like Zod can refine the validation, the classic example is to check if two password fields are identical when updating a password. Usually there’s a `path` specifier for setting errors on those fields in the refine function:

```
const confirmPassword = z
 .object({
  password: z.string(),
  confirm: z.string(),
 })
 .refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"], // path of error
 });
```

This works fine for top-level properties, but for nested data you must usually specify that path as an **array** , each segment in its own element, not as a string path as you can do in the `FormPathLeaves` type!

```
// OK:
path: ['form', 'tags', 3]
// Will not work with Zod refine and superRefine:
path ['form.tags[3]']
```

[Previous page ← Multiple forms](https://superforms.rocks/concepts/</concepts/multiple-forms>) [Next page Proxy objects →](https://superforms.rocks/concepts/</concepts/proxy-objects>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/nested-data/+page.md>)!
Table of Contents

- [Usage](https://superforms.rocks/concepts/<#usage>)
- [dataType](https://superforms.rocks/concepts/<#datatype>)
- [Requirements](https://superforms.rocks/concepts/<#requirements>)
- [Modifying the form programmatically](https://superforms.rocks/concepts/<#modifying-the-form-programmatically>)
- [Nested errors and constraints](https://superforms.rocks/concepts/<#nested-errors-and-constraints>)
- [Example](https://superforms.rocks/concepts/<#example>)
- [The result](https://superforms.rocks/concepts/<#the-result>)
- [Arbitrary types in the form](https://superforms.rocks/concepts/<#arbitrary-types-in-the-form>)
- [Arrays with primitive values](https://superforms.rocks/concepts/<#arrays-with-primitive-values>)
- [Validation schemas and nested paths](https://superforms.rocks/concepts/<#validation-schemas-and-nested-paths>)
