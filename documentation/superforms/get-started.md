```
npm i -D sveltekit-superforms
```

Select your environment above and run the install command in your project folder.
If you’re starting from scratch, create a new SvelteKit project:

```
npx sv create my-app
```

Alternatively, [open the tutorial on SvelteLab](https://superforms.rocks/<https:/sveltelab.dev/github.com/ciscoheat/superforms-examples/tree/tutorial->) to follow along in the browser and copy the code from there.
Please select a validation library above before continuing, as the tutorial changes depending on that.

## Creating a Superform[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#creating-a-superform>)

This tutorial will create a Superform with a name and email address, ready to be expanded with more form data.

### Creating a validation schema[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#creating-a-validation-schema>)

The main thing required to create a Superform is a validation schema, representing the form data for a single form:
Select a validation library at the top of the page to see the example code.

#### Schema caching[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#schema-caching>)

Define the schema _outside_ the load function, on the top level of the module. **This is very important to make caching work.** The adapter is memoized (cached) with its arguments, so they must be kept in memory.
Therefore, define the schema, its options and potential defaults on the top level of a module, so they always refer to the same object.

### Initializing the form in the load function[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#initializing-the-form-in-the-load-function>)

To initialize the form, you import `superValidate` and an adapter for your validation library of choice in a load function:
**src/routes/+page.server.ts**
Select a validation library at the top of the page to see the example code.
The Superforms server API is called `superValidate`. You can call it in two ways in the load function:

### Empty form[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#empty-form>)

If you want the form to be initially empty, just pass the adapter as in the example above, and the form will be filled with default values based on the schema. For example, a `string` field results in an empty string, unless you have specified a default.

### Populate form from database[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#populate-form-from-database>)

If you want to populate the form, usually from a database, you can send data to `superValidate` as the first parameter, adapter second, like this:

```
import { error } from '@sveltejs/kit';
export const load = async ({ params }) => {
 // Replace with your database
 const user = db.users.findUnique({
  where: { id: params.id }
 });
 if (!user) error(404, 'Not found');
 const form = await superValidate(user, your_adapter(schema));
 // Always return { form } in load functions
 return { form };
};
```

As long as the data partially matches the schema, you can pass it directly to `superValidate`. This is useful for backend interfaces, where the form should usually be populated based on a url like `/users/123`.
Errors will be displayed when the form is populated, but not when empty. You can modify this behavior [with an option](https://superforms.rocks/</concepts/error-handling#initial-form-errors>).

### Important note about return values[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#important-note-about-return-values>)

Unless you call the SvelteKit `redirect` or `error` functions, you should **always** return the form object to the client, either directly or through a helper function. The name of the variable doesn’t matter; you can call it `{ loginForm }` or anything else, but it needs to be returned like this in all code paths that returns, both in load functions and form actions. If you don’t, the form won’t be updated with new data (like errors) on the client.

## Posting data[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#posting-data>)

In the form actions, also defined in `+page.server.ts`, we’ll use `superValidate` again, but now it should handle `FormData`. This can be done in several ways:

- Use the `request` parameter (which contains `FormData`)
- Use the `event` object (which contains the request)
- Use `FormData` directly, if you need to access it before calling `superValidate`.

The most common is to use `request`:
**src/routes/+page.server.ts**

```
import { message } from 'sveltekit-superforms';
import { fail } from '@sveltejs/kit';
export const actions = {
 default: async ({ request }) => {
  const form = await superValidate(request, your_adapter(schema));
  console.log(form);
  if (!form.valid) {
   // Return { form } and things will just work.
   return fail(400, { form });
  }
  // TODO: Do something with the validated form.data
  // Return the form with a status message
  return message(form, 'Form posted successfully!');
 }
};
```

## For simple forms[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#for-simple-forms>)

If you have a very simple form and no intentions to use any client-side functionality like events, loading spinners, nested data, etc, then you don’t have to include the client part, which the rest of the tutorial is about. There’s a short example how to display errors and messages without the client [here](https://superforms.rocks/</examples?tag=runes>). Enjoy the simplicity!

## Displaying the form[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#displaying-the-form>)

The data from `superValidate` is now available in `+page.svelte` as `data.form`, as we did a `return { form }`. Now we can use the client part of the API:
**src/routes/+page.svelte**

```
<script lang="ts">
 const { form, errors, constraints, message } = superForm(data.form);
 //      ^^^^^^ ^^^^^^^^^^^ ^^^^^^^
</script>
{#if $message}<h3>{$message}</h3>{/if}
<form method="POST">
 <label for="name">Name</label>
 <input
  type="text"
  name="name"
  aria-invalid={$errors.name ? 'true' : undefined}
  bind:value={$form.name}
  {...$constraints.name} />
 {#if $errors.name}<span class="invalid">{$errors.name}</span>{/if}
 <label for="email">E-mail</label>
 <input
  type="email"
  name="email"
  aria-invalid={$errors.email ? 'true' : undefined}
  bind:value={$form.email}
  {...$constraints.email} />
 {#if $errors.email}<span class="invalid">{$errors.email}</span>{/if}
 <div><button>Submit</button></div>
</form>
<style>
 .invalid {
  color: red;
 }
</style>
```

The `superForm` function is used to create a form on the client, and `bind:value` is used to create a two-way binding between the form data and the input fields.
Two notes: There should be only one `superForm` instance per form - its methods cannot be used in multiple forms. And don’t forget the `name` attribute on the input fields! Unless you are using [nested data](https://superforms.rocks/</concepts/nested-data>), they are required.
This is what the form should look like now:
Name E-mail Submit

### Debugging[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#debugging>)

We can see that the form has been populated with the default values from the schema. But let’s add the debugging component [SuperDebug](https://superforms.rocks/</super-debug>) to look behind the scenes:
**src/routes/+page.svelte**

```
<script lang="ts">
 const { form, errors, constraints, message, enhance } = superForm(data.form);
 //                     ^^^^^^^
</script>
<!-- Add to the form element: -->
<form method="POST" use:enhance>
```

This should be displayed:
200

```
{
 name: "Hello world!",
 email: ""
}
```

When editing the form fields (try in the form above), the data is automatically updated.
SuperDebug also displays a copy button and the current page status in the right corner. There are many [configuration options](https://superforms.rocks/</super-debug>) available.

## Posting the form[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#posting-the-form>)

Now we can post the form back to the server. Submit the form, and see what’s happening on the server:

```
{
 id: 'a3g9kke',
 valid: false,
 posted: true,
 data: { name: 'Hello world!', email: '' },
 errors: { email: [ 'Invalid email' ] }
}
```

This is the validation object returned from `superValidate`, containing the data needed to update the form:
Property | Purpose  
---|---  
**id** | Id for the schema, to handle [multiple forms](https://superforms.rocks/</concepts/multiple-forms>) on the same page.  
**valid** | Tells you whether the validation succeeded or not. Used on the server and in [events](https://superforms.rocks/</concepts/events>).  
**posted** | Tells you if the data was posted (in a form action) or not (in a load function).  
**data** | The posted data, which should be returned to the client using `fail` if not valid.  
**errors** | An object with all validation errors, in a structure reflecting the data.  
**message** | (optional) Can be set as a [status message](https://superforms.rocks/</concepts/messages>).  
There are some other properties as well, only being sent in the load function:
Property | Purpose  
---|---  
**constraints** | An object with [HTML validation constraints](https://superforms.rocks/<https:/developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#using_built-in_form_validation>), that can be spread on input fields.  
**shape** | Used internally in error handling.  
You can modify any of these, and they will be updated on the client when you `return { form }`. There are a couple of helper functions for making this more convenient, like [message](https://superforms.rocks/</concepts/messages>) and [setError](https://superforms.rocks/</concepts/error-handling>).

### Displaying errors[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#displaying-errors>)

Now we know that validation has failed and there are errors being sent to the client. We display these by adding properties to the destructuring assignment of `superForm`:
**src/routes/+page.svelte**

```
<script lang="ts">
 import SuperDebug from 'sveltekit-superforms';
</script>
<SuperDebug data={$form} />
```

By including the `errors` store, we can display errors where appropriate, and through `constraints` we’ll get browser validation even without JavaScript enabled.
The `aria-invalid` attribute is used to [automatically focus](https://superforms.rocks/</concepts/error-handling#errorselector>) on the first error field. And finally, we included the [status message](https://superforms.rocks/</concepts/messages>) above the form to show if it was posted successfully.
We now have a fully working form, with convenient handling of data and validation both on the client and server!
There are no hidden DOM manipulations or other secrets; it’s just HTML attributes and Svelte stores, which means it works perfectly with server-side rendering. No JavaScript is required for the basics.

### Adding progressive enhancement[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#adding-progressive-enhancement>)

As a last step, let’s add progressive enhancement, so JavaScript users will have a nicer experience. We also need it for enabling [client-side validation](https://superforms.rocks/</concepts/client-validation>) and [events](https://superforms.rocks/</concepts/events>), and of course to avoid reloading the page when the form is posted.
This is simply done with `enhance`, returned from `superForm`:

```
<script lang="ts">
 import { superForm } from 'sveltekit-superforms';
 let { data } = $props();
 // Client API:
 const { form } = superForm(data.form);
</script>
<form method="POST">
 <label for="name">Name</label>
 <input type="text" name="name" bind:value={$form.name} />
 <label for="email">E-mail</label>
 <input type="email" name="email" bind:value={$form.email} />
 <div><button>Submit</button></div>
</form>
```

Now the page won’t fully reload when submitting, and we unlock lots of client-side features like timers for [loading spinners](https://superforms.rocks/</concepts/timers>), [auto error focus](https://superforms.rocks/</concepts/error-handling#errorselector>), [tainted fields](https://superforms.rocks/</concepts/tainted>), etc, which you can read about under the Concepts section in the navigation.
The `use:enhance` action takes no arguments; instead, events are used to hook into the SvelteKit use:enhance parameters and more. Check out the [events page](https://superforms.rocks/</concepts/events>) for details.

## Next steps[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#next-steps>)

This concludes the tutorial! To learn the details, keep reading under the Concepts section in the navigation. A [status message](https://superforms.rocks/</concepts/messages>) is very common to add, for example. Also, if you plan to use nested data (objects and arrays within the schema), read the [nested data](https://superforms.rocks/</concepts/nested-data>) page carefully. The same goes for having [multiple forms on the same page](https://superforms.rocks/</concepts/multiple-forms>).
When you’re ready for something more advanced, check out the [CRUD tutorial](https://superforms.rocks/</crud>), which shows how to make a fully working backend in about 150 lines of code.
Enjoy your Superforms!
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/get-started/[...lib]/+page.md>)!
Table of Contents

- [Creating a Superform](https://superforms.rocks/<#creating-a-superform>)
- [Creating a validation schema](https://superforms.rocks/<#creating-a-validation-schema>)
- [Schema caching](https://superforms.rocks/<#schema-caching>)
- [Initializing the form in the load function](https://superforms.rocks/<#initializing-the-form-in-the-load-function>)
- [Empty form](https://superforms.rocks/<#empty-form>)
- [Populate form from database](https://superforms.rocks/<#populate-form-from-database>)
- [Important note about return values](https://superforms.rocks/<#important-note-about-return-values>)
- [Posting data](https://superforms.rocks/<#posting-data>)
- [For simple forms](https://superforms.rocks/<#for-simple-forms>)
- [Displaying the form](https://superforms.rocks/<#displaying-the-form>)
- [Debugging](https://superforms.rocks/<#debugging>)
- [Posting the form](https://superforms.rocks/<#posting-the-form>)
- [Displaying errors](https://superforms.rocks/<#displaying-errors>)
- [Adding progressive enhancement](https://superforms.rocks/<#adding-progressive-enhancement>)
- [Next steps](https://superforms.rocks/<#next-steps>)
