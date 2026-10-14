## import
```js
import { slat, h, Bar, Label } from "@shashank1010/rhp-web";
```

## about
```js
// The row, written with h (Solid's hyperscript): plain function calls, nothing compiled
```

## row
```js
(d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.sold }),
  h(Label, { at: () => d.sold, class: "value" }, () => Math.round(d.sold)),
]
```
