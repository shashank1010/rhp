// <rhp-scale>: a Scale (the Chart's scale drawn by a slat, one slat per tick) described by attributes and properties.
// Its slat is the one slat element in its <template> (with layout overrides as attributes), the template's markup with
// {bindings} (layout overrides as attributes of <rhp-scale>, thickness inset room css, as on <rhp-plot>), or the .slat property (a slat function or a tag), as for <rhp-plot>. Each tick's d has at, next, first, last and toEnd (px from the tick to the
// end of the scale, Infinity until the chart is measured).
//
//   slat("tick-row", (d) => h(Label, { at: () => d.at }, () => d.at));
//   <rhp-chart scale="[0, 30]">
//     <rhp-scale ticks="every:10"><template><tick-row></tick-row></template></rhp-scale>
//     <rhp-plot ...>...</rhp-plot>
//   </rhp-chart>
import { createSignal, createMemo, createComponent, untrack, ErrorBoundary, onCleanup } from "solid-js";
import { Scale } from "@bezda/rhp";
import { Model, adopt, defineAccessors } from "../model.js";
import { lookupSlat, registerDescription, report, waitForTag } from "../registry.js";
import { templateSource, resolveSlat } from "../slat.js";
import { LAYOUT } from "../coerce.js";
import { layoutOf } from "../tree.js";

// ticks="every:10" (or "every:5:ends") is a named form from helpers.js (imported here so this module works alone too)
import "../helpers.js";

export const SCALE = {
  ticks: "fn",
  class: "string",
  style: "style",
};
export const SCALE_PROPS = ["ref"];

const NONE = { slat: undefined, overrides: {} };

export class RhpScale extends HTMLElement {

  #slat = undefined;
  #adopted = false;
  #version;
  #bump;

  constructor() {
    super();
    // Not enumerable, so they are not taken for properties set before the upgrade (see adopt)
    Object.defineProperty(this, "model", { value: new Model({ schema: { ...SCALE, ...LAYOUT } }) });
    [this.#version, this.#bump] = createSignal(0, { equals: false });
    Object.defineProperty(this, "rendered", { value: null, writable: true });
  }

  connectedCallback() {

    if (!this.hidden) this.hidden = true;
    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, (key) => key in SCALE || SCALE_PROPS.includes(key), (key, v) => this.model.set(key, v));
    }
    this.model.attributes(this);
  }

  // What the scale draws: { slat: a tag or a slat function, overrides } (read in the chart's tree, so it is tracked)
  source() {

    this.#version();
    if (this.#slat != null) {
      if (typeof this.#slat === "string" && !lookupSlat(this.#slat) && waitForTag(this.#slat, this)) return NONE;
      return { slat: this.#slat, overrides: {} };
    }

    return templateSource(this, "<rhp-scale>");
  }

  // The chart's MutationObserver calls this when the scale's children change (a <template> added or replaced)
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

  // Any prop by name (also style, which HTMLElement has)
  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }

  // The rendered .rhp-scale element (null until drawn)
  get plot() {
    return this.rendered;
  }
}

defineAccessors(RhpScale.prototype, [...Object.keys(SCALE), ...Object.keys(LAYOUT), ...SCALE_PROPS]);

// rhp's Scale (a Plot) reads its slat once, when it is made: a new slat makes it again. ticks, class and style reach it
// live through getters on the element's store.
export function scaleNode(el) {

  const store = el.model.store;

  const type = createMemo(() => {
    try {
      const source = el.source();
      return source.slat == null ? undefined : resolveSlat(source.slat, { ...source.overrides, ...layoutOf(store) });
    } catch (e) {
      report(e);
      return undefined;
    }
  });

  return createMemo(() => {
    const children = type();
    if (!children) return undefined;
    const at = { rendered: null };
    onCleanup(() => {
      if (el.rendered === at.rendered) el.rendered = null;
    });
    const props = {
      children,
      get ticks() {
        return store.ticks;
      },
      get class() {
        return store.class;
      },
      get style() {
        return store.style;
      },
      ref: (e) => {
        el.rendered = at.rendered = e;
        untrack(() => store.ref)?.(e);
      },
    };
    return untrack(() => createComponent(ErrorBoundary, {
      fallback: (e) => {
        report(e);
        if (el.rendered === at.rendered) el.rendered = null;
        return undefined;
      },
      get children() {
        return createComponent(Scale, props);
      },
    }));
  });
}

registerDescription("rhp-scale", scaleNode);
