# Strict mode[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#strict-mode>)

Superforms is quite forgiving with missing fields in the posted data. The assumption is that if you add a field to a schema, it will sooner or later be added to the form, so the [default value](https://superforms.rocks/concepts/</default-values>) is applied to all missing schema fields.
But you may want to be more strict and assert that the input data must exist, otherwise something is wrong. For that, you can use strict mode when calling `superValidate`:

```
const form = await superValidate(request, zod(schema), { strict: true });
```

Now the following will be true:

- Any missing **required** field will be reported as an error.
- Errors will be displayed as default (can be changed with the `errors` option).

As checkboxes aren’t posted unless checked, they will fail validation in strict mode unless you add an empty hidden field for the checkbox, signifying `false`.

## Catch-all schema[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#catch-all-schema>)

Some validation libraries have a “catch-all” feature, allowing extra fields to be posted and validated. Here’s an example of how to use it with Zod:

```
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
const schema = z.object({
 name: z.string().min(1)
})
.catchall(z.number().int()); // All unknown fields should be integers
export const actions = {
 default: async ({ request }) => {
  const form = await superValidate(request, zod(schema));
  if (!form.valid) {
   return fail(400, { form });
  }
  // Typed as string, as expected
  console.log(form.data.name);
  // All other keys are typed as number
  console.log(form.data.first, form.data.second);
  return { form };
 }
};
```

[Previous page ← Status messages](https://superforms.rocks/concepts/</concepts/messages>) [Next page Submit behavior →](https://superforms.rocks/concepts/</concepts/submit-behavior>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/strict-mode/+page.md>)!
Table of Contents

- [Catch-all schema](https://superforms.rocks/concepts/<#catch-all-schema>)
