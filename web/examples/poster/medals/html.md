## import
```js
import { slat, html, Bar, Label, stackUp } from "@shashank1010/rhp-web";
// html: a hole that reads the row is a function; html`` needs 'unsafe-eval' under a CSP. Each nation's stack is three
// Bars, their from and to from stackUp.
```

## about
```js
// A nation: its name, its stack (three bars: gold, silver, bronze), its total
```

## row
```js
(d) => html`
  <${Label} edge="start">${() => d.name}<//>
  ${[0, 1, 2].map((i) => html`<${Bar}
    from=${() => stackUp(d.medals).from[i]}
    to=${() => stackUp(d.medals).to[i]}
    thick=${0.6}
    color=${`series-${i + 1}`}
    class="part"
  />`)}
  <${Label} at=${() => d.total}>${() => d.total}<//>`
```
