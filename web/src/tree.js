// A chart's description -> its Solid tree: Theme providers (from <rhp-theme> ancestors) around one Chart, whose children
// are the description elements and other nodes in DOM order, mapped with <For> by identity (adding, removing or moving
// one adds, disposes or moves one subtree).
import { createComponent, createMemo, untrack, For, mergeProps, ErrorBoundary, onCleanup } from "solid-js";
import { Chart, Plot, Theme } from "@bezda/rhp";
import { descriptionOf, report } from "./registry.js";
import { PLOT, PLOT_PROPS, LAYOUT } from "./coerce.js";
import { resolveSlat } from "./slat.js";

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// A plain copy of a store value, read through the store (so a memo reading it follows nested changes)
const plain = (v) => {
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).map((k) => [k, plain(v[k])]));
  return v;
};

// The layout overrides (thickness, inset, room, css) set on a description element, as plain values
export const layoutOf = (store) => {
  const layout = {};
  for (const key in LAYOUT) {
    if (store[key] !== undefined) layout[key] = plain(store[key]);
  }
  return layout;
};

const LIVE = Object.keys(PLOT).filter((k) => k !== "rows");

// A Plot's data groups: every key of its store that is not a setting or a layout override
export const columnsOf = (store) => Object.keys(store).filter((k) => !(k in PLOT) && !(k in LAYOUT) && !PLOT_PROPS.includes(k));

// rhp's Plot reads some props once, when it is made: its slat (and the slat's layout), the set of data group names,
// whether it has rows, key, static, keyboard and overlap. Those are its structural signature: when it changes, that
// Plot is made again. Everything else reaches it live through getters on the element's store.
export function plotNode(el) {

  const store = el.model.store;

  const signature = createMemo(() => {
    // An invalid template or an unknown slat is reported and this plot is not drawn (what was read so far is still
    // tracked, so fixing it draws the plot); a thrown error would stop the chart's tree from following its children
    let type;
    try {
      const source = el.source(); // { slat: tag | fn | undefined, overrides } from the template or .slat
      type = source.slat == null ? undefined : resolveSlat(source.slat, { ...source.overrides, ...layoutOf(store) });
    } catch (e) {
      report(e);
      type = undefined;
    }
    return [type, columnsOf(store).join("\n"), "rows" in store, store.key, store.static, store.keyboard, store.overlap];
  }, undefined, { equals: sameList });

  return createMemo(() => {
    const [type, cols, hasRows] = signature();
    if (!type) return undefined;
    // el.rendered (the .plot getter) is this Plot's element until the Plot is disposed
    const at = { rendered: null };
    onCleanup(() => {
      if (el.rendered === at.rendered) el.rendered = null;
    });
    const props = plotProps(el, at, type, cols ? cols.split("\n") : [], hasRows);
    // An error while the Plot is made or updated (a slat throwing) is reported, and only this plot is left out (until
    // what it is made from changes)
    return untrack(() => createComponent(ErrorBoundary, {
      fallback: (e) => {
        report(e);
        if (el.rendered === at.rendered) el.rendered = null;
        return undefined;
      },
      get children() {
        return createComponent(Plot, props);
      },
    }));
  });
}

function plotProps(el, at, type, cols, hasRows) {

  const store = el.model.store;
  const props = {
    children: type,
    ref: (e) => {
      el.rendered = at.rendered = e;
      untrack(() => store.ref)?.(e);
    },
  };
  const live = (key, get = () => store[key]) => Object.defineProperty(props, key, { enumerable: true, configurable: true, get });
  LIVE.forEach((key) => live(key));
  live("onLoop");
  // A static Plot draws its rows again only when a data group (or rows) is a new value, and the store reconciles a list
  // in place (the same proxy). So a static Plot reads the model's plain copy (model.whole), which is a new list whenever
  // a write changes it (and then every row is drawn again), and its rows read plain values, not the store's proxies
  // item by item. Whether the Plot is static is read once, as rhp's Plot reads it (its own static, else its chart's);
  // both are in what makes this Plot, or its Chart, again.
  const chart = el.closest("rhp-chart");
  const still = untrack(() => store.static ?? chart?.model?.store.static === true) === true;
  const model = el.model;
  const data = (key) => live(key, still ? () => model.whole(key) : undefined);
  if (hasRows) data("rows");
  cols.forEach(data);

  return props;
}

// The whole tree of one <rhp-chart>. items() is the chart's children (description elements and other nodes) in DOM
// order; themes are the <rhp-theme> ancestors, outermost first, each with a value() accessor.
export function chartTree(host, items, themes = []) {

  const store = host.model.store;

  const content = () => createComponent(For, {
    get each() {
      return items();
    },
    children: (item) => {
      const build = descriptionOf(item);
      return build ? build(item) : item;
    },
  });

  // Chart reads `static` once (it is part of the context its Plots read once), so toggling it makes the Chart again
  const chart = () => createMemo(() => {
    store.static;
    return untrack(() => createComponent(Chart, mergeProps(store, {
      ref: (e) => {
        host.rendered = e;
        untrack(() => store.ref)?.(e);
      },
      get children() {
        return content();
      },
    })));
  });

  // Theme merges outer -> inner, so the outermost ancestor is the outermost provider
  const wrap = (i) => (i === themes.length ? chart() : createComponent(Theme, {
    get value() {
      return themes[i].value?.();
    },
    get children() {
      return wrap(i + 1);
    },
  }));

  return wrap(0);
}
