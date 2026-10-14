// slat(tag, settings, fn): a slat as a custom element. The element is the row's root (rhp's Plot stacks whatever
// element a slat returns), fn(d) gives its content, and settings.attrs(d) its own attributes. Behind it is one rhp slat
// type (rhp's slat(settings, rowFn)), so its CSS is one sheet shared by every chart that draws it.
import { untrack, createRenderEffect } from "solid-js";
import { insert, assign } from "solid-js/web";
import { slat as rhpSlat, restyle } from "@bezda/rhp";
import { IS_SLAT, registerSlat, lookupSlat, waitForTag } from "./registry.js";
import { camel, coerce, LAYOUT } from "./coerce.js";
import { compile, instantiate, templateType } from "./template.js";

const LAYOUT_KEYS = ["thickness", "inset", "room"];

// The row root is a custom element, and Solid sets a custom element's unknown props as properties (data-x would become
// el.dataX). attrs means attributes, so every key that is not a class, style, ref or event becomes attr:key.
const KEEP = /^(class|className|classList|style|ref|textContent|innerHTML|on[A-Za-z:].*|attr:.*|prop:.*|bool:.*)$/;
const asAttrs = (o) => {
  const out = {};
  for (const k in o) {
    out[KEEP.test(k) ? k : "attr:" + k] = o[k];
  }
  return out;
};

const APPLIED = Symbol("rhp-web.attrs");
function applyAttrs(el, attrs, d) {

  if (typeof attrs !== "function" || el[APPLIED]) return;
  el[APPLIED] = true;
  const prev = {};
  // One effect: attrs(d) runs again when what it reads changes, and only the values that changed are written
  createRenderEffect(() => {
    const next = asAttrs(attrs(d) ?? {});
    untrack(() => assign(el, next, false, true, prev, true));
  });
}

// What rhp's Plot calls for each row, synchronously inside the row's owner. The element's effects belong to the row
// and go with it (a static Plot disposes them right away, and the elements keep their values).
const rowFor = (tag) => (d) => {

  const el = document.createElement(tag);
  if (typeof el.draw !== "function") throw new Error(`rhp-web: <${tag}> is not a slat element (define it with slat() or a class extending RhpSlat)`);
  const out = untrack(() => el.draw(d));
  if (out !== undefined) insert(el, out);
  applyAttrs(el, el.constructor.attrs, d);

  return el;
};

// A key for a set of overrides that doesn't depend on the order of their keys
const stable = (v) => {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
  return JSON.stringify(v) ?? "undefined";
};
const defined = (o) => {
  const out = {};
  for (const k in o) {
    if (o[k] !== undefined) out[k] = o[k];
  }
  return out;
};
const empty = (o) => Object.keys(o).length === 0;

// Per slat class: its CSS and its rhp slat types (one per tag and set of overrides)
const classes = new WeakMap();
function own(Class) {

  let entry = classes.get(Class);
  if (entry) return entry;

  // A static css field (class Row extends RhpSlat { static css = "..." }) becomes an accessor, so that setting it later
  // restyles every slat of the class in place (rhp's restyle), wherever it is drawn
  entry = { css: Class.css, types: new Map() };
  classes.set(Class, entry);
  Object.defineProperty(Class, "css", {
    configurable: true,
    get: () => entry.css,
    set: (css) => {
      entry.css = css;
      for (const t of entry.types.values()) {
        if (t.overrides.css === undefined) restyle(t.type, css ?? "");
      }
    },
  });

  return entry;
}

// The rhp slat type for a slat class drawn as <tag>, with layout overrides (thickness, inset, room, css) or none.
// Cached, so a chart mounted again gets the same type (and the same sheet, which rhp counts its users of).
export function typeFor(Class, tag, overrides = {}) {

  const entry = own(Class);
  const o = defined(overrides);
  const key = tag.toLowerCase() + " " + stable(o);
  let t = entry.types.get(key);
  if (!t) {
    const layout = defined(Object.fromEntries(LAYOUT_KEYS.map((k) => [k, Class.layout?.[k]])));
    // Always with CSS (an empty string will do), so that setting Class.css can restyle it
    t = { type: rhpSlat({ ...layout, css: entry.css ?? "", ...o }, rowFor(tag)), overrides: o };
    entry.types.set(key, t);
  }

  return t.type;
}

// Types made from a slat function with overrides: fn -> (key -> type)
const derived = new WeakMap();

// What a plot draws: a registered slat tag or a slat function, with the plot's layout overrides
export function resolveSlat(source, overrides = {}) {

  const o = defined(overrides);
  if (typeof source === "string") {
    const Class = lookupSlat(source);
    if (!Class) throw new Error(`rhp-web: <${source.toLowerCase()}> is not a slat element. Define it with slat("${source.toLowerCase()}", settings, (d) => ...) before the chart draws.`);
    return typeFor(Class, source, o);
  }
  if (typeof source !== "function") return undefined;
  if (empty(o)) return source;

  let byKey = derived.get(source);
  if (!byKey) derived.set(source, (byKey = new Map()));
  const key = stable(o);
  if (!byKey.has(key)) byKey.set(key, rhpSlat({ ...source.layout, ...(source.css != null ? { css: source.css } : {}), ...o }, source));

  return byKey.get(key);
}

// The layout overrides written as attributes on an element (the slat element in a <template>, or <rhp-plot>)
export function overridesOf(el) {

  const o = {};
  for (const key in LAYOUT) {
    const raw = el.getAttribute(key);
    if (raw != null) o[camel(key)] = coerce(LAYOUT[key], raw);
  }

  return o;
}

