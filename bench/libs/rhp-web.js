// rhp as web components (web/, @shashank1010/rhp-web), CSS version: the chart is markup set with innerHTML, its slat
// <bench-row> is defined once with slat() and Solid's h, and the data is given as properties of the <rhp-plot>
// (data, then value).
// The chart builds in a microtask after it connects, inside the frame the harness measures.
import { slat, h, Bar, Label } from "../../web/src/index.js";

// Defined on first use, so an adapter that imports make() with its own slat doesn't ship this one
let row;
export const benchRow = () => (row ??= slat("bench-row", (d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.value }),
  h(Label, { at: () => d.value }, () => d.value),
]));

// chartAttrs: extra attributes of <rhp-chart> (" animate", " static"); tag: the slat element
export const make = (chartAttrs = "", tag = "bench-row") => (el, rows, { band }) => {
  el.innerHTML = `<rhp-chart scale="[0, 100]"${chartAttrs}><rhp-plot thickness="${band}"><template><${tag}></${tag}></template></rhp-plot></rhp-chart>`;
  const chart = el.firstElementChild, plot = chart.firstElementChild;
  // The plot is connected (and upgraded) by now, and name and value are no attributes of it, so it has no name or value
  // property yet: plot.name = [...] would be a plain expando the chart never reads. data (or set()) gives new data
  // groups, and makes plot.value a property for the updates.
  plot.data = { name: rows.map((r) => r.name), value: rows.map((r) => r.value) };
  return { update: (rows) => { plot.value = rows.map((r) => r.value); }, destroy: () => chart.remove() };
};

const mount = make();
export default { name: "rhp-web (CSS version)", mount: (el, rows, o) => (benchRow(), mount(el, rows, o)) };
