## import
```js
import { slat, h, Bar, Label, stackUp } from "@shashank1010/rhp-web";
// h: plain function calls. Each nation's stack is three Bars, their from and to from stackUp.
```

## about
```js
// A nation: its name, its stack (three bars: gold, silver, bronze), its total
```

## row
```js
(d) => [
  h(Label, { edge: "start" }, () => d.name),
  ...[0, 1, 2].map((i) => h(Bar, {
    from: () => stackUp(d.medals).from[i],
    to: () => stackUp(d.medals).to[i],
    thick: 0.6,
    color: `series-${i + 1}`,
    class: "part",
  })),
  h(Label, { at: () => d.total }, () => d.total),
]
```
