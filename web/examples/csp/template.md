## import
```js
import { slat } from "@shashank1010/rhp-web";
```

## about
```js
// Markup with {bindings} and a helper, value (a path computes nothing): the bindings are paths, never compiled as code,
// so nothing for CSP to refuse. The slat's css becomes an adopted stylesheet, which style-src does not govern.
```

## settings
```js
helpers: { value: (d) => d.pounds.toFixed(1) },
```

## row
```js
`
  <rhp-label edge="start">{name}</rhp-label>
  <rhp-bar to="{pounds}"></rhp-bar>
  <rhp-label at="{pounds}" class="value">{value}</rhp-label>
`
```
