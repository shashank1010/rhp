// @shashank1010/rhp-web: rhp charts as web components.
//
//   import { slat, h, Bar, Label } from "@shashank1010/rhp-web";
//   slat("fruit-row", { thickness: 32 }, (d) => [h(Label, { edge: "start" }, () => d.name), h(Bar, { to: () => d.sold })]);
//
//   <rhp-chart scale="[0, 30]">
//     <rhp-plot name='["Apples", "Bananas"]' sold="[12, 18]"><template><fruit-row></fruit-row></template></rhp-plot>
//   </rhp-chart>
//
// Everything @bezda/rhp/standalone exports is exported here too (rhp, Solid's primitives, html, render, the store), from
// the same Solid the elements use, so a page has one Solid for its charts, its slats and its signals. The one exception
// is rhp's slat(settings?, fn): this package's slat(tag, settings?, fn) below replaces it.
import { RhpChart } from "./elements/chart.js";
import { RhpPlot } from "./elements/plot.js";
import { RhpScale } from "./elements/scale.js";
import { RhpAxis } from "./elements/axis.js";
import { RhpTheme } from "./elements/theme.js";
import { RhpManyDots } from "./elements/many-dots.js";
import { RhpPoster } from "./elements/poster.js";
import { BLOCKS, RhpBlock, RhpBar, RhpDot, RhpTick, RhpLabel, RhpCell, RhpPlace, RhpArea, RhpLine } from "./elements/blocks.js";
// The named attribute forms (order="sortBy:sold:desc", ticks="every:10")
import "./helpers.js";

export * from "@bezda/rhp";
export { render } from "solid-js/web";
export { default as html } from "solid-js/html";
export { default as h } from "solid-js/h";
export { createSignal, createMemo, createEffect, createRoot, createSelector, createComputed, on, onMount, onCleanup, batch, untrack, mergeProps, splitProps, For, Index, Show, Switch, Match } from "solid-js";
export { createStore, reconcile, produce, unwrap } from "solid-js/store";

export { slat, RhpSlat } from "./slat.js";
export { restyle } from "@bezda/rhp";
export { RhpChart, RhpPlot, RhpScale, RhpAxis, RhpTheme, RhpManyDots, RhpPoster };
export { RhpBlock, RhpBar, RhpDot, RhpTick, RhpLabel, RhpCell, RhpPlace, RhpArea, RhpLine };

const ELEMENTS = [
  ["rhp-theme", RhpTheme],
  ["rhp-plot", RhpPlot],
  ["rhp-scale", RhpScale],
  ["rhp-axis", RhpAxis],
  ["rhp-many-dots", RhpManyDots],
  ...BLOCKS,
  ["rhp-chart", RhpChart],
  ["rhp-poster", RhpPoster],
];

// Defines the elements. rhp-theme comes first and the description elements before rhp-chart, so a chart that upgrades
// finds its themes and its plots upgraded (a chart reads its <rhp-theme> ancestors when it builds). It runs when this
// module is imported, and again does nothing: a name already defined is skipped.
export function define() {

  if (typeof customElements === "undefined") return;
  for (const [tag, Class] of ELEMENTS) {
    if (!customElements.get(tag)) customElements.define(tag, Class);
  }
}

define();
