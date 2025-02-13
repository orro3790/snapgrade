# Loading timers[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#loading-timers>)

It’s important that users understand that things are happening when they submit a form. Loading timers can be used to provide feedback when there is a server response delay, for example by displaying a loading spinner icon.

## Usage[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#usage>)

```
const { form, enhance, submitting, delayed, timeout } = superForm(data.form, {
 delayMs?: 500
 timeoutMs?: 8000
})
```

`delayMs` should be positive and always smaller than or equal to `timeoutMs`, otherwise the timer behavior will be undefined. And of course, the Superforms [use:enhance](https://superforms.rocks/concepts/</concepts/enhance>) must be added to the form element, since this is client-side behavior.

## Submit state[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#submit-state>)

After a certain time when the form is submitted, determined by `delayMs` and `timeoutMs`, the timers changes state. The states are:

```
Idle → submitting → delayed → timeout
    0 ms     500 ms  8000 ms

```

These states affect the readable stores `submitting`, `delayed` and `timeout`, returned from `superForm`. They are not mutually exclusive, so `submitting` won’t change to `false` when `delayed` becomes `true`.

## Loading indicators[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#loading-indicators>)

A perfect use for these timers is to show a loading indicator while the form is submitting:
**src/routes/+page.svelte**

```
<script lang="ts">
 const { form, errors, enhance, delayed } = superForm(data.form);
 import spinner from '$lib/assets/spinner.svg';
</script>
<form method="POST" use:enhance>
 <button>Submit</button>
 {#if $delayed}<img src={spinner} />{/if}
</form>
```

The reason for using `delayed` instead of `submitting` is based on the article [Response Times: The 3 Important Limits](https://superforms.rocks/concepts/<https:/www.nngroup.com/articles/response-times-3-important-limits/>), which states that for short waiting periods, no feedback is required except to display the result. Therefore, `delayed` is used to show a loading indicator after a little while, not instantly.

## Visualizing the timers[![](https://superforms.rocks/link.svg)](https://superforms.rocks/concepts/<#visualizing-the-timers>)

Submit the following form and play around with the different settings. Different loading spinners are set to display when `delayed` and `timeout` are true respectively.
The default [multipleSubmits](https://superforms.rocks/concepts/</concepts/submit-behavior#multiplesubmits>) setting prevents the form from being submitted multiple times, until the `timeout` state is reached. Click multiple times to see the effect of that.

```
Idle → submitting → delayed → timeout
    0 ms     500 ms  2000 ms

```

Server response delay: 4000 ms
delayMs option: 500 ms
timeoutMs option: 2000 ms
Submit
By experimenting with the timers and the delay between them, it’s certainly possible to prevent the feeling of unresponsiveness.
[Previous page ← File uploads](https://superforms.rocks/concepts/</concepts/files>) [Next page Multiple forms →](https://superforms.rocks/concepts/</concepts/multiple-forms>)
Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/concepts/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/concepts/timers/+page.md>)!
Table of Contents

- [Usage](https://superforms.rocks/concepts/<#usage>)
- [Submit state](https://superforms.rocks/concepts/<#submit-state>)
- [Loading indicators](https://superforms.rocks/concepts/<#loading-indicators>)
- [Visualizing the timers](https://superforms.rocks/concepts/<#visualizing-the-timers>)
