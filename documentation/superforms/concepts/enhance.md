# Progressive enhancement[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#progressive-enhancement>)

By using `enhance` returned from `superForm`, we’ll get the client-side enhancement expected from a modern website:

```
<script lang="ts">
 const { form, enhance } = superForm(data.form);
 //      ^^^^^^^
</script>
<form method="POST" use:enhance>
```

The `use:enhance` action takes no arguments; instead, events are used to hook into the default SvelteKit use:enhance parameters and more. Check out the [events page](https://superforms.rocks/concepts/</concepts/events>) for details.
Without `use:enhance` (and JavaScript enabled in the browser), the form will be static. No events, loading timers, auto-focus, etc. The only things that will work are [constraints](https://superforms.rocks/concepts/</concepts/client-validation#constraints>). Also note that SvelteKit’s own `use:enhance` cannot be used; you must use the one returned from `superForm`, and it should only be used on a single form element - you cannot share it between forms.

## Modifying the use:enhance behavior[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#modifying-the-useenhance-behavior>)

The default `use:enhance` behavior can be modified, there are three options available, here shown with the default values; you don’t need to add them unless you want to change a value.

```
const { form, enhance, reset } = superForm(data.form, {
 applyAction: true,
 invalidateAll: true | 'force',
 resetForm: true
});
```

### applyAction[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#applyaction>)

When `applyAction` is `true`, the form will have the default SvelteKit behavior of both updating and reacting on `$page.form` and `$page.status`, and also redirecting automatically.
Turning this behavior off can be useful when you want to isolate the form from other sources updating the page, for example Supabase events, a known source of confusing form behavior. Read more about `applyAction` [in the SvelteKit docs](https://superforms.rocks/concepts/<https:/kit.svelte.dev/docs/form-actions#progressive-enhancement-applyaction>).

### invalidateAll[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#invalidateall>)

When `invalidateAll` is `true` (the default) and a successful validation result is returned from the server, the page will be invalidated and the load functions will run again. A login form takes advantage of this to update user information on the page, but the default setting may cause problems with [multiple forms on the same page](https://superforms.rocks/concepts/</concepts/multiple-forms>), since the load function will reload the data for all forms defined there.

#### Optimistic updates[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#optimistic-updates>)

There can be a conflict between the data returned in the form action and the new data from the load function. The form action data is “optimistic”, meaning that what’s returned will be displayed, assuming that all data was supposed to be updated. But if you update the form partially, the form data will be out of sync with the load function data, in which case you may want to wait for the load function data. This can be achieved with by setting `invalidateAll: 'force'`. Now the load function data will be prioritized, and the `reset` function will also use the latest load function data when called.

### resetForm[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#resetform>)

When `true`, reset the form upon a successful validation result.
Note however, that since we’re using `bind:value` on the input fields, a HTML form reset (clearing all fields in the DOM) won’t have any effect. So in Superforms, **resetting means going back to the initial state of the form data** , basically setting `$form` to what was initially sent to `superForm`.
For a custom reset, you can instead modify the `data` field returned from `superValidate` on the server, or use the [events](https://superforms.rocks/concepts/</concepts/events>) together with the [reset](https://superforms.rocks/concepts/</api#superform-return-type>) function on the client.

## When to change the defaults?[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#when-to-change-the-defaults>)

Quite rarely! If you have a single form on the page and nothing else is causing the page to invalidate, you’ll probably be fine as it is. For multiple forms on the same page, you have to experiment with these three options. Read more on the [multiple forms](https://superforms.rocks/concepts/</concepts/multiple-forms>) page.

## Making the form behave like the SvelteKit default[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#making-the-form-behave-like-the-sveltekit-default>)

Any [ActionResult](https://superforms.rocks/concepts/<https:/kit.svelte.dev/docs/types#public-types-actionresult>) with status `error` is transformed into `failure` by Superforms to avoid form data loss. The SvelteKit default is to render the nearest `+error.svelte` page, which will wipe out the form and all data that was just entered. Returning `fail` with a [status message](https://superforms.rocks/concepts/</concepts/messages>) or using the [onError event](https://superforms.rocks/concepts/</concepts/events#onerror>) is a more user-friendly way of handling server errors.
You can prevent this by setting the following option. Use with care, since the purpose of the change is to protect the user from data loss.

```
const { form, enhance } = superForm(data.form, {
 // On ActionResult error, render the nearest +error.svelte page
 onError: 'apply',
});
```

[Previous page ← Tainted fields](https://superforms.rocks/concepts/</concepts/tainted>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/enhance/+page.md>)!
Table of Contents

- [Modifying the use:enhance behavior](https://superforms.rocks/concepts/<#modifying-the-useenhance-behavior>)
- [applyAction](https://superforms.rocks/concepts/<#applyaction>)
- [invalidateAll](https://superforms.rocks/concepts/<#invalidateall>)
- [Optimistic updates](https://superforms.rocks/concepts/<#optimistic-updates>)
- [resetForm](https://superforms.rocks/concepts/<#resetform>)
- [When to change the defaults?](https://superforms.rocks/concepts/<#when-to-change-the-defaults>)
- [Making the form behave like the SvelteKit default](https://superforms.rocks/concepts/<#making-the-form-behave-like-the-sveltekit-default>)
