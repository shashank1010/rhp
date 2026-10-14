// <rhp-chart>: one Solid root per chart. Its description children (<rhp-plot> ...) stay in the light DOM, hidden, as the
// live model; the rendered .rhp-chart is appended after them. One MutationObserver keeps the chart in step with them.
import { createRoot, createSignal, batch, untrack, children as resolve } from "solid-js";
import { insert } from "solid-js/web";
import { Model, adopt, defineAccessors } from "../model.js";
import { CHART, CHART_PROPS } from "../coerce.js";
import { scan, merge } from "../describe.js";
import { chartTree } from "../tree.js";
import { isDescription, report } from "../registry.js";
import { oneSolid, TWO_SOLIDS } from "../check.js";

let domReady;
const contentLoaded = () => (domReady ??= new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true })));

// The <rhp-theme> ancestors, outermost first, each read through its value() (the rhp-theme element gives it as
// themeValue(); an ancestor without one gives no keys)
function themeChain(host) {

  const out = [];
  for (let t = host.parentElement?.closest("rhp-theme"); t; t = t.parentElement?.closest("rhp-theme")) {
    out.unshift(t);
  }

  return out;
}

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export class RhpChart extends HTMLElement {

  #dispose = null; // the root's dispose while the chart is drawn
  #scheduled = false;
  #leaving = false; // disconnected, and disposed in a microtask unless connected again
  #items = null;
  #setItems = null;
  #observer = null;
  #themes = [];
  #nodes = null;

  constructor() {
    super();
    // Not enumerable, so they are not taken for properties set before the upgrade (see adopt)
    // role and aria-* attributes stay the host's own (see CHART)
    Object.defineProperty(this, "model", { value: new Model({ schema: CHART }) });
    Object.defineProperty(this, "rendered", { value: null, writable: true });
  }

  connectedCallback() {

    this.#leaving = false;
    adopt(this, (key) => key in CHART || CHART_PROPS.includes(key), (key, v) => this.model.set(key, v));
    if (this.#dispose) {
      // Moved (into a Poster, another container): nothing to do, unless the Theme ancestors are not the same
      if (!sameList(themeChain(this), this.#themes)) {
        this.#teardown();
        this.#schedule();
      }
      return;
    }
    this.#schedule();
  }

  disconnectedCallback() {

    this.#leaving = true;
    queueMicrotask(() => {
      if (!this.#leaving || this.isConnected) return;
      this.#leaving = false;
      this.#teardown();
    });
  }

  // Never synchronously: a classic script in <head> upgrades the element at its start tag, before its children are
  // parsed, so a chart with no children yet in a loading document waits for DOMContentLoaded
  #schedule() {

    if (this.#scheduled) return;
    this.#scheduled = true;
    const go = () => queueMicrotask(() => {
      this.#scheduled = false;
      if (this.isConnected && !this.#dispose) this.#build();
    });
    if (document.readyState === "loading" && !this.firstChild) contentLoaded().then(go);
    else go();
  }

  #build() {

    if (!oneSolid()) {
      report(new Error(TWO_SOLIDS));
      return;
    }
    const themes = (this.#themes = themeChain(this));
    this.model.attributes(this);
    const first = scan(this, null);

    // The observer watches the children even when the chart could not be drawn, so that a fix draws it
    this.#observer?.disconnect();
    const observer = (this.#observer = new MutationObserver((records) => this.#changed(records)));
    observer.observe(this, { childList: true, attributes: true });
    for (const n of first) {
      if (isDescription(n)) observer.observe(n, { childList: true, attributes: true });
    }

    let dispose;
    try {
      createRoot((d) => {
        dispose = d;
        const [items, setItems] = createSignal(first);
        const nodes = resolve(() => chartTree(this, items, themes.map((t) => ({ value: () => t.themeValue?.() }))));
        insert(this, nodes, null); // appended after the description children, which stay
        this.#items = items;
        this.#setItems = setItems;
        this.#nodes = nodes;
        this.#dispose = dispose;
      });
      observer.takeRecords(); // the chart's own insertion
    } catch (e) {
      // An error the plots don't catch themselves: nothing is drawn, the root is let go, and the next change to the
      // chart or its description builds it again
      this.#dispose = this.#items = this.#setItems = this.#nodes = null;
      this.rendered = null;
      try {
        dispose?.();
      } catch {
        // already reported
      }
      // Nodes that were passed to Chart come back to the host, in their order
      let next = null;
      for (let k = first.length - 1; k >= 0; k--) {
        const n = first[k];
        if (n.parentNode !== this) this.insertBefore(n, next);
        next = n;
      }
      observer.takeRecords();
      report(e);
    }
  }

  #changed(records) {

    if (!this.#dispose) {
      // Not drawn (the last build failed): build again from the description as it is now
      if (this.isConnected) this.#schedule();
      return;
    }
    batch(() => {
      let list = false;
      for (const r of records) {
        if (r.type === "childList") {
          if (r.target === this) list = true;
          else r.target.childrenChanged?.(); // a description element's <template> replaced
        } else if (r.target === this) {
          this.model.attribute(this, r.attributeName);
        } else if (r.attributeName !== "hidden") {
          r.target.model?.attribute(r.target, r.attributeName);
        }
      }
      if (!list) return;
      const prev = untrack(this.#items);
      const next = merge(this, prev, this.rendered);
      if (next === prev) return;
      for (const n of next) {
        if (isDescription(n) && !prev.includes(n)) this.#observer.observe(n, { childList: true, attributes: true });
      }
      this.#setItems(next);
    });
  }

  #teardown() {

    this.#observer?.disconnect();
    this.#observer = null;
    if (!this.#dispose) return;
    const items = untrack(this.#items);
    const nodes = [untrack(this.#nodes)].flat().filter((n) => n instanceof Node);
    // Nodes passed to Chart as children come back to the host, so the chart can be drawn again from its children
    // (in their order among the description elements)
    let next = nodes.find((n) => n.parentNode === this) ?? null;
    for (let k = items.length - 1; k >= 0; k--) {
      const n = items[k];
      if (!isDescription(n) && n.parentNode !== this) this.insertBefore(n, next);
      if (n.parentNode === this) next = n;
    }
    this.#dispose();
    for (const n of nodes) {
      if (n.parentNode === this) n.remove();
    }
    this.#dispose = this.#observer = this.#items = this.#setItems = this.#nodes = null;
    this.rendered = null;
  }

  // The rendered .rhp-chart element (null until the chart is drawn)
  get chart() {
    return this.rendered;
  }

  // Any Chart prop by name (also those whose name is a property HTMLElement has, like animate and role)
  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }
}

defineAccessors(RhpChart.prototype, [...Object.keys(CHART), ...CHART_PROPS]);
