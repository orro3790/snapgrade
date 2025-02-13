# File uploads[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#file-uploads>)

From version 2, Superforms has full support for file uploads. For that, you need a schema that can validate files. Zod has this possibility:

```
// NOTE: Import fail from Superforms, not from @sveltejs/kit!
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
const schema = z.object({
 image: z
  .instanceof(File, { message: 'Please upload a file.'})
  .refine((f) => f.size < 100_000, 'Max 100 kB upload size.')
});
export const load = async () => {
 return {
  form: await superValidate(zod(schema))
 }
};
export const actions = {
 default: async ({ request }) => {
  const form = await superValidate(request, zod(schema));
  if (!form.valid) {
   return fail(400, { form });
  }
  // TODO: Do something with the image
  console.log(form.data.image);
  return message(form, 'You have uploaded a valid file!');
 }
};
```

## Returning files in form actions[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#returning-files-in-form-actions>)

**Important:** Because file objects cannot be serialized, you must return the form using `fail`, `message` or `setError` imported from Superforms:

```
import { message, setError, fail } from 'sveltekit-superforms';
// message, setError and the custom fail handles this automatically:
if (!form.valid) return fail(400, { form });
return message(form, 'Posted OK!');
return setError(form, 'image', 'Could not process file.');
```

Otherwise a `withFiles` helper function is required, which is not recommended:

```
// Importing the default fail:
import { fail } from '@sveltejs/kit';
// Prefer to import message, setError and fail from here instead:
import { withFiles } from 'sveltekit-superforms';
// With the @sveltejs/kit fail:
if (!form.valid) {
 return fail(400, withFiles({ form }));
}
// When returning just the form
return withFiles({ form })
```

This will remove the file objects from the form data, so SvelteKit can serialize it properly.

## Examples[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#examples>)

The recommended way to bind the file input to the form data is through a `fileProxy` or `filesProxy`, but you can also do it with an `on:input` handler. Here are examples for both, which also shows how to add client-side validation for files, which can save plenty of bandwidth!
Remember that you need to add `enctype="multipart/form-data"` on the form element for file uploads to work.

### Single file input[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#single-file-input>)

```
export const schema = z.object({
 image: z
  .instanceof(File, { message: 'Please upload a file.'})
  .refine((f) => f.size < 100_000, 'Max 100 kB upload size.')
});
```

Proxy method
on:input

```
<script lang="ts">
 import { superForm, fileProxy } from 'sveltekit-superforms'
 import { zodClient } from 'sveltekit-superforms/adapters'
 import { schema } from './schema.js'
 let { data } = $props();
 const { form, enhance, errors } = superForm(data.form, {
  validators: zodClient(schema)
 })
 const file = fileProxy(form, 'image')
</script>
<form method="POST" enctype="multipart/form-data" use:enhance>
 <input
  type="file"
  name="image"
  accept="image/png, image/jpeg"
  bind:files={$file}
 />
 {#if $errors.image}<span>{$errors.image}</span>{/if}
 <button>Submit</button>
</form>
```

### Multiple files[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#multiple-files>)

We need an array to validate multiple files:

```
const schema = z.object({
 images: z
  .instanceof(File, { message: 'Please upload a file.'})
  .refine((f) => f.size < 100_000, 'Max 100 kB upload size.')
  .array()
});
```

Proxy method
on:input

```
<script lang="ts">
 import { superForm, filesProxy } from 'sveltekit-superforms'
 import { zodClient } from 'sveltekit-superforms/adapters'
 import { schema } from './schema.js'
 let { data } = $props();
 const { form, enhance, errors } = superForm(data.form, {
  validators: zodClient(schema)
 })
 const files = filesProxy(form, 'images');
</script>
<form method="POST" enctype="multipart/form-data" use:enhance>
 <input
  type="file"
  multiple
  name="images"
  accept="image/png, image/jpeg"
  bind:files={$files}
 />
 {#if $errors.images}<span>{$errors.images}</span>{/if}
 <button>Submit</button>
</form>
```

To use the file proxies in a component, `fileFieldProxy` and `filesFieldProxy` are available as a complement to `formFieldProxy`.

## Validating files manually[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#validating-files-manually>)

If your validation library cannot validate files, you can obtain `FormData` from the request and extract the files from there, after validation:

```
import { message, fail } from 'sveltekit-superforms';
export const actions = {
 default: async ({ request }) => {
  const formData = await request.formData();
  const form = await superValidate(formData, zod(schema));
  if (!form.valid) return fail(400, { form });
  const image = formData.get('image');
  if (image instanceof File) {
   // Validate and process the image.
  }
  return message(form, 'Thank you for uploading an image!');
 }
};
```

If the file field isn’t a part of the schema, but you still want errors for it, you can add an optional field to the schema with the same name, and use [setError](https://superforms.rocks/concepts/</concepts/error-handling#seterror>) to set and display an error message.

## Progress bar for uploads[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#progress-bar-for-uploads>)

If you’d like a progress bar for large file uploads, check out the [customRequest](https://superforms.rocks/concepts/</concepts/events#customrequest>) option for the `onSubmit` event.

## Preventing file uploads[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#preventing-file-uploads>)

To prevent file uploads, set the `{ allowFiles: false }` option in `superValidate`. This will set all files to `undefined`, so you don’t have to use `withFiles`.
This will also happen if you have migrated from version 1 and defined [SUPERFORMS_LEGACY](https://superforms.rocks/concepts/</migration-v2/#the-biggest-change-important>). In that case, set `{ allowFiles: true }` to allow files.
[Previous page ← Events](https://superforms.rocks/concepts/</concepts/events>) [Next page Loading timers →](https://superforms.rocks/concepts/</concepts/timers>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/files/+page.md>)!
Table of Contents

- [Returning files in form actions](https://superforms.rocks/concepts/<#returning-files-in-form-actions>)
- [Examples](https://superforms.rocks/concepts/<#examples>)
- [Single file input](https://superforms.rocks/concepts/<#single-file-input>)
- [Multiple files](https://superforms.rocks/concepts/<#multiple-files>)
- [Validating files manually](https://superforms.rocks/concepts/<#validating-files-manually>)
- [Progress bar for uploads](https://superforms.rocks/concepts/<#progress-bar-for-uploads>)
- [Preventing file uploads](https://superforms.rocks/concepts/<#preventing-file-uploads>)
