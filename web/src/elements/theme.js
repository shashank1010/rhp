// <rhp-theme>: the theme of every <rhp-chart> below it, at any depth (a chart's own `theme` still wins, key by key, and
// nested themes merge outer -> inner). It is not a description element: it is not hidden, it draws nothing itself and
// its content stays as it is. Its keys come from a `value` attribute (JSON) or property, and from one attribute (or
// property) per theme key, which wins over the same key in `value`:
//
//   <rhp-theme ink="#222" series='["#0a7", "#e60"]'>
//     <rhp-chart ...>...</rhp-chart>
//   </rhp-theme>
//
// Each chart reads it through themeValue() (see themeChain in chart.js), which reads the element's store, so a chart
// follows its theme's changes. A chart is not this element's child, so the chart's MutationObserver does not see its
// attributes: they are observed here.
import { Model, adopt, defineAccessors } from "../model.js";

export const THEME_KEYS = {
  series: "json",
  positive: "string",
  negative: "string",
  ink: "string",
  muted: "string",
  grid: "string",
  surface: "string",
  low: "string",
  high: "string",
  font: "string",
};
export const THEME_SCHEMA = { value: "json", ...THEME_KEYS };

const isObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

// A plain copy of a store value, read through the store (so what reads it follows nested changes)
const plain = (v) => {
  if (Array.isArray(v)) return v.map(plain);
  if (isObject(v)) return Object.fromEntries(Object.keys(v).map((k) => [k, plain(v[k])]));
  return v;
};

export class RhpTheme extends HTMLElement {

  static observedAttributes = Object.keys(THEME_SCHEMA);

  #adopted = false;

  constructor() {
    super();
    // Not enumerable, so it is not taken for a property set before the upgrade (see adopt)
    Object.defineProperty(this, "model", { value: new Model({ schema: THEME_SCHEMA }) });
  }

  connectedCallback() {

    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, (key) => key in THEME_SCHEMA, (key, v) => this.model.set(key, v));
    }
    this.model.attributes(this);
  }

  attributeChangedCallback(name) {
    this.model.attribute(this, name);
  }

  // The theme keys this element gives: `value`'s, then each key's own (a plain object; tracked when read in a
  // computation, which is how the charts below it follow it)
  themeValue() {

    const store = this.model.store;
    const value = store.value;
    const out = isObject(value) ? plain(value) : {};
    for (const key in THEME_KEYS) {
      const v = store[key];
      // rhp's Chart goes through series as a list: anything else (series="#2a78d6") is left out
      if (v !== undefined && (key !== "series" || Array.isArray(v))) out[key] = plain(v);
    }
    if ("series" in out && !Array.isArray(out.series)) delete out.series;

    return out;
  }

  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }
}

defineAccessors(RhpTheme.prototype, Object.keys(THEME_SCHEMA));
