// rhp as web components, built with createElement and properties: no HTML parsing, so the difference from rhp-web is
// the parser and the upgrade, and the difference from rhp-css is the wrapper itself. The chart builds in a microtask
// after it connects.
import { benchRow } from "./rhp-web.js";

export default {
  name: "rhp-web (createElement)",
  mount(el, rows, { band }) {
    const Row = benchRow();
    const chart = document.createElement("rhp-chart");
    chart.scale = [0, 100];
    const plot = document.createElement("rhp-plot");
    plot.thickness = band;
    plot.slat = Row;
    plot.name = rows.map((r) => r.name);
    plot.value = rows.map((r) => r.value);
    chart.append(plot);
    el.append(chart);
    return { update: (rows) => { plot.value = rows.map((r) => r.value); }, destroy: () => chart.remove() };
  },
};
