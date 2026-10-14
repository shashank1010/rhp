// The live model behind a description element: one Solid store holding its props (settings, layout and data groups).
// An attribute and a property can both give a prop; the property wins, and removing it (set to undefined) brings
// back the attribute's value. A write goes through reconcile, so a list with one new number notifies that one item only
// (rhp's Plot reads data groups item by item, which is what makes one bar move alone); a list where an object was (or
// the other way round) replaces it, and a block keeps a value from its row's store by reference (see refresh).
// Readers that take a value whole (a static Plot's data groups, ManyDots' rows, a block's props) read whole(key) instead:
// the model's own plain copy of it, a new one whenever a write changes it, with no store proxies to go through.
import { batch, createSignal, getListener, untrack } from "solid-js";
import { createStore, reconcile, $RAW } from "solid-js/store";
import { camel, coerce, reservedAttr } from "./coerce.js";

// A copy of the lists and plain objects in a value (what a store wraps and reconcile writes into); other values (Dates,
// class instances, functions) are kept as they are
const isPlain = (v) => {
  if (!v || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};
export function copy(v) {

  if (Array.isArray(v)) return v.map(copy);
  if (isPlain(v)) {
    const out = {};
    for (const k of Object.keys(v)) out[k] = copy(v[k]);
    return out;
  }

  return v;
}

// copy(v), reusing prev where they are equal (deeply): prev itself when nothing changed, else a new copy that keeps
// prev's lists and objects that did not change
export function copyOver(v, prev) {

  if (Array.isArray(v)) {
    const p = Array.isArray(prev) ? prev : undefined;
    let same = p !== undefined && p.length === v.length;
    const out = new Array(v.length);
    for (let i = 0; i < v.length; i++) {
      out[i] = copyOver(v[i], p?.[i]);
      if (same && !Object.is(out[i], p[i])) same = false;
    }
    return same ? p : out;
  }
  if (isPlain(v)) {
    const p = isPlain(prev) ? prev : undefined;
    const keys = Object.keys(v);
    let same = p !== undefined && Object.keys(p).length === keys.length;
    const out = {};
    for (const k of keys) {
      out[k] = copyOver(v[k], p?.[k]);
      if (same && !(k in p && Object.is(out[k], p[k]))) same = false;
    }
    return same ? p : out;
  }

  return v;
}

// setStore(key, fn) would call fn as an updater, so a function value is wrapped. Every value is copied: the store never
// holds (and reconcile never writes into) an array or object it was given, whether the caller's (a list changed in
// place and set again is seen, and a later set leaves the first list as it was) or an attribute's parsed value (which
// must stay as parsed, for when a property over it is removed).
const value = (v) => (typeof v === "function" ? () => v : reconcile(copy(v)));

// A list or an object the store wraps (and reconcile writes into)
const wrappable = (v) => Array.isArray(v) || isPlain(v);
// The raw object behind a Solid store value (a slat's d.pts is one: a list inside its plot's store), or undefined
const rawOf = (v) => (v && typeof v === "object" ? v[$RAW] : undefined);

export class Model {

  // schema: { prop: type } for known props; columns: other attributes are data groups (JSON); aria: aria-* attributes
  // are props; onKey(key): called the first time a prop gets a value, so the element can give it a property accessor;
  // link: a value that is itself in a Solid store (a block's points = d.pts, a list in its plot's store) is kept by
  // reference instead of copied, so what reads it follows that store's changes made in place
  constructor({ schema, columns = false, aria = false, onKey, link = false }) {
    this.schema = schema;
    this.columns = columns;
    this.aria = aria;
    this.onKey = onKey;
    this.link = link;
    this.linked = new Set(); // keys holding another store's value (never written into)
    // Each prop's value as a plain copy of the model's own, apart from the store's (reconcile writes into the store's,
    // never into these), and a signal per prop that a write changing that copy bumps (see whole)
    this.plain = new Map();
    this.versions = new Map();
    this.fromProp = new Map();
    this.fromAttr = new Map(); // prop -> [attribute name, value]
    const [store, setStore] = createStore({});
    this.store = store;
    this.setStore = setStore;
  }

  // The type an attribute is read as, or null when it is not a prop
  typeOf(name) {

    if (reservedAttr(name)) return null;
    if (name.startsWith("aria-")) return this.aria ? "string" : this.columns ? "json" : null;
    const key = camel(name);
    if (key in this.schema) return this.schema[key];

    return this.columns ? "json" : null;
  }

  refresh(key) {

    const v = this.fromProp.has(key) ? this.fromProp.get(key) : this.fromAttr.get(key)?.[1];
    const had = untrack(() => key in this.store);
    if (v === undefined) {
      this.linked.delete(key);
      const kept = this.plain.delete(key);
      batch(() => {
        if (had) this.setStore(key, undefined);
        if (kept) this.#bump(key);
      });
      return;
    }
    if (!had) this.onKey?.(key);
    const cur = had ? untrack(() => this.store[key]) : undefined;
    const raw = this.link ? rawOf(v) : undefined;
    if (raw !== undefined) {
      // Another store's value, by reference: the store wraps its raw object, whose nodes are that store's own (and so
      // is the plain value: what reads it whole reads that store)
      this.linked.add(key);
      if (rawOf(cur) === raw) return;
      batch(() => {
        // Set over nothing: setStore merges an object into the object there, which would write into it
        if (wrappable(cur)) this.setStore(key, undefined);
        this.setStore(key, () => v);
        this.#keep(key, v);
      });
      return;
    }
    // A value the store holds by reference (another store's), or a list where an object was (or the other way round):
    // replaced, not reconciled (reconcile would write into the other store's value, or merge an object's keys into a
    // list and keep its stale keys)
    const linked = this.linked.delete(key);
    // The plain copy, made now when something reads it (reusing the one before where nothing changed, unless that was
    // another store's value), else when something first does
    const next = !this.versions.has(key) ? undefined : typeof v === "function" ? v : copyOver(v, linked ? undefined : this.plain.get(key));
    if (linked || (wrappable(cur) && wrappable(v) && Array.isArray(cur) !== Array.isArray(v))) {
      batch(() => {
        this.setStore(key, undefined);
        this.setStore(key, value(v));
        this.#keep(key, next);
      });
      return;
    }
    batch(() => {
      this.setStore(key, value(v));
      this.#keep(key, next);
    });
  }

  // The plain value of key is now v (whoever reads it with whole(key) runs again, when it is a new one). Nothing has
  // read key yet when v is undefined: whole makes it, the first time it is read.
  #keep(key, v) {

    if (v === undefined) {
      this.plain.delete(key);
      return;
    }
    if (this.plain.get(key) === v) return;
    this.plain.set(key, v);
    this.#bump(key);
  }

  #version(key) {

    let s = this.versions.get(key);
    if (!s) this.versions.set(key, (s = createSignal(0, { equals: false })));

    return s;
  }

  // Runs again what read key whole (when anything did, tracked)
  #bump(key) {
    this.versions.get(key)?.[1](0);
  }

  // The prop's value read whole, tracked: the model's plain copy (a function, a Date or another store's value is the
  // value itself), the same one until a write changes it, and a new one then. It is the model's own and is never
  // written into, so it must not be changed by what reads it.
  whole(key) {

    // Only a tracked read makes the signal (an untracked one, a static Plot's row drawn once, needs none)
    if (getListener()) this.#version(key)[0]();
    if (!this.plain.has(key)) {
      // The first read: a copy of what the store holds (the raw value, as the last write left it)
      const v = untrack(() => this.store[key]);
      if (v === undefined) return undefined;
      this.plain.set(key, this.linked.has(key) ? v : copy(rawOf(v) ?? v));
    }

    return this.plain.get(key);
  }

  // One attribute, read again (the host's MutationObserver calls this with the attribute that changed)
  attribute(host, name) {

    const type = this.typeOf(name);
    if (type == null) return;
    const key = camel(name);
    const raw = host.getAttribute(name);
    if (raw == null) {
      if (this.fromAttr.get(key)?.[0] !== name) return;
      this.fromAttr.delete(key);
    } else {
      this.fromAttr.set(key, [name, coerce(type, raw)]);
    }
    this.refresh(key);
  }

  // Every attribute, read again (on connect and when a chart builds)
  attributes(host) {

    for (const [key, [name]] of [...this.fromAttr]) {
      if (!host.hasAttribute(name)) {
        this.fromAttr.delete(key);
        this.refresh(key);
      }
    }
    for (const a of host.attributes) {
      this.attribute(host, a.name);
    }
  }

  set(key, v) {

    if (v === undefined) this.fromProp.delete(key);
    else this.fromProp.set(key, v);
    this.refresh(key);
  }

  get(key) {
    return this.store[key];
  }

  // A plain object of what the store holds now (not tracked)
  snapshot(keys) {
    return untrack(() => Object.fromEntries(keys.map((k) => [k, this.store[k]])));
  }
}

