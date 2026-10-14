## import
```js
import { slat } from "@shashank1010/rhp-web";
```

## slat
```js
slat("total-row", {
  ...layout,
  css,
  helpers: { rounded: (d) => d.hours.toFixed(1) + " h a day" },
}, `
  <rhp-cell value="{value}" class="tint"></rhp-cell>
  <rhp-label edge="start" class="name">{name}</rhp-label>
  <rhp-bar to="{value}" class="total"></rhp-bar>
  <rhp-dot at="{value}" size="10px" color="ink"></rhp-dot>
  <rhp-label at="{value}" class="hours">{rounded}</rhp-label>`);
```
