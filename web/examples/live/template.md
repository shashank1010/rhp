## import
```js
import { slat } from "@shashank1010/rhp-web";
```

## about
```js
// The row as markup with {bindings} given to slat(): {name} and to="{sold}" are paths, and {rate}, the rounded value,
// is a helper the markup reads like a column (a path computes nothing). The aria-label is set by attrs, which the row
// element itself takes (the markup is its content). Nothing is compiled, so it draws under any Content-Security-Policy.
```

## settings
```js
helpers: { rate: (d) => Math.round(d.sold) },
```

## row
```js
`
  <rhp-label edge="start">{name}</rhp-label>
  <rhp-bar to="{sold}"></rhp-bar>
  <rhp-label at="{sold}" class="value">{rate}</rhp-label>
`
```
