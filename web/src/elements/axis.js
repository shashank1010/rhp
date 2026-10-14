// <rhp-axis>: an Axis (grid lines and numbers at the given ticks) inside a chart, besides the chart's own axis.
// ticks is a JSON list (ticks="[0, 5, 10]"), a count of round values (ticks="4"), a named helper (ticks="every:5"), or
// as a property a list or a function of the chart's [min, max]; format is a property, (v) => text or a node.
//
//   <rhp-chart scale="[0, 10]" ticks="false"><rhp-axis ticks="[0, 5, 10]"></rhp-axis>...</rhp-chart>
import { createMemo, createComputed, createComponent, on, ErrorBoundary } from "solid-js";
import { Axis, nice } from "@bezda/rhp";
import { Model, adopt, defineAccessors } from "../model.js";
import { registerDescription, report } from "../registry.js";

// ticks="every:10" (or "every:5:ends") is a named form from helpers.js (imported here so this module works alone too)
import "../helpers.js";

export const AXIS = {
  ticks: "fn",
};
export const AXIS_PROPS = ["format"];

export class RhpAxis extends HTMLElement {

  #adopted = false;

  constructor() {
    super();
    // Not enumerable, so it is not taken for a property set before the upgrade (see adopt)
    Object.defineProperty(this, "model", { value: new Model({ schema: AXIS }) });
  }

  connectedCallback() {

    if (!this.hidden) this.hidden = true;
    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, (key) => key in AXIS || AXIS_PROPS.includes(key), (key, v) => this.model.set(key, v));
    }
    this.model.attributes(this);
  }

  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }
}

defineAccessors(RhpAxis.prototype, [...Object.keys(AXIS), ...AXIS_PROPS]);

// rhp's Axis takes a list of values. A function or a count is resolved against the chart's scale (its `scale`, or
// [0, 100] as Chart's default), read from the <rhp-chart> around, so changing the chart's scale moves the ticks too.
function tickList(t, domain) {

  if (t == null || t === false) return [];
  if (Array.isArray(t)) return t.filter((v) => typeof v === "number" && Number.isFinite(v));
  const [a, b] = domain();
  if (typeof t === "function") return [...(t([a, b]) ?? [])];
  if (typeof t === "number") return nice(a, b, t).ticks.filter((v) => v >= a - 1e-9 && v <= b + 1e-9);

  return [];
}

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function axisNode(el) {

  const store = el.model.store;
  const chart = el.closest("rhp-chart");
  const domain = () => {
    const s = chart?.model?.store.scale;
    return Array.isArray(s) && s.length === 2 ? [s[0], s[1]] : [0, 100];
  };
  // A ticks function that throws is reported and the axis draws no ticks (store.ticks is read before it is called, so
  // a new ticks draws them again); a thrown error would stop the chart's tree, or come out of the property's setter
  const ticks = createMemo(() => {
    try {
      return tickList(store.ticks, domain);
    } catch (e) {
      report(e);
      return [];
    }
  }, undefined, { equals: same });

  // An error while the Axis draws (a format that throws) is reported, and only this axis is left out until its format
  // or its ticks change
  return createComponent(ErrorBoundary, {
    fallback: (e, reset) => {
      report(e);
      createComputed(on([() => store.format, ticks], () => reset(), { defer: true }));
      return undefined;
    },
    get children() {
      return createComponent(Axis, {
        get ticks() {
          return ticks();
        },
        get format() {
          return store.format;
        },
      });
    },
  });
}

registerDescription("rhp-axis", axisNode);
