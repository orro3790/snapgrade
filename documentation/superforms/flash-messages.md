# Flash messages[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#flash-messages>)

[Status messages](https://superforms.rocks/</concepts/messages>) are useful, but redirects will cause them to be lost, because they need to be returned in `{ form }`, usually as a response from a POST request.
Since it’s common to redirect after a successful post, especially in backend interfaces, the `form.message` property isn’t a general solution for displaying status messages.
The sister library to Superforms is called [sveltekit-flash-message](https://superforms.rocks/<https:/github.com/ciscoheat/sveltekit-flash-message>), a useful addon that handles temporary messages sent with redirects. Note that at least version 1.0 is required!

## Usage[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#usage>)

The library works together with Superforms **without any extra configuration** , usually you can replace the Superforms [status messages](https://superforms.rocks/</concepts/messages>) with the flash message, and that will work very well.
But if you have some special use case where you need to integrate the flash message more closely with a form, you can do that by importing its module when calling `superForm`:

```
import * as flashModule from 'sveltekit-flash-message/client';
const { form, errors, enhance } = superForm(data.form, {
 flashMessage: {
  module: flashModule,
  onError?: ({ result, flashMessage }) => {
   // Error handling for the flash message:
   // - result is the ActionResult
   // - flashMessage is the flash store (not the status message store)
   const errorMessage = result.error.message
   flashMessage.set(/* Your flash message type */);
  }
 },
 syncFlashMessage: false
}
```

Then the following options are available:

### syncFlashMessage[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#syncflashmessage>)

If set to `true`, when `form.message` is updated, the flash message will be synchronized with it, including honoring the [clearOnSubmit](https://superforms.rocks/</concepts/submit-behavior#clearonsubmit>) option.
It’s important that the flash and form message types are matching, in this case. See [this section](https://superforms.rocks/</concepts/messages#strongly-typed-message>) on how to make the form message strongly typed.

### flashMessage.onError[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#flashmessageonerror>)

If a form error occurs, which happens when `error(...)` is called in a form action (and `use:enhance` is added to the form), the `flashMessage.onError` callback can be used to transform it into your flash message type, so you can display the error at the flash message instead of in `form.message`.
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/flash-messages/+page.md>)!
Table of Contents

- [Usage](https://superforms.rocks/<#usage>)
- [syncFlashMessage](https://superforms.rocks/<#syncflashmessage>)
- [flashMessage.onError](https://superforms.rocks/<#flashmessageonerror>)
