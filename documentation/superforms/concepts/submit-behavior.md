# Submit behavior[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#submit-behavior>)

When a form is submitted, it’s important for the UX to show that things are happening on the server. Superforms provides you with [loading timers](https://superforms.rocks/concepts/</concepts/timers>) and the following options for handling this:

## Usage[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#usage>)

```
const { form, enhance } = superForm(data.form, {
 clearOnSubmit: 'message' | 'errors' | 'errors-and-message' | 'none' = 'message'
 multipleSubmits: 'prevent' | 'allow' | 'abort' = 'prevent'
})
```

### clearOnSubmit[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#clearonsubmit>)

The `clearOnSubmit` option decides what should happen to the form when submitting. It can clear the [status message](https://superforms.rocks/concepts/</concepts/messages>), all the [errors](https://superforms.rocks/concepts/</concepts/error-handling>), both, or none. The default is to clear the message.
If you don’t want any jumping content, which could occur when errors and messages are removed from the DOM, setting it to `none` can be useful.

### multipleSubmits[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#multiplesubmits>)

This one handles the occurence of multiple form submissions, before a result has been returned.

- When set to the default `prevent`, the form cannot be submitted again until a result is returned, or the `timeout` state is reached (see the section about [loading timers](https://superforms.rocks/concepts/</concepts/timers>)).
- `abort` is the next sensible approach, which will cancel the previous request before submitting again.
- Finally, `allow` will pass through any number of frenetic clicks on the submit button!

[Previous page ← Strict mode](https://superforms.rocks/concepts/</concepts/strict-mode>) [Next page Tainted fields →](https://superforms.rocks/concepts/</concepts/tainted>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/submit-behavior/+page.md>)!
Table of Contents

- [Usage](https://superforms.rocks/concepts/<#usage>)
- [clearOnSubmit](https://superforms.rocks/concepts/<#clearonsubmit>)
- [multipleSubmits](https://superforms.rocks/concepts/<#multiplesubmits>)
