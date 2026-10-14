## scale
```html
<!-- Template: the tick slat is markup in the <rhp-scale>'s <template>, {at} binding the tick's value (no JS).
     room keeps space for the numbers below the rows. -->
<template>
  <style>
    .major { --rhp-tick-width: 1px; background: color-mix(in srgb, var(--rhp-ink) 35%, transparent); }
    .num { top: calc(100% + 6px); bottom: auto; translate: -50% 0; --rhp-label-gap: 0px; font-size: 12px; color: var(--rhp-muted); }
  </style>
  <div>
    <rhp-tick at="{at}" class="major"></rhp-tick>
    <rhp-label at="{at}" class="num">{at}</rhp-label>
  </div>
</template>
```

## import
```js
import "@shashank1010/rhp-web";
```
