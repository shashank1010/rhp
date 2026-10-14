// <rhp-plot>: a Plot described by attributes and properties. Settings and layout overrides are known names; any other
// attribute is a data group (a JSON list, or one value for every row). Its slat is the one slat element in its
// <template> (with layout overrides as attributes), the template's markup with {bindings} (template.js), or the .slat
// property (a slat function or a tag).
import { createSignal, batch, untrack } from "solid-js";
import { Model, adopt, defineAccessor, defineAccessors } from "../model.js";
import { PLOT, PLOT_PROPS, LAYOUT } from "../coerce.js";
import { lookupSlat, registerDescription, waitForTag } from "../registry.js";
import { templateSource } from "../slat.js";
import { plotNode, columnsOf } from "../tree.js";

const NONE = { slat: undefined, overrides: {} };
const isColumn = (k) => !(k in PLOT) && !(k in LAYOUT) && !PLOT_PROPS.includes(k);

export class RhpPlot extends HTMLElement {

  #slat = undefined;
  #adopted = false;
  #version;
  #bump;

  constructor() {
    super();
    // Not enumerable, so they are not taken for properties set before the upgrade (see adopt)
    Object.defineProperty(this, "model", { value: new Model({ schema: { ...PLOT, ...LAYOUT }, columns: true, onKey: (key) => defineAccessor(this, key, this.model) }) });
    [this.#version, this.#bump] = createSignal(0, { equals: false });
    Object.defineProperty(this, "rendered", { value: null, writable: true });
  }

  connectedCallback() {

    if (!this.hidden) this.hidden = true;
    // Properties given before the plot first connected (before the upgrade, or made with createElement and given
    // properties) become its props, once: later expandos stay expandos (new columns go through set() or data)
    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, () => true, (key, v) => this.set(key, v));
    }
    this.model.attributes(this);
  }

  // What the plot draws: { slat: a tag or a slat function, overrides } (read in the chart's tree, so it is tracked)
  source() {

    this.#version();
    if (this.#slat != null) {
      // A slat tag defined by a script that runs later: the plot draws once it is defined, as with a template
      if (typeof this.#slat === "string" && !lookupSlat(this.#slat) && waitForTag(this.#slat, this)) return NONE;
      return { slat: this.#slat, overrides: {} };
    }

    return templateSource(this, "<rhp-plot>");
  }

  // The chart's MutationObserver calls this when the plot's children change (a <template> added or replaced).
  // A template's content is not observable: replace the <template> or set .slat to change the slat.
  childrenChanged() {
    this.#bump();
  }

  // A slat function (from slat() or rhp's slat()) or a slat element's tag; it replaces the template
  get slat() {
    return this.#slat;
  }

  set slat(v) {
    this.#slat = v ?? undefined;
    this.#bump();
  }

  // Any prop by name: a data group (plot.set("sold", [...])), a setting or a layout override. undefined removes what
  // a property gave, and the attribute's value (if any) comes back.
  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }

  // Every data group at once. Data groups given by property and missing from the object are removed.
  get data() {
    const store = this.model.store;
    return this.model.snapshot(untrack(() => columnsOf(store)));
  }

  set data(groups) {
    batch(() => {
      for (const key of [...this.model.fromProp.keys()]) {
        if (isColumn(key) && !(groups && key in groups)) this.model.set(key, undefined);
      }
      for (const key in groups) {
        this.model.set(key, groups[key]);
      }
    });
  }

  // The rendered .rhp-plot element (null until drawn)
  get plot() {
    return this.rendered;
  }
}

defineAccessors(RhpPlot.prototype, [...Object.keys(PLOT), ...Object.keys(LAYOUT), ...PLOT_PROPS]);

registerDescription("rhp-plot", plotNode);
