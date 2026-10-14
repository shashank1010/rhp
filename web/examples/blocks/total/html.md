## import
```js
import { slat, html, Bar, Label } from "@shashank1010/rhp-web";
```

## slat
```js
slat("total-row", { ...layout, css }, (d) => html`
  <rhp-cell value=${() => d.value} class="tint"></rhp-cell>
  <${Label} edge="start" class="name">${() => d.name}<//>
  <${Bar} to=${() => d.value} class="total" />
  <rhp-dot at=${() => d.value} size="10px" color="ink"></rhp-dot>
  <${Label} at=${() => d.value} class="hours">${() => d.hours.toFixed(1) + " h a day"}<//>`);
```
