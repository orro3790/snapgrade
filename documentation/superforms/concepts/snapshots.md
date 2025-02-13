# Snapshots[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#snapshots>)

A nice SvelteKit feature is [snapshots](https://superforms.rocks/concepts/<https:/kit.svelte.dev/docs/snapshots>), which saves and restores data when the user navigates on the site. This is perfect for saving the form state, and with Superforms, you can take advantage of this in one line of code, as an alternative to a [tainted form message](https://superforms.rocks/concepts/</concepts/tainted>). Note that it only works for browser history navigation though.

## Usage[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#usage>)

```
const { form, capture, restore } = superForm(data.form);
export const snapshot = { capture, restore };
```

The export has to be on a `+page.svelte` page to work, it cannot be in a component.
The `options` object contains functions and cannot be serialized for a snapshot. If you modify the options dynamically, make a custom version of the methods to handle the changes.

## Test it out[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#test-it-out>)

Modify the form below without submitting, then click the browser back button and then forward again. The form should be restored to its intermediate state.
Name E-mail Submit Reset
[Previous page ← Single-page apps](https://superforms.rocks/concepts/</concepts/spa>) [Next page Status messages →](https://superforms.rocks/concepts/</concepts/messages>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/snapshots/+page.md>)!
Table of Contents

- [Usage](https://superforms.rocks/concepts/<#usage>)
- [Test it out](https://superforms.rocks/concepts/<#test-it-out>)
