## scale
```html
<template><n-tick></n-tick></template>
```

## import
```js
import { slat, h, Tick, Label } from "@shashank1010/rhp-web";
```

## more
```js
// The value axis, one slat per tick: a line through the plot and the start's number under it
slat("n-tick", {
  inset: 0,
  room: { after: 26 },
  css: `
    .major { --rhp-tick-width: 1px; background: color-mix(in srgb, var(--rhp-ink) 35%, transparent); }
    .num { top: calc(100% + 6px); bottom: auto; translate: -50% 0; --rhp-label-gap: 0px; font-size: 12px; color: var(--rhp-muted); }
  `,
}, (d) => [
  h(Tick, { at: () => d.at, class: "major" }),
  h(Label, { at: () => d.at, class: "num" }, () => d.at),
]);
```
