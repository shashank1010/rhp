## import
```js
import { slat, stackUp } from "@shashank1010/rhp-web";
// Template: template strings with {bindings}; stackUp's from and to come from a helper, stack, read as {stack.from[0]}
```

## about
```js
// A nation: its name, its stack (three bars, from and to from stackUp, a helper), its total
```

## settings
```js
helpers: { stack: (d) => stackUp(d.medals) },
```

## row
```js
`
  <rhp-label edge="start">{name}</rhp-label>
  <rhp-bar from="{stack.from[0]}" to="{stack.to[0]}" thick="0.6" color="series-1" class="part"></rhp-bar>
  <rhp-bar from="{stack.from[1]}" to="{stack.to[1]}" thick="0.6" color="series-2" class="part"></rhp-bar>
  <rhp-bar from="{stack.from[2]}" to="{stack.to[2]}" thick="0.6" color="series-3" class="part"></rhp-bar>
  <rhp-label at="{total}">{total}</rhp-label>`
```
