## scale
```html
<template><tick-number></tick-number></template>
```

## import
```js
import { slat, h, Bar, Label } from "@shashank1010/rhp-web";
```

## about
```js
// Slats written with h (Solid's hyperscript): plain function calls, nothing compiled. A row is the name, a bar to its value in a tone, and the value at the bar's end. Values are read inside functions
// (() => d.pounds) so a row follows its data when it changes.
```

## row
```js
(d) => [
  h(Label, { edge: "start", class: "name" }, () => d.name),
  h(Bar, { to: () => d.pounds, class: () => (d.pounds > 15 ? "lead" : "rest") }),
  h(Label, { at: () => d.pounds, class: "value" }, () => d.pounds.toFixed(1)),
]
```

## more
```js
// A tick's number, below the rows
slat("tick-number", {
  css: `.rhp-label { top: calc(100% + 6px); bottom: auto; translate: -50% 0; --rhp-label-gap: 0px; font-size: 12px; color: #8a8478; }`,
}, (d) => h(Label, { at: () => d.at }, () => d.at));
```
