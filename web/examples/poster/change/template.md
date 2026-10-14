## import
```js
import { slat } from "@shashank1010/rhp-web";
```

## settings
```js
helpers: {
  low: (d) => Math.min(d.tokyo, d.paris),
  high: (d) => Math.max(d.tokyo, d.paris),
  tone: (d) => (d.paris < d.tokyo ? "negative" : "series-1"),
},
```

## row
```js
`
  <rhp-label edge="start">{name}</rhp-label>
  <rhp-bar from="{low}" to="{high}" thick="0.12" color="muted" class="link"></rhp-bar>
  <rhp-dot at="{tokyo}" color="muted" size="9px"></rhp-dot>
  <rhp-dot at="{paris}" color="{tone}" size="11px"></rhp-dot>
  <rhp-label at="{high}" class="now">{paris}</rhp-label>`
```
