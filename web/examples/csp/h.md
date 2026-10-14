## import
```js
import { slat, h, Bar, Label } from "@shashank1010/rhp-web";
```

## about
```js
// h(component, props, ...children): no template strings to compile, so nothing for CSP to refuse. The slat's css
// becomes an adopted stylesheet, which style-src does not govern (no nonce or 'unsafe-inline' needed for it).
```

## row
```js
(d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.pounds }),
  h(Label, { at: () => d.pounds, class: "value" }, () => d.pounds.toFixed(1)),
]
```
