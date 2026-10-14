// <rhp-bar> <rhp-dot> <rhp-tick> <rhp-label> <rhp-cell> <rhp-place> <rhp-area> <rhp-line>: rhp's blocks as custom
// elements, for slats that would rather name a tag than import a component:
//
//   slat("fruit-row", (d) => [h("rhp-bar", { to: () => d.sold }), h("rhp-label", { at: () => d.sold }, () => d.sold)]);
//
// A block element is a display: contents host that draws the Solid block inside itself, under the owner that was
// current when the element was made (a slat's fn runs inside its row's owner, so the block reads the chart's
// orientation and goes with the row). It draws on its first property set or when it is connected, whichever comes
// first, and once: later props reach the block through the element's store, as with the description elements. Made
// outside a slat (no owner), it reports an error and draws nothing.
//
// Props: each of the block's props as a property (values, shape() results, or () => value accessors, read inside the
// block so they stay live), and the scalar ones as attributes too. The host's child nodes become the block's children
// (a Label's text): nodes Solid or a script add to the host are moved into the block, and the block's children are
// replaced when the host's content is replaced (textContent, innerHTML).
//
// The Solid blocks (h(Bar, ...)) are the faster way to draw a slat: each element here is a store, a root and a host
// more per block.
//
// In a template with {bindings} (template.js), a block element is bound instead: the template gives it its props once,
// with bind(), and it has no store at all (its model is made only when something reads it).
import { createComponent, createRoot, createSignal, getOwner, onCleanup, runWithOwner, untrack } from "solid-js";
import { Bar, Dot, Tick, Label, Cell, Place, Area, Line } from "@bezda/rhp";
import { Model, adopt, defineAccessors } from "../model.js";
import { report } from "../registry.js";

// The schemas: attributes and their types (props that are scalars). Every block also takes class and style.
const COMMON = { class: "string", style: "style" };
const SCHEMAS = {
  bar: { from: "number", to: "number", thick: "number", color: "string" },
  dot: { at: "number", size: "number", across: "number", cross: "number", color: "string" },
  tick: { at: "number", thick: "number", color: "string" },
  label: { at: "number", side: "string", edge: "string", cross: "number" },
  cell: { value: "number", color: "string" },
  place: { at: "number", across: "number", cross: "number" },
  area: { points: "json", peak: "number", mirror: "bool", smooth: "bool", color: "string" },
  line: { points: "json", peak: "number", fill: "bool", base: "number", smooth: "bool", color: "string" },
};
// Props that are properties only (a shape() result, a ref function)
const PROPS = {
  bar: ["shape", "ref"],
  dot: ["shape", "ref"],
  tick: ["shape", "ref"],
  label: ["shape", "ref"],
  cell: ["shape", "ref"],
  place: ["ref"],
  area: ["ref"],
  line: ["ref"],
};

// The hosts take no box of their own: the block inside is laid out as if it were the slat's child. A sheet (not an
// inline style, which the host's style attribute would carry into the block), there before any block is made.
const HOST_CSS = "rhp-bar, rhp-dot, rhp-tick, rhp-label, rhp-cell, rhp-place, rhp-area, rhp-line { display: contents }";
let hostSheet = false;
function hostStyle() {

  if (hostSheet || typeof document === "undefined") return;
  hostSheet = true;
  if (Array.isArray(document.adoptedStyleSheets) && typeof CSSStyleSheet === "function" && "replaceSync" in CSSStyleSheet.prototype) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(HOST_CSS);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } else {
    const el = document.createElement("style");
    el.textContent = HOST_CSS;
    document.head.append(el);
  }
}
hostStyle();

const DRAW = Symbol("rhp-web.draw");
const TAKE = Symbol("rhp-web.take");

// A property set draws the block (the first time), and a prop the block was not made with (set("title", ...)) makes it
// again with that prop. A value from the row's store (h("rhp-line", { points: () => d.pts }) sets points to the list in
// the plot's store) is kept by reference: when its column changes, the plot's store is changed in place (the same list,
// so Solid sets no property again), and the block, reading that list, follows.
class BlockModel extends Model {

  constructor(host, schema) {
    super({ schema, link: true });
    this.host = host;
  }

  set(key, v) {
    if (this.host[BOUND]) {
      report(new Error(`rhp-web: this <${this.host.localName}> takes its props from its template (${key} was set): give the value to the template's binding instead, as a column or a helper`));
      return;
    }
    super.set(key, v);
    this.host[DRAW](key);
  }
}

// True while a template's row is cloned and its bindings found (template.js): the block elements in it are upgraded
// then, with the template's own attributes, and must not draw before bind() gives them their props
let instantiating = false;
export function whileInstantiating(fn) {

  const was = instantiating;
  instantiating = true;
  try {
    return fn();
  } finally {
    instantiating = was;
  }
}

