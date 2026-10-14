## import
```js
import { slat, html, shape } from "@shashank1010/rhp-web";
```

## row
```js
(d) => html`
  <rhp-label edge="start" class="name">${() => d.name}</rhp-label>
  <rhp-bar to=${() => d.value} color=${() => (d.value > 50 ? "positive" : "muted")} shape=${arrow}></rhp-bar>
  <rhp-tick at="50" thick="0.5" color="ink"></rhp-tick>
  <rhp-label at=${() => d.value} class="hours">${() => d.hours.toFixed(1) + " h"}</rhp-label>
  <rhp-area points=${() => d.history} peak="24" color="series-1" class="under"></rhp-area>
  <rhp-line points=${() => d.history} peak="24" color="series-1" class="spark"></rhp-line>
  <rhp-place at=${() => d.june[0]} across=${() => 1 - d.june[1] / 24}><b class="june"></b></rhp-place>`
```
