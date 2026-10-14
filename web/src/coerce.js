// Attribute values -> prop values. An attribute is a string; each element has a schema saying what its props take.
//   json     JSON when it parses (scale="[0, 30]", room='{"start": 80}'), else a number, else the string itself
//   number   a number ("24"), else as json ("4px" stays a string)
//   bool     present means true ("" or any value), except "false"
//   flag     bool when "" / "true" / "false", else as json (animate="" or animate='{"duration": 300}')
//   string   the string as it is
//   style    a CSS declaration list ("color: red; --x: 1") -> { color: "red", "--x": "1" } (rhp spreads style objects)
//   ratio    a number, or "16/9"
//   fn       as json, or a named helper form "name:arg:arg" (order="sortBy:sold:desc", ticks="every:10")

// kebab-case -> camelCase (cross-ticks -> crossTicks). Custom property names and aria-* stay as they are.
export const camel = (name) => (name.startsWith("aria-") || name.startsWith("--") ? name : name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()));

const NUMBER = /^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?\s*$/i;

export function json(raw) {

  if (NUMBER.test(raw)) return Number(raw);
  const t = raw.trim();
  if (t === "true" || t === "false" || t === "null" || /^[[{"]/.test(t)) {
    try {
      return JSON.parse(t);
    } catch {
      // not JSON: the string itself
    }
  }

  return raw;
}

// A CSS declaration list -> { name: value }. Declarations end at a ";" outside quotes, parentheses and comments (a
// data: URL in url(...) keeps its ";"), comments are dropped, and so is a trailing !important: rhp sets a style
// object's values with no priority (Solid's style.setProperty refuses a value that carries one), so the declaration
// applies as a normal one.
export function parseStyle(raw) {

  const out = {};
  for (const part of declarations(raw)) {
    const k = part.indexOf(":");
    if (k < 0) continue;
    const name = part.slice(0, k).trim();
    const value = part.slice(k + 1).replace(/\s*!\s*important\s*$/i, "").trim();
    if (name) out[name.startsWith("--") ? name : name.toLowerCase()] = value;
  }

  return out;
}

function declarations(raw) {

  const parts = [];
  let part = "";
  let quote = "";
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "\\") {
      // An escape keeps the next character as it is
      part += raw.slice(i, i + 2);
      i++;
    } else if (quote) {
      part += c;
      if (c === quote) quote = "";
    } else if (c === "/" && raw[i + 1] === "*") {
      const end = raw.indexOf("*/", i + 2);
      i = end < 0 ? raw.length : end + 1;
    } else if (c === ";" && depth === 0) {
      parts.push(part);
      part = "";
    } else {
      part += c;
      if (c === '"' || c === "'") quote = c;
      else if (c === "(") depth++;
      else if (c === ")" && depth > 0) depth--;
    }
  }
  parts.push(part);

  return parts;
}

// Named helper forms: name -> (args) => value. The helpers themselves (sortBy, every) are added by helpers.js; an
// attribute naming no known helper stays a string.
const named = new Map();
export const registerNamed = (name, make) => named.set(name, make);

function helper(raw) {

  const m = /^\s*([A-Za-z_$][\w$]*)\s*:(.*)$/.exec(raw);
  const make = m && named.get(m[1]);
  if (!make) return undefined;

  return { value: make(m[2].split(":").map((a) => json(a.trim()))) };
}

export function coerce(type, raw) {

  if (raw == null) return undefined;

  switch (type) {
    case "string":
      return raw;
    case "bool":
      return raw.trim() !== "false";
    case "flag": {
      const t = raw.trim();
      if (t === "" || t === "true") return true;
      if (t === "false") return false;
      return json(raw);
    }
    case "number":
      return NUMBER.test(raw) ? Number(raw) : json(raw);
    case "ratio": {
      const m = /^\s*([\d.]+)\s*\/\s*([\d.]+)\s*$/.exec(raw);
      return m ? Number(m[1]) / Number(m[2]) : json(raw);
    }
    case "style":
      return parseStyle(raw);
    case "fn": {
      const h = helper(raw);
      return h ? h.value : json(raw);
    }
    default:
      return json(raw);
  }
}

// The schemas. Keys are prop names (camelCase); the attribute is the kebab-case form.
export const CHART = {
  scale: "json",
  cross: "json",
  ticks: "fn",
  crossTicks: "fn",
  orientation: "string",
  height: "number",
  aspect: "ratio",
  animate: "flag",
  static: "bool",
  theme: "json",
  label: "string",
};
// role and aria-* attributes are the host's own, and not passed to the Chart: the host is in the accessibility tree
// itself, and the same role and name on the .rhp-chart inside it would make two nodes of one chart. label names the
// chart (the .rhp-chart is a figure); set("role", ...) and set("aria-...", ...) still reach the Chart.
// What a Chart takes beyond its attributes (properties only)
export const CHART_PROPS = ["format", "crossFormat", "ref"];

// A Plot's settings (they are never data groups)
export const PLOT = {
  order: "fn",
  reorder: "string",
  orientation: "string",
  overlap: "bool",
  slats: "number",
  key: "string",
  rows: "json",
  animate: "flag",
  thick: "number",
  static: "bool",
  keyboard: "bool",
  class: "string",
  style: "style",
};
export const PLOT_PROPS = ["ref", "onLoop"];
// The slat type's layout, overridden for one plot (on <rhp-plot> or on the slat element in its template)
export const LAYOUT = {
  thickness: "number",
  inset: "number",
  room: "json",
  css: "string",
};

// Attributes that are the element's own and never a prop or a data group
export const RESERVED = new Set(["hidden", "id", "slot", "part", "is", "tabindex", "inert", "popover", "exportparts"]);
export const reservedAttr = (name) => RESERVED.has(name) || name.startsWith("data-");