// A prop set to an accessor (bar.to = () => d.sold) is read inside the block, so the block follows what it reads.
// Handlers and refs are functions the block calls itself.
const isHandler = (key) => key === "ref" || /^on[A-Za-z:]/.test(key);

// One observer for every host: what is added to a host moves into its block
let observer;
const watch = (host) => {
  observer ??= new MutationObserver((records) => {
    for (const host of new Set(records.map((r) => r.target))) host[TAKE]();
  });
  observer.observe(host, { childList: true });
};

const BOUND = Symbol("rhp-web.bound");

const NOT_DRAWN = 0;
const DRAWN = 1;
const REFUSED = 2;
const BIND = 3; // drawn by bind(), from a template

export class RhpBlock extends HTMLElement {

  // Set by each block class: the Solid block, its attribute schema, its property-only props, and whether it takes
  // children (true: always given; "seen": given once the host has child nodes; false: never)
  static block;
  static schema = COMMON;
  static props = ["ref"];
  static children = "seen";

  #owner;
  #model = null;
  #state = NOT_DRAWN;
  #adopted = false;
  #dispose = null;
  #gone = false; // the owner was disposed (a static Plot's row, once drawn)
  #node = null;
  #keys = null;
  #kids = null;
  #setKids = null;

  static get observedAttributes() {
    return Object.keys(this.schema);
  }

