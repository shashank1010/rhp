## import
```js
import { h, RhpSlat, Bar, Label } from "@shashank1010/rhp-web";
```

## slat
```js
class TotalRow extends RhpSlat {
  static layout = layout;
  static css = css;
  draw(d) {
    return [
      h("rhp-cell", { value: () => d.value, class: "tint" }),
      h(Label, { edge: "start", class: "name" }, () => d.name),
      h(Bar, { to: () => d.value, class: "total" }),
      h("rhp-dot", { at: () => d.value, size: "10px", color: "ink" }),
      h(Label, { at: () => d.value, class: "hours" }, () => d.hours.toFixed(1) + " h a day"),
    ];
  }
}
customElements.define("total-row", TotalRow);
```
