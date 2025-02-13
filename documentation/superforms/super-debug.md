```
import SuperDebug from 'sveltekit-superforms';
```

```
<SuperDebug data={$form} />
```

## Props reference[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#props-reference>)

```
<SuperDebug
 data={any}
 display={true}
 status={true}
 label=''
 collapsible={false}
 collapsed={false}
 stringTruncate={120}
 raw={false}
 functions={false}
 theme='default'
 ref={HTMLPreElement}
/>
```

| Prop               | Type                | Default value                                               | Description                                                                           |
| ------------------ | ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **data**           | any                 | Data to be displayed by SuperDebug. The only required prop. |
| **display**        | boolean             | `true`                                                      | Whether to show or hide SuperDebug.                                                   |
| **status**         | boolean             | `true`                                                      | Whether to show or hide the HTTP status code of the current page.                     |
| **label**          | string              | `""`                                                        | Add a label to SuperDebug, useful when using multiple instances on a page.            |
| **collapsible**    | boolean             | `false`                                                     | Makes the component collapsible on a per-route basis.                                 |
| **collapsed**      | boolean             | `false`                                                     | If the component is `collapsible`, sets it to initially collapsed.                    |
| **stringTruncate** | number              | `120`                                                       | Truncate long string field valuns of the data prop. Set to `0` to disable truncating. |
| **raw**            | boolean             | `false`                                                     | Skip promise and store detection when `true`.                                         |
| **functions**      | boolean             | `false`                                                     | Enables the display of fields of the data prop that are functions.                    |
| **theme**          | “default”, “vscode” | `"default"`                                                 | Display theme, which can also be customized with CSS variables.                       |
| **ref**            | HTMLPreElement      | Reference to the pre element that contains the data.        |

## Examples[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#examples>)

Change name here, to see it update in the SuperDebug instances:

### Default output[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#default-output>)

```
<SuperDebug data={$form} />
```

200

```
{
 name: "Gaspar Soiaga",
 email: "wendat@example.com",
 birth: 1649-01-01T00:00:00.000Z
}
```

### With a label[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#with-a-label>)

A label is useful when using multiple instance of SuperDebug.

```
<SuperDebug label="Useful label" data={$form} />
```

Useful label
200

```
{
 name: "Gaspar Soiaga",
 email: "wendat@example.com",
 birth: 1649-01-01T00:00:00.000Z
}
```

### With label, without status[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#with-label-without-status>)

```
<SuperDebug label="Sample User" status={false} data={$form} />
```

Sample User

```
{
 name: "Gaspar Soiaga",
 email: "wendat@example.com",
 birth: 1649-01-01T00:00:00.000Z
}
```

### Without label and status[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#without-label-and-status>)

```
<SuperDebug data={$form} status={false} />
```

```
{
 name: "Gaspar Soiaga",
 email: "wendat@example.com",
 birth: 1649-01-01T00:00:00.000Z
}
```

### Display only in dev mode[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#display-only-in-dev-mode>)

```
<script lang="ts">
 import { dev } from '$app/environment';
</script>
<SuperDebug data={$form} display={dev} />
```

### Promise support[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#promise-support>)

To see this in action, scroll to the product data below and hit refresh.

```
// +page.ts
export const load = (async ({ fetch }) => {
 const promiseProduct = fetch('https://dummyjson.com/products/1')
  .then(response => response.json())
 return { promiseProduct }
})
```

```
<SuperDebug label="Dummyjson product" data={data.promiseProduct} />
```

Dummyjson product
200

```

Loading data...

```

### Rejected promise[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#rejected-promise>)

```
// +page.ts
export const load = (async ({ fetch }) => {
 const rejected = Promise.reject(throw new Error('Broken promise'))
 return { rejected }
})
```

```
<SuperDebug data={rejected} />
```

200

```

Loading data...

```

### Composing debug data[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#composing-debug-data>)

If you want to debug multiple stores/objects in the same instance.

```
<SuperDebug data={{$form, $errors}} />
```

200

```
{
 $form: {
  name: "Gaspar Soiaga",
  email: "wendat@example.com",
  birth: 1649-01-01T00:00:00.000Z
 },
 $errors: {
  email: [
   "Cannot use example.com as email."
  ]
 }
}
```

### Displaying files[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#displaying-files>)

SuperDebug displays `File` and `FileList` objects as well:

```
<SuperDebug data={$form} />
```

200

```
{
 file: {}
}
```

### SuperDebug loves stores[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#superdebug-loves-stores>)

You can pass a store directly to SuperDebug:

```
<SuperDebug data={form} />
```

200

```
{
 name: "Gaspar Soiaga",
 email: "wendat@example.com",
 birth: 1649-01-01T00:00:00.000Z
}
```

### Custom styling[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#custom-styling>)

```
<SuperDebug
 data={$form}
 theme="vscode"
 --sd-code-date="lightgreen"
/>
```

200

```
{
 name: "Gaspar Soiaga",
 email: "wendat@example.com",
 birth: 1649-01-01T00:00:00.000Z
}
```

#### CSS variables available for customization[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#css-variables-available-for-customization>)

Display variables
Note that styling the component produces the side-effect described in the [Svelte docs](https://superforms.rocks/<https:/svelte.dev/docs/component-directives#style-props>).

### Page data[![](https://superforms.rocks/link.svg)](https://superforms.rocks/<#page-data>)

Debugging Svelte’s `$page` data, when the going gets tough. Since it can contain a lot of data, using the `collapsible` prop is convenient.

```
<script lang="ts">
 import { page } from '$app/stores';
</script>
<SuperDebug label="$page data" data={$page} collapsible />
```

$page data
200

```
{
 error: null,
 params: {},
 route: {
  id: "/super-debug"
 },
 status: 200,
 url: "https://superforms.rocks/super-debug",
 data: {},
 form: null,
 state: {}
}
```

Found a typo or an inconsistency? Make a quick correction [here](https://superforms.rocks/<https:/github.com/ciscoheat/superforms-web/tree/main/src/routes/super-debug/+page.md>)!
Table of Contents

- [Usage](https://superforms.rocks/<#usage>)
- [Props reference](https://superforms.rocks/<#props-reference>)
- [Examples](https://superforms.rocks/<#examples>)
- [Default output](https://superforms.rocks/<#default-output>)
- [With a label](https://superforms.rocks/<#with-a-label>)
- [With label, without status](https://superforms.rocks/<#with-label-without-status>)
- [Without label and status](https://superforms.rocks/<#without-label-and-status>)
- [Display only in dev mode](https://superforms.rocks/<#display-only-in-dev-mode>)
- [Promise support](https://superforms.rocks/<#promise-support>)
- [Rejected promise](https://superforms.rocks/<#rejected-promise>)
- [Composing debug data](https://superforms.rocks/<#composing-debug-data>)
- [Displaying files](https://superforms.rocks/<#displaying-files>)
- [SuperDebug loves stores](https://superforms.rocks/<#superdebug-loves-stores>)
- [Custom styling](https://superforms.rocks/<#custom-styling>)
- [CSS variables available for customization](https://superforms.rocks/<#css-variables-available-for-customization>)
- [Page data](https://superforms.rocks/<#page-data>)
