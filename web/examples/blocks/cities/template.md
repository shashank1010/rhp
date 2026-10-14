## import
```js
import { slat, shape } from "@shashank1010/rhp-web";
```

## settings
```js
helpers: {
  arrow: () => arrow,
  tone: (d) => (d.value > 50 ? "positive" : "muted"),
  rounded: (d) => d.hours.toFixed(1) + " h",
  juneAcross: (d) => 1 - d.june[1] / 24,
},
```

## row
```js
`
  <rhp-label edge="start" class="name">{name}</rhp-label>
  <rhp-bar to="{value}" color="{tone}" shape="{arrow}"></rhp-bar>
  <rhp-tick at="50" thick="0.5" color="ink"></rhp-tick>
  <rhp-label at="{value}" class="hours">{rounded}</rhp-label>
  <rhp-area points="{history}" peak="24" color="series-1" class="under"></rhp-area>
  <rhp-line points="{history}" peak="24" color="series-1" class="spark"></rhp-line>
  <rhp-place at="{june[0]}" across="{juneAcross}"><b class="june"></b></rhp-place>`
```
