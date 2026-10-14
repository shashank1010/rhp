// Reads an <rhp-chart>'s children into what its Solid tree maps: description elements (<rhp-plot> ...) and the other
// nodes a chart holds (a legend, an overlay), in DOM order. Description elements stay where they are, hidden; the
// other nodes are passed to Chart as children, which moves them into the rendered chart (as in a Solid chart).
import { isDescription } from "./registry.js";

// <rhp-theme> and <rhp-poster> are not description elements: inside an <rhp-chart> they are other nodes like any element
// (moved into the rendered chart). An <rhp-theme> themes the charts inside it, so one inside a chart does not theme
// that chart (put it around the chart, or give the chart its own theme attribute).
const SKIP = new Set(["TEMPLATE", "SCRIPT", "STYLE", "LINK"]);
const isOther = (n) => (n.nodeType === 1 ? !SKIP.has(n.tagName) : n.nodeType === 3 && n.data.trim() !== "");

// A description element is upgraded, hidden and has read its attributes before the chart reads it
export function prepare(el) {

  if (typeof customElements !== "undefined") customElements.upgrade(el);
  if (!el.hidden) el.hidden = true;
  el.model?.attributes(el);
}

// The host's own children that the chart takes, in DOM order (not what the chart rendered there itself)
export function scan(host, rendered) {

  const items = [];
  for (const n of host.childNodes) {
    if (n === rendered) continue;
    if (isDescription(n)) {
      prepare(n);
      items.push(n);
    } else if (isOther(n)) {
      items.push(n);
    }
  }

  return items;
}

// The children after the host's child list changed. Nodes the chart moved into its rendered tree are no longer the
// host's children but are still the chart's: they keep their place after the item that came before them.
export function merge(host, prev, rendered) {

  const items = scan(host, rendered);
  const now = new Set(items);
  for (let k = 0; k < prev.length; k++) {
    const n = prev[k];
    if (now.has(n) || isDescription(n) || !host.contains(n)) continue;
    let at = 0;
    for (let j = k - 1; j >= 0; j--) {
      const i = items.indexOf(prev[j]);
      if (i >= 0) {
        at = i + 1;
        break;
      }
    }
    items.splice(at, 0, n);
    now.add(n);
  }

  const same = items.length === prev.length && items.every((n, i) => n === prev[i]);

  return same ? prev : items;
}
