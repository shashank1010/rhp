// rhp in Solid written with h (hyperscript) instead of JSX, no web components: the chart of rhp-css.solid.jsx. Isolates
// the cost of h from the cost of the web-component wrapper (rhp-web uses h for its slat).
import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import h from "solid-js/h";
import { Chart, Plot, Bar, Label, slat } from "../../src/index.js";

export default {
  name: "rhp in Solid with h",
  mount(el, rows, { band }) {
    const [values, setValues] = createSignal(rows.map((r) => r.value));
    const names = rows.map((r) => r.name);
    // h gives a function that makes the element; a slat returns the element itself
    const Row = slat({ thickness: band }, (d) => h("div",
      h(Label, { edge: "start" }, () => d.name),
      h(Bar, { to: () => d.value }),
      h(Label, { at: () => d.value }, () => d.value),
    )());
    const dispose = render(() => h(Chart, { scale: [0, 100] }, h(Plot, { name: names, value: () => values() }, Row)), el);
    return { update: (rows) => setValues(rows.map((r) => r.value)), destroy: dispose };
  },
};