  constructor() {
    super();
    // The row's owner, when the element is made inside a slat's fn. Its cleanup is registered now, while the owner is
    // alive: a static Plot disposes the row's owner before the row is connected, and a cleanup added to an owner
    // already disposed would never run (the block drawn on connect would then outlive its row).
    this.#owner = getOwner();
    if (this.#owner) {
      runWithOwner(this.#owner, () => onCleanup(() => {
        this.#gone = true;
        this.#dispose?.();
        this.#dispose = null;
      }));
    }
  }

  // The element's store, made when it is first needed (a bound block never needs one). A getter on the class, so it is
  // not taken for a property set before the upgrade (see adopt).
  get model() {
    return (this.#model ??= new BlockModel(this, this.constructor.schema));
  }

  get [BOUND]() {
    return this.#state === BIND;
  }

  connectedCallback() {

    if (instantiating || this.#state === BIND) return;
    // Properties given before the element was upgraded go through its accessors, once
    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, () => false, () => {});
    }
    this.model.attributes(this);
    this[DRAW]();
    if (this.#state === DRAWN) this[TAKE]();
  }

  attributeChangedCallback(name) {
    if (instantiating || this.#state === BIND) return;
    this.model.attribute(this, name);
  }

  // Draws the block once with these props (an object of values and getters, which the block reads live) and children
  // (nodes, a Label's text), under the owner the element was made in. What a template gives: no store, no attributes
  // read, no child nodes watched.
  bind(props, children) {

    if (this.#state !== NOT_DRAWN) return;
    if (!this.#owner) {
      this.#state = REFUSED;
      report(new Error(outside(this.localName)));
      return;
    }
    this.#state = BIND;
    const Class = this.constructor;
    // A copy that keeps the getters (a spread would read them once)
    const all = Object.defineProperties({}, Object.getOwnPropertyDescriptors(props));
    if (Class.children && (Class.children === true || children?.length)) all.children = children ?? [];
    let node;
    runWithOwner(this.#owner, () => untrack(() => createRoot((dispose) => {
      this.#dispose = dispose;
      node = createComponent(Class.block, all);
    })));
    if (this.#gone) {
      this.#dispose();
      this.#dispose = null;
    }
    this.#node = node instanceof Node ? node : null;
    if (this.#node) this.insertBefore(this.#node, this.firstChild);
  }

  // Any prop by name, also those that are not attributes or properties (style, title, onClick, data-*): one the
  // block was not drawn with makes the block again
  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }

  // The rendered block (null until drawn)
  get block() {
    return this.#node;
  }

  // The host is display: contents, so it has no box of its own: measured, it is the block it draws (see the getters
  // after the class). Before it draws, it measures as itself (zero).
  getBoundingClientRect() {
    return this.#node?.getBoundingClientRect() ?? super.getBoundingClientRect();
  }

  getClientRects() {
    return this.#node?.getClientRects() ?? super.getClientRects();
  }

  [DRAW](key) {

    if (instantiating) return;
    if (this.#state === NOT_DRAWN) {
      this.#state = REFUSED;
      if (!this.#owner) {
        report(new Error(outside(this.localName)));
        return;
      }
      this.#state = DRAWN;
      this.#build();
      return;
    }
    if (this.#state === DRAWN && key !== undefined && !this.#keys.has(key) && untrack(() => key in this.model.store)) this.#build();
  }

  // Draws the block (again): one root under the row's owner, disposed with it
  #build() {

    const Class = this.constructor;
    const store = this.model.store;
    const old = this.#node;
    this.#dispose?.();
    this.#dispose = null;

    // Children: the host's nodes (and those of the block drawn before)
    if (Class.children) {
      const extra = [...this.childNodes].filter((n) => n !== old);
      if (this.#setKids) {
        if (extra.length) this.#setKids([...untrack(this.#kids), ...extra]);
      } else if (Class.children === true || extra.length) {
        [this.#kids, this.#setKids] = createSignal(extra);
      }
    }

    const keys = (this.#keys = new Set([...Object.keys(Class.schema), ...Class.props, ...untrack(() => Object.keys(store))]));
    const props = {};
    // A block reads its props whole, as the model's plain copies (a new one whenever a write changes it), not through
    // the store's proxies item by item: a Line or an Area reads all its points whenever one changes anyway, and in a
    // static Plot (whose rows give plain values) nothing follows them. A value from the row's store (linked) is read
    // through that store, which is what makes the block follow changes made in it in place.
    const model = this.model;
    for (const key of keys) {
      const handler = isHandler(key);
      Object.defineProperty(props, key, {
        enumerable: true,
        get: () => {
          const v = handler || model.linked.has(key) ? store[key] : model.whole(key);
          return !handler && typeof v === "function" && v.length === 0 ? v() : v;
        },
      });
    }
    const kids = this.#kids;
    if (kids) Object.defineProperty(props, "children", { enumerable: true, get: kids });

    let node;
    runWithOwner(this.#owner, () => untrack(() => createRoot((dispose) => {
      this.#dispose = dispose;
      node = createComponent(Class.block, props);
    })));
    if (this.#gone) {
      // Drawn again after its owner went: drawn once, as the owner's other blocks were
      this.#dispose();
      this.#dispose = null;
    }

    this.#node = node instanceof Node ? node : null;
    if (old && old !== this.#node) old.remove();
    if (this.#node) this.insertBefore(this.#node, this.firstChild);
    if (Class.children && this.#node) watch(this);
  }

  // The host's child nodes move into the block. When the block itself was taken out (the host's content replaced),
  // it comes back and the host's nodes are its children from now on.
  [TAKE]() {

    if (this.#state !== DRAWN || !this.#node || !this.constructor.children) return;
    const node = this.#node;
    const extra = [...this.childNodes].filter((n) => n !== node);
    const replaced = node.parentNode !== this;
    if (replaced) this.insertBefore(node, this.firstChild);
    if (!extra.length && !replaced) return;
    if (!this.#dispose) {
      // The block's owner is gone (a static Plot's row, disposed once drawn): the nodes move in as they are
      if (replaced) node.replaceChildren(...extra);
      else node.append(...extra);
      return;
    }
    if (!this.#setKids) {
      // The block was drawn with no children: drawn again with them
      if (extra.length) this.#build();
      return;
    }
    this.#setKids(replaced ? extra : [...untrack(this.#kids), ...extra]);
  }
}

// The size and offsets of a block element are its block's, as getBoundingClientRect is. A block drawn as an <svg> has no
// offset*, and those stay the host's own.
for (const name of ["offsetWidth", "offsetHeight", "offsetTop", "offsetLeft", "offsetParent", "clientWidth", "clientHeight", "clientTop", "clientLeft"]) {
  const own = Object.getOwnPropertyDescriptor(name.startsWith("client") ? Element.prototype : HTMLElement.prototype, name).get;
  Object.defineProperty(RhpBlock.prototype, name, {
    configurable: true,
    get() {
      const node = this.block;
      return node && name in node ? node[name] : own.call(this);
    },
  });
}

const outside = (tag) => `rhp-web: <${tag}> draws only inside a slat: make it in the slat's fn, like slat("my-row", (d) => h("${tag}", { ... })), so that it has the row's owner. This one was made outside any, and draws nothing.`;

const make = (name, block, children) => {
  const schema = { ...SCHEMAS[name], ...COMMON };
  const props = PROPS[name];
  const Class = class extends RhpBlock {
    static block = block;
    static schema = schema;
    static props = props;
    static children = children;
  };
  defineAccessors(Class.prototype, [...Object.keys(schema), ...props]);
  return Class;
};

// Labels and Places are made to hold content, so they always take children; the others once the host has some
export const RhpBar = make("bar", Bar, "seen");
export const RhpDot = make("dot", Dot, "seen");
export const RhpTick = make("tick", Tick, "seen");
export const RhpLabel = make("label", Label, true);
export const RhpCell = make("cell", Cell, "seen");
export const RhpPlace = make("place", Place, true);
// An Area's or a Line's svg has its own content
export const RhpArea = make("area", Area, false);
export const RhpLine = make("line", Line, false);

// For define() in index.js
export const BLOCKS = [
  ["rhp-bar", RhpBar],
  ["rhp-dot", RhpDot],
  ["rhp-tick", RhpTick],
  ["rhp-label", RhpLabel],
  ["rhp-cell", RhpCell],
  ["rhp-place", RhpPlace],
  ["rhp-area", RhpArea],
  ["rhp-line", RhpLine],
];
