// Slats written as markup with {bindings}: a template string given to slat(tag, settings, string), or the markup of a
// <template> inside <rhp-plot> or <rhp-scale>. A template is compiled once, and each row is a clone of it with its
// bindings found and bound.
//
//   <rhp-plot name='["Apples", "Bananas"]' sold="[12, 18]">
//     <template>
//       <style>.rhp-bar { opacity: .9 }</style>
//       <div><rhp-label edge="start">{name}</rhp-label><rhp-bar to="{sold}"></rhp-bar></div>
//     </template>
//   </rhp-plot>
//
// A binding is {path}, path = name(.name|[n])*: the first name is a helper of the slat (helpers[name](d)) when it has
// one, else the row's column (d[name], index and position included). It is a text (one text node of its own), a whole
// attribute (to="{sold}": the value as it is, a number stays a number) or part of one (class="row {tone}": a string).
// A {...} that is not a path is text like any other (a JSON attribute, room='{"start": 80}', stays as written): there is
// no JavaScript in a template, so a template needs no 'unsafe-eval'.
//
// Block elements (<rhp-bar> ...) take their attributes as the block's props, bound or static (coerced by the block's
// schema once, here), through bind(): no store per block. Other elements are written by one render effect per row for
// all their bindings, each written only when its value changes (class through className, style through the CSSOM, so a
// bound style="{...}" needs no 'unsafe-inline'; a style="..." written in the markup, a slat's template string or a
// page's <template>, is still reported by a strict style-src when the browser parses it, though it applies).
// on:click="{helper}" listens with helpers[name](event, d); every other on... attribute is refused (the browser would
// compile it). A <style> in the template is the slat's CSS, scoped to its rows.
//
// Errors are reported (registry.js report), in two tiers. When the template is compiled, once: what cannot be compiled
// is left out and the rest draws; only a template with no row root throws (its plot is then left out). When a row is
// drawn, a binding that throws (a helper) is reported once per template and keeps its last value, so
// one row cannot take its plot down.
import { createRenderEffect, untrack } from "solid-js";
import { style } from "solid-js/web";
import { slat as rhpSlat } from "@bezda/rhp";
import { camel, coerce, parseStyle } from "./coerce.js";
import { report } from "./registry.js";
import { BLOCKS, whileInstantiating } from "./elements/blocks.js";

const NAME = "[A-Za-z_$][\\w$]*";
const PATH = new RegExp(`^${NAME}(\\.${NAME}|\\[\\d+\\])*$`);
const HEAD = new RegExp(`^${NAME}`);
const STEP = new RegExp(`\\.(${NAME})|\\[(\\d+)\\]`, "g");
const HELPER = new RegExp(`^\\{(${NAME})\\}$`);
const BRACES = /\{([^{}]*)\}/g;

// Elements and text nodes, in document order: how a binding's node is found again in each clone (by its ordinal)
const SHOW = 0x1 | 0x4; // NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
const BLOCK = new Map(BLOCKS);
const IN_BLOCK = BLOCKS.map(([tag]) => tag).join(", ");
// The row root's attributes that its Plot sets
const ROOT_OWN = new Set(["hidden", "id", "role", "tabindex", "data-rhp-o", "data-rhp-slat"]);

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const text = (v) => (v == null ? "" : String(v));
const isSite = (p) => typeof p !== "string";

// A path as (d) => value. A name after one that gives null or undefined gives undefined.
function path(src, helpers) {

  const first = HEAD.exec(src)[0];
  const steps = [...src.slice(first.length).matchAll(STEP)].map((m) => m[1] ?? Number(m[2]));
  const head = own(helpers, first) ? (d) => helpers[first](d) : (d) => d[first];
  if (!steps.length) return head;

  return (d) => {
    let v = head(d);
    for (const s of steps) {
      if (v == null) return undefined;
      v = v[s];
    }
    return v;
  };
}

// What one template is compiled with: its helpers, and what was found wrong in it (reported once, together)
class Compiler {

