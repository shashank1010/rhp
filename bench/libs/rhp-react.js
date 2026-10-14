// rhp in React through @bezda/rhp-react: the chart of rhp-css.solid.jsx, written with Solid's h and given to toReact,
// and React re-rendering it with new rows (flushSync, as the other React adapters). The wrapper reconciles the props
// into a Solid store, so a new value moves its bar only.
import { createElement } from "react";
import h from "solid-js/h";
import { toReact, Chart, Plot, Bar, Label, slat } from "../../react/index.js";
import { reactMount } from "./react.js";

const rowOf = (band) => slat({ thickness: band }, (d) => h("div",
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.value }),
  h(Label, { at: () => d.value }, () => d.value),
)());

const charts = new Map(); // band -> the React component
const chartFor = (band) => {
  if (!charts.has(band)) {
    const Row = rowOf(band);
    charts.set(band, toReact((props) => h(Chart, { scale: [0, 100] }, h(Plot, { name: () => props.name, value: () => props.value }, Row))));
  }
  return charts.get(band);
};

const view = (rows, { band }) => createElement(chartFor(band), { name: rows.map((r) => r.name), value: rows.map((r) => r.value) });

export default { name: "rhp in React (@bezda/rhp-react)", mount: reactMount(view) };