// True when an object (or a prototype it has) has a setter for key
export function hasSetter(obj, key) {

  for (let o = obj; o; o = Object.getPrototypeOf(o)) {
    const d = Object.getOwnPropertyDescriptor(o, key);
    if (d) return typeof d.set === "function";
  }

  return false;
}

// Properties set on the element before it was upgraded (el.sold = [...] before define() ran, or a framework setting
// props early) are own data properties that hide the class's accessors. They move into the model: through the class's
// accessor when it has one, else take(key, value) when accept(key). Expandos of libraries (__reactProps$..., $$click)
// and anything not accepted are left alone.
export function adopt(host, accept, take) {

  for (const key of Object.keys(host)) {
    if (key[0] === "_" || key[0] === "$") continue;
    const setter = hasSetter(Object.getPrototypeOf(host), key);
    if (!setter && !accept(key)) continue;
    const v = host[key];
    delete host[key];
    if (setter) host[key] = v;
    else take(key, v);
  }
}

// A lazy property accessor on one element for a prop the class has no accessor for (a data group named by an
// attribute or by set()). Names the element already has (DOM properties like title or style) are left alone: those
// props are reached with set() and get().
export function defineAccessor(host, key, model) {

  if (key in host || Object.prototype.hasOwnProperty.call(host, key)) return;
  Object.defineProperty(host, key, {
    configurable: true,
    enumerable: false,
    get: () => model.get(key),
    set: (v) => model.set(key, v),
  });
}

// Accessors for known props on an element class's prototype (skipping names HTMLElement already has, like animate,
// role and style, which stay attributes or set()/get())
export function defineAccessors(proto, keys) {

  for (const key of keys) {
    if (key in HTMLElement.prototype || Object.prototype.hasOwnProperty.call(proto, key)) continue;
    Object.defineProperty(proto, key, {
      configurable: true,
      get() {
        return this.model.get(key);
      },
      set(v) {
        this.model.set(key, v);
      },
    });
  }
}
