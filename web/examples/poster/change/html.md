## import
```js
import { slat, html, Bar, Dot, Label } from "@shashank1010/rhp-web";
```

## row
```js
(d) => html`
  <${Label} edge="start">${() => d.name}<//>
  <${Bar} from=${() => Math.min(d.tokyo, d.paris)} to=${() => Math.max(d.tokyo, d.paris)} thick=${0.12} color="muted" class="link" />
  <${Dot} at=${() => d.tokyo} color="muted" size="9px" />
  <${Dot} at=${() => d.paris} color=${() => (d.paris < d.tokyo ? "negative" : "series-1")} size="11px" />
  <${Label} at=${() => Math.max(d.tokyo, d.paris)} class="now">${() => d.paris}<//>`
```
