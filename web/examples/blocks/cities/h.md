## import
```js
import { slat, h, shape } from "@shashank1010/rhp-web";
```

## row
```js
(d) => [
  h("rhp-label", { edge: "start", class: "name" }, () => d.name),
  h("rhp-bar", { to: () => d.value, color: () => (d.value > 50 ? "positive" : "muted"), shape: arrow }),
  h("rhp-tick", { at: 50, thick: 0.5, color: "ink" }),
  h("rhp-label", { at: () => d.value, class: "hours" }, () => d.hours.toFixed(1) + " h"),
  h("rhp-area", { points: () => d.history, peak: 24, color: "series-1", class: "under" }),
  h("rhp-line", { points: () => d.history, peak: 24, color: "series-1", class: "spark" }),
  h("rhp-place", { at: () => d.june[0], across: () => 1 - d.june[1] / 24 }, h("b", { class: "june" })),
]
```