  constructor(helpers) {
    this.helpers = helpers;
    this.errors = [];
  }

  // A text or an attribute value as parts: strings, and (d) => value for each {path}. null when it has none (it stays
  // as written).
  parts(src) {

    if (!src.includes("{")) return null;
    const out = [];
    let last = 0;
    for (const m of src.matchAll(BRACES)) {
      if (!PATH.test(m[1])) continue;
      if (m.index > last) out.push(src.slice(last, m.index));
      out.push(path(m[1], this.helpers));
      last = m.index + m[0].length;
    }
    if (!out.length) return null;
    if (last < src.length) out.push(src.slice(last));

    return out;
  }
}

// One value from parts: the binding's own value when it is the whole of it, else a string
function joined(parts) {

  if (parts.length === 1) return parts[0];

  return (d) => parts.map((p) => (typeof p === "string" ? p : text(p(d)))).join("");
}

// A bound style for a block: a string is parsed into declarations, as a static one is (a block given a string would
// replace its own inline style, the --rhp-from and --rhp-to that place it)
const styled = (get) => (d) => {
  const v = get(d);
  return typeof v === "string" ? parseStyle(v) : v;
};

// A block's prop name for an attribute: its own (camelCase) when the block has it, else the attribute's name
function propOf(Class, name) {

  const key = camel(name);

  return key in Class.schema || Class.props.includes(key) ? key : name;
}

