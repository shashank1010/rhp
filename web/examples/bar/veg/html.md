## scale
```html
<template><tick-number></tick-number></template>
```

## import
```js
import { slat, html, Bar, Label } from "@shashank1010/rhp-web";
```

## about
```js
// Slats written with html (Solid's tagged template). A hole that reads the row is a function (to=${() => d.pounds},
// not to=${d.pounds}), so the block follows the data. html compiles each template with new Function, so a page with a
// Content-Security-Policy must allow 'unsafe-eval' (this page has none; csp.html#html shows the refusal under one).
// A row is the name, a bar to its value in a tone, and the value at the bar's end.
```

## row
```js
(d) => html`
  <${Label} edge="start" class="name">${() => d.name}<//>
  <${Bar} to=${() => d.pounds} class=${() => (d.pounds > 15 ? "lead" : "rest")} />
  <${Label} at=${() => d.pounds} class="value">${() => d.pounds.toFixed(1)}<//>
`
```

## more
```js
// A tick's number, below the rows
slat("tick-number", {
  css: `.rhp-label { top: calc(100% + 6px); bottom: auto; translate: -50% 0; --rhp-label-gap: 0px; font-size: 12px; color: #8a8478; }`,
}, (d) => html`<${Label} at=${() => d.at}>${() => d.at}<//>`);
```
