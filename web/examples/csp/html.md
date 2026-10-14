## import
```js
import { slat, html, Bar, Label } from "@shashank1010/rhp-web";
```

## about
```js
// Refused here: solid-js/html compiles each template with new Function when a row is drawn, which is eval to CSP and
// needs 'unsafe-eval'. The error is reported (and listed on the page) and only this slat's plot is left out: the
// chart draws with no rows.
```

## row
```js
(d) => html`
  <${Label} edge="start">${() => d.name}<//>
  <${Bar} to=${() => d.pounds} />
  <${Label} at=${() => d.pounds} class="value">${() => d.pounds.toFixed(1)}<//>
`
```
