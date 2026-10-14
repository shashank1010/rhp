// <rhp-many-dots>: a ManyDots scatter collection, described by attributes and properties (a hidden child of <rhp-chart>,
// which needs a cross scale). Properties take ManyDots' exact prop values (values or (row, index) => v accessors);
// attributes are the declarative subset: rows as JSON, at="x" / cross="y" / key="id" naming a row field, and the shared
// appearance (color, size, point-class, point-style, style, class), and role and aria-* for the collection's element.
// Any other prop given with set() (id, classList, data-*, on* handlers) reaches ManyDots, which puts it on that element.
// It draws nothing until rows, at and cross are set.
import { createComponent, createComputed, mergeProps, onCleanup, untrack, Show, ErrorBoundary } from "solid-js";
import { ManyDots } from "@bezda/rhp";
import { Model, adopt, defineAccessors } from "../model.js";
import { parseStyle } from "../coerce.js";
import { registerDescription, report } from "../registry.js";

// Attribute schema (keys are props; the attribute is the kebab-case form)
export const MANY_DOTS = {
  rows: "json",
  at: "json",
  cross: "json",
  key: "string",
  color: "json",
  size: "number",
  pointClass: "string",
  pointStyle: "json",
  class: "string",
  style: "style",
  role: "string",
};
// What it takes beyond its attributes (properties only)
export const MANY_DOTS_PROPS = ["shape", "ref"];

// A row field named by a string (at="x" -> (row) => row.x), a JSON list read by point index, any other value as it is
const field = (v) => (typeof v === "string" ? (row) => row?.[v] : perPoint(v));
const perPoint = (v) => (Array.isArray(v) ? (_, i) => v[i] : v);
// point-style as a CSS declaration list ("opacity: .5") or JSON; a list of styles is read by point index
const styleOf = (v) => (typeof v === "string" ? parseStyle(v) : perPoint(v));

// A plain read of a store value (tracks every nested change; only used while the collection is in error)
const deep = (v) => {
  if (Array.isArray(v)) v.forEach(deep);
  else if (v && typeof v === "object") Object.keys(v).forEach((k) => deep(v[k]));
};

// The page's nonce (rhp's own <style> takes it the same way: from the first style, link or script that has one). The
// page's document: a node cloned from a Solid template belongs to the template's inert document until it is inserted.
const pageNonce = () => document.querySelector("style[nonce], link[nonce], script[nonce]")?.nonce;

export function manyDotsNode(el) {

  const store = el.model.store;
  // Every prop given (set("aria-label", ...), set("onClick", ...), id, role, classList, data-*) reaches ManyDots, which
  // puts what it does not use itself on its element; the ones below are read from the element's forms first
  const own = {
    // ManyDots reads every row again whenever its rows change (it diffs the points itself), so it gets the model's
    // plain copy (a new list whenever a write changes it), not the store's proxies read item by item
    get rows() {
      return el.model.whole("rows");
    },
    get at() {
      return field(store.at);
    },
    get cross() {
      return field(store.cross);
    },
    get key() {
      return typeof store.key === "string" ? (row) => row?.[store.key] : store.key;
    },
    get color() {
      return perPoint(store.color);
    },
    get size() {
      return perPoint(store.size);
    },
    get shape() {
      return perPoint(store.shape);
    },
    get pointClass() {
      return perPoint(store.pointClass);
    },
    get pointStyle() {
      return styleOf(store.pointStyle);
    },
    get class() {
      return store.class;
    },
    get style() {
      return store.style;
    },
    ref: (e) => {
      el.rendered = e;
      // ManyDots' own <style> (the collection's defaults) takes the page's nonce before it is in the page, as rhp's
      // layer statement does, so that a nonce-based style-src allows it
      const sheet = e.querySelector("style[data-rhp-manydots]");
      const nonce = sheet && !sheet.nonce ? pageNonce() : undefined;
      if (nonce) sheet.nonce = nonce;
      untrack(() => store.ref)?.(e);
    },
  };
  const props = mergeProps(store, own);

  // ManyDots throws without rows, at and cross: until they are all set, nothing is drawn (and nothing reported)
  return createComponent(Show, {
    get when() {
      return store.rows != null && store.at !== undefined && store.cross !== undefined;
    },
    children: (_) => {
      // .dots is the rendered collection until it is disposed
      onCleanup(() => (el.rendered = null));
      return createComponent(ErrorBoundary, {
        // An error (a chart with no cross scale, keys that repeat) is reported, and only this collection is left out
        // until what it is drawn from changes: its own props, or the scales and orientation of its chart
        fallback: (e, reset) => {
          report(e);
          el.rendered = null;
          const chart = el.parentElement?.model?.store;
          let first = true;
          createComputed(() => {
            for (const k of Object.keys(store)) deep(store[k]);
            if (chart) deep([chart.scale, chart.cross, chart.orientation]);
            if (first) first = false;
            else reset();
          });
          return undefined;
        },
        get children() {
          return createComponent(ManyDots, props);
        },
      });
    },
  });
}

export class RhpManyDots extends HTMLElement {

  #adopted = false;

  constructor() {
    super();
    // Not enumerable, so they are not taken for properties set before the upgrade (see adopt)
    Object.defineProperty(this, "model", { value: new Model({ schema: MANY_DOTS, aria: true }) });
    Object.defineProperty(this, "rendered", { value: null, writable: true });
  }

  connectedCallback() {

    if (!this.hidden) this.hidden = true;
    // Properties given before it first connected (before the upgrade, or made with createElement and given properties)
    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, (key) => key in MANY_DOTS || MANY_DOTS_PROPS.includes(key), (key, v) => this.model.set(key, v));
    }
    this.model.attributes(this);
  }

  // Any prop by name (also style, which HTMLElement has). undefined removes what a property gave, and the attribute's
  // value (if any) comes back.
  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }

  // The rendered .rhp-manydots element (null until drawn)
  get dots() {
    return this.rendered;
  }
}

defineAccessors(RhpManyDots.prototype, [...Object.keys(MANY_DOTS), ...MANY_DOTS_PROPS]);

registerDescription("rhp-many-dots", manyDotsNode);
