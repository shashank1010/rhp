## import
```js
import { slat, h, Bar, Dot, Label } from "@shashank1010/rhp-web";
```

## row
```js
(d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { from: () => Math.min(d.tokyo, d.paris), to: () => Math.max(d.tokyo, d.paris), thick: 0.12, color: "muted", class: "link" }),
  h(Dot, { at: () => d.tokyo, color: "muted", size: "9px" }),
  h(Dot, { at: () => d.paris, color: () => (d.paris < d.tokyo ? "negative" : "series-1"), size: "11px" }),
  h(Label, { at: () => Math.max(d.tokyo, d.paris), class: "now" }, () => d.paris),
]
```
