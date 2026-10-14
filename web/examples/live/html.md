## import
```js
import { slat, html, Bar, Label } from "@shashank1010/rhp-web";
```

## about
```js
// The row, written with html (Solid's tagged template): a hole that reads the row is a function (${() => d.sold}), so
// the bar follows the data. html compiles its templates with new Function, so a page with a Content-Security-Policy
// must allow 'unsafe-eval'.
```

## row
```js
(d) => html`
  <${Label} edge="start">${() => d.name}<//>
  <${Bar} to=${() => d.sold} />
  <${Label} at=${() => d.sold} class="value">${() => Math.round(d.sold)}<//>
`
```