const NONE = { slat: undefined, overrides: {} };
const blank = (el) => !el.firstElementChild && !el.textContent.trim();

// What the <template> of a description element (what: "<rhp-plot>" or "<rhp-scale>") draws: { slat, overrides }, where
// slat is a slat element's tag (a template holding just that element, with layout overrides as its attributes), or the
// slat type compiled from the template's markup (template.js), or undefined while there is nothing to draw yet. Throws
// what is wrong with the template.
export function templateSource(el, what) {

  const template = [...el.children].find((c) => c.localName === "template");
  if (!template) return NONE;

  const found = [...template.content.children];
  if (found.length === 0 && document.readyState === "loading") {
    // The template's content is still being parsed
    document.addEventListener("DOMContentLoaded", () => el.childrenChanged(), { once: true });
    return NONE;
  }
  const roots = found.filter((c) => c.localName !== "style");
  if (roots.length === 1) {
    const tag = roots[0].localName;
    if (lookupSlat(tag)) {
      if (found.length === 1 && blank(roots[0])) return { slat: tag, overrides: overridesOf(roots[0]) };
      throw new Error(`rhp-web: ${what} takes a <template> holding one slat element alone, like <template><${tag}></${tag}></template> (the slat element draws its own content), or markup with {bindings} whose root is not a slat element; this one has <${tag}> with content or a <style> next to it`);
    }
    // A slat defined by a script that runs later: the element draws once it is defined
    if (waitForTag(tag, el)) return NONE;
  }

  const where = `${what}${el.id ? ` id="${el.id}"` : ""}'s <template>`;

  return { slat: templateType(template, { where, what }), overrides: {} };
}

// The base class of slat elements. For a class written by hand:
//   class FruitRow extends RhpSlat {
//     static layout = { thickness: 32 };
//     static css = ".rhp-bar { opacity: .9 }";
//     static attrs = (d) => ({ class: "row" });
//     draw(d) { return [h(Label, { edge: "start" }, () => d.name), h(Bar, { to: () => d.sold })]; }
//   }
//   customElements.define("fruit-row", FruitRow);
// draw(d) runs once per row inside the row's owner and returns the row's content (anything Solid can insert).
// The constructor and connectedCallback do nothing: a row element is made by document.createElement, and the Plot
// moves it in the page.
export class RhpSlat extends HTMLElement {

  static [IS_SLAT] = true;

  draw() {
    return undefined;
  }
}

const made = new Map(); // tag -> { fn, settings } given to slat()

// Settings alike: the same values, functions by identity, objects and arrays (room, css, helpers) member by member
const alike = (a, b) => a === b || (a != null && b != null && typeof a === "object" && typeof b === "object" &&
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => alike(a[k], b[k])));

// slat(tag, settings?, fn): defines <tag> and returns its rhp slat type (a slat function that can also be given to a
// Plot in JS). settings: thickness, inset, room, css (as rhp's slat()), and attrs: (d) => ({ class, style, ... }).
// fn can be a template string instead (template.js), the element's content with {bindings}: settings.helpers are the
// names it binds besides the columns ({ tone: (d) => ... }). Defined again with the same fn (or the same
// string and the same settings), it is the same slat.
export function slat(tag, settings, fn) {

  if (typeof settings === "function" || typeof settings === "string") [settings, fn] = [{}, settings];
  settings ??= {};
  if (typeof tag !== "string" || !tag.includes("-")) throw new Error(`rhp-web: slat() needs a custom element name with a dash ("fruit-row"), got ${JSON.stringify(tag)}`);
  if (typeof fn !== "function" && typeof fn !== "string") throw new Error("rhp-web: slat(tag, settings, fn) needs fn, (d) => the row's content, or the row's content as a template string");
  tag = tag.toLowerCase();

  const existing = customElements.get(tag);
  if (existing) {
    const was = made.get(tag);
    if (was?.fn === fn) {
      // A template string is what its settings make of it: the same string with other helpers is another slat
      if (typeof fn !== "string" || alike(was.settings, settings)) return typeFor(existing, tag);
      throw new Error(`rhp-web: <${tag}> is already defined (with the same template and other settings)`);
    }
    throw new Error(`rhp-web: <${tag}> is already defined${typeof fn === "string" ? " (with another template)" : ""}`);
  }

  let compiled = null;
  if (typeof fn === "string") {
    const t = document.createElement("template");
    t.innerHTML = fn;
    compiled = compile(t, { helpers: settings.helpers, where: `slat("${tag}")`, root: false });
  }
  const { attrs } = settings;
  class Slat extends RhpSlat {
    static layout = defined(Object.fromEntries(LAYOUT_KEYS.map((k) => [k, settings[k]])));
    static attrs = attrs;
    draw(d) {
      // The element stays the row's root, and the template's clone is its content
      if (compiled) this.append(untrack(() => instantiate(compiled, d)));
      else insert(this, untrack(() => fn(d)));
      applyAttrs(this, attrs, d);
    }
  }
  // A <style> in the template adds to settings.css
  Slat.css = compiled?.css ? [settings.css, compiled.css].flat().filter((c) => c != null).join("\n") : settings.css;
  own(Slat);
  customElements.define(tag, Slat);
  registerSlat(tag, Slat);
  made.set(tag, { fn, settings });

  return typeFor(Slat, tag);
}