// The template's content compiled: the content with its bindings taken out (each row is a clone of it), the CSS of its
// <style> elements, and its bindings by the ordinal of their node: sites (plain elements' text and attributes), blocks
// (block elements and their props) and events (on:type listeners).
//   helpers      { name: (d) => value }, from the slat's settings
//   where        what the template is, for the messages
//   root         the content is one element, the row's root (a declarative template); else it is the content of the
//                slat's own element (slat(tag, settings, string))
export function compile(template, { helpers, where = "a template", root = true } = {}) {

  helpers = helpers && typeof helpers === "object" ? helpers : {};
  const c = new Compiler(helpers);
  const errors = c.errors;
  const content = template.content.cloneNode(true); // in the template's own document: nothing is upgraded
  const doc = content.ownerDocument;

  // Never scanned for bindings: a <style> is the slat's CSS, a <script> is left out (a clone's would run)
  let css = "";
  for (const s of content.querySelectorAll("style")) {
    css += (css ? "\n" : "") + s.textContent;
    s.remove();
  }
  for (const s of content.querySelectorAll("script")) {
    errors.push("a <script> in a template is left out");
    s.remove();
  }

  if (!root) {
    // The blank text between the content's elements
    for (const n of [...content.childNodes]) {
      if (n.nodeType === 3 && !n.data.trim()) n.remove();
    }
  } else {
    for (const n of [...content.childNodes]) {
      if (n.nodeType === 1) continue;
      if (n.nodeType === 3 && n.data.trim()) errors.push(`the text "${n.data.trim()}" outside the row's root element is left out`);
      n.remove();
    }
    const n = content.children.length;
    const like = `a template holds one element, the row (like <template><div>{name}</div></template>), or one slat element (<template><fruit-row></fruit-row></template>)`;
    if (n !== 1) throw new Error(`rhp-web: ${where}: ${like}; this one holds ${n} elements`);
    const tag = content.firstElementChild.localName;
    if (BLOCK.has(tag)) throw new Error(`rhp-web: ${where}: a block element (<${tag}>) cannot be the row's root (its Plot would place it as the row); put it in an element, like <div><${tag} ...></${tag}></div>`);
  }

  const sites = [];
  const blocks = [];
  const events = [];
  const found = [];
  const walk = doc.createTreeWalker(content, SHOW);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) found.push(n);

  for (const n of found) {
    if (!content.contains(n)) continue; // inside a block element left out
    if (n.nodeType === 3) {
      const at = `the text "${n.data.trim()}" in <${n.parentNode.localName ?? "template"}>`;
      const parts = c.parts(n.data, at);
      if (!parts) continue;
      if (!parts.some(isSite)) {
        n.data = parts.join("");
        continue;
      }
      // One text node per part, so that a binding writes its own node only
      for (const p of parts) {
        const t = doc.createTextNode(typeof p === "string" ? p : "");
        n.before(t);
        if (isSite(p)) sites.push({ node: t, kind: "text", label: at, get: p });
      }
      n.remove();
      continue;
    }

    const tag = n.localName;
    const Class = BLOCK.get(tag);
    const outer = Class && n.parentElement?.closest(IN_BLOCK);
    if (outer) {
      errors.push(`<${tag}> is inside <${outer.localName}>, and a block element holds no other block: it is left out. (A custom element needs its end tag: <${outer.localName} ...></${outer.localName}>, not <${outer.localName} ... />.)`);
      n.remove();
      continue;
    }
    const isRoot = root && n.parentNode === content;
    const props = {};
    const bound = [];
    for (const { name, value } of [...n.attributes]) {
      const at = `${name}="${value}" on <${tag}>`;
      if (name.startsWith("on:")) {
        n.removeAttribute(name);
        const m = HELPER.exec(value);
        if (m && own(helpers, m[1]) && typeof helpers[m[1]] === "function") events.push({ node: n, type: name.slice(3), helper: m[1] });
        else errors.push(`${at}: an on: attribute names one of the slat's helpers, like on:click="{select}" with helpers: { select: (event, d) => ... }; it is left out`);
        continue;
      }
      // Every on... name, not only those of HTMLElement.prototype: browsers compile more (onfocusin, SVG's onbegin)
      if (/^on(?!:)/.test(name)) {
        n.removeAttribute(name);
        errors.push(`${at}: ${name} attributes are refused (the browser would compile their code, which a Content-Security-Policy forbids); write on:${name.slice(2)}="{helper}" with a helper of the slat; it is left out`);
        continue;
      }
      const parts = c.parts(value, at);
      const live = parts?.some(isSite);
      if (live && isRoot && ROOT_OWN.has(name)) {
        n.removeAttribute(name);
        errors.push(`${at}: the row's root takes no binding on ${name} (its Plot sets it); it is left out`);
        continue;
      }
      if (parts && !parts.length) {
        // Its only binding was left out
        n.removeAttribute(name);
        continue;
      }
      const raw = parts ? parts.filter((p) => !isSite(p)).join("") : value;
      if (Class) {
        n.removeAttribute(name);
        const key = propOf(Class, name);
        if (live) bound.push({ key, label: at, get: Class.schema[key] === "style" ? styled(joined(parts)) : joined(parts) });
        else props[key] = coerce(Class.schema[key] ?? "string", raw);
      } else if (live) {
        n.removeAttribute(name);
        sites.push({ node: n, kind: name === "class" ? "class" : name === "style" ? "style" : "attr", name, label: at, get: joined(parts) });
      } else if (name === "style") {
        // Through the CSSOM like a bound style, so that a page's style-src needs no 'unsafe-inline' for it
        n.removeAttribute(name);
        const v = parseStyle(raw);
        sites.push({ node: n, kind: "style", name, label: at, get: () => v });
      } else if (parts) {
        n.setAttribute(name, raw);
      }
    }
    if (Class) {
      // The blank text between a block's tags is not its content
      for (const k of [...n.childNodes]) {
        if (k.nodeType === 3 && !k.data.trim()) k.remove();
      }
      blocks.push({ node: n, props, bound });
    }
  }

  // Each binding's node by its ordinal, and the ordinals a clone has to find
  const index = new Map();
  let k = 0;
  const again = doc.createTreeWalker(content, SHOW);
  for (let n = again.nextNode(); n; n = again.nextNode()) index.set(n, k++);
  const ordinals = (list) => list.filter((s) => index.has(s.node)).map(({ node, ...s }) => ({ ...s, at: index.get(node) }));
  const out = { content, css, sites: ordinals(sites), blocks: ordinals(blocks), events: ordinals(events), helpers, where, root };
  out.need = [...new Set([...out.sites, ...out.blocks, ...out.events].map((s) => s.at))].sort((a, b) => a - b);

  if (errors.length) report(new Error(`rhp-web: ${where}: ${errors.join("; ")}`));

  return out;
}

