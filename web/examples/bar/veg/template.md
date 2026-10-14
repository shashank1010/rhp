## scale
```html
<!-- The ticks are a <template> in <rhp-scale>, with no JS: it binds the tick's d ({at}), a path, and its <style> is
  the ticks' CSS (never read for bindings). -->
<template>
  <style>
    .rhp-label { top: calc(100% + 6px); bottom: auto; translate: -50% 0; --rhp-label-gap: 0px; font-size: 12px; color: #8a8478; }
  </style>
  <div class="tick"><rhp-label at="{at}">{at}</rhp-label></div>
</template>
```

## import
```js
import { slat } from "@shashank1010/rhp-web";
```

## about
```js
// The row as markup with {bindings}, given to slat(): no code is compiled, so it draws under any Content-Security-Policy.
// A binding is a path, {name} is d.name, and to="{pounds}" gives the Bar the number itself. The tone and the value
// with one decimal are computed, which a path cannot do: they are helpers, (d) => value, read by name like columns.
```

## settings
```js
helpers: {
  tone: (d) => (d.pounds > 15 ? "lead" : "rest"),
  value: (d) => d.pounds.toFixed(1),
},
```

## row
```js
`
  <rhp-label edge="start" class="name">{name}</rhp-label>
  <rhp-bar to="{pounds}" class="{tone}"></rhp-bar>
  <rhp-label at="{pounds}" class="value">{value}</rhp-label>
`
```