const UNSET = {};

// A binding read for one row: its value, or (when it throws) its last one, the error reported once per template
function reader(compiled, site, d) {

  let last;

  return () => {
    try {
      return (last = site.get(d));
    } catch (e) {
      if (!site.failed) {
        site.failed = true;
        report(new Error(`rhp-web: ${compiled.where}: ${site.label} threw (${e?.message ?? e}); it keeps its last value (reported once, for every row)`, { cause: e }));
      }
      return last;
    }
  };
}

// Writes a plain element's binding; returns what the next write compares with (a style's declarations)
function write(site, node, v, prev) {

  switch (site.kind) {
    case "text":
      node.data = text(v);
      return undefined;
    case "class":
      if (node instanceof SVGElement) node.setAttribute("class", text(v));
      else node.className = text(v);
      return undefined;
    case "style":
      return style(node, typeof v === "string" ? parseStyle(v) : { ...v }, prev);
    default:
      if (v == null || v === false) node.removeAttribute(site.name);
      else node.setAttribute(site.name, v === true ? "" : String(v));
      return undefined;
  }
}

// One row: a clone of the compiled content with its bindings bound, inside the row's owner (Plot calls the slat there).
// document.importNode upgrades the clone's block elements before it returns, so they are made in the row's owner;
// every binding's node is found, in one walk, before bind() moves a block's children into its block. Returns the row's
// root (or, for a slat element's content, the fragment).
export function instantiate(compiled, d) {

  const { sites, blocks, events, need, helpers } = compiled;
  const nodes = [];
  const clone = whileInstantiating(() => {
    const frag = document.importNode(compiled.content, true);
    const walk = document.createTreeWalker(frag, SHOW);
    let j = 0;
    for (let n = walk.nextNode(), k = 0; n && j < need.length; n = walk.nextNode(), k++) {
      if (k === need[j]) {
        nodes[k] = n;
        j++;
      }
    }
    return frag;
  });

  if (sites.length) {
    const read = sites.map((s) => reader(compiled, s, d));
    const raw = sites.map(() => UNSET);
    const state = [];
    createRenderEffect(() => {
      for (let i = 0; i < sites.length; i++) {
        const v = read[i]();
        if (v === raw[i]) continue;
        raw[i] = v;
        state[i] = write(sites[i], nodes[sites[i].at], v, state[i]);
      }
    });
  }
  for (const e of events) {
    nodes[e.at].addEventListener(e.type, (event) => helpers[e.helper](event, d));
  }
  for (const b of blocks) {
    const host = nodes[b.at];
    const props = { ...b.props };
    for (const p of b.bound) {
      Object.defineProperty(props, p.key, { enumerable: true, get: reader(compiled, p, d) });
    }
    host.bind(props, [...host.childNodes]);
  }

  return compiled.root ? clone.firstElementChild : clone;
}

// Declarative templates (in <rhp-plot> and <rhp-scale>): one rhp slat type per markup, whatever element and
// chart it is in, so 50 charts with the same template share one type and one sheet. A <template> replaced is read
// again (its plot's source changes); the same markup finds its type here.
// ponytail: never emptied; a page making endless distinct templates keeps each one, an LRU if that ever happens.
const types = new Map();
//   where  the template, for what its compiling reports (once, with the element it was first read in)
//   what   "<rhp-plot>" or "<rhp-scale>", for what its rows report: any element with the same markup draws them
export function templateType(template, { where, what = "an element's" } = {}) {

  const key = template.innerHTML;
  let type = types.get(key);
  if (!type) {
    const compiled = compile(template, { where });
    compiled.where = `a ${what} template`;
    type = rhpSlat({ css: compiled.css }, (d) => untrack(() => instantiate(compiled, d)));
    types.set(key, type);
  }

  return type;
}
