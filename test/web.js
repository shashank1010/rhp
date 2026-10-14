// Charts as web components (web/src/index.js): slats written with Solid's h (no build step for the slats, CSP-safe),
// charts written as markup and set through attributes and properties
import { slat, h, Bar, Label, Line, shape, RhpChart } from "../web/src/index.js";

const T = (window.T = { readyAtDefine: document.readyState });

// A slat with its own CSS and attributes on its root (the custom element itself)
const FruitRow = slat("fruit-row", {
  thickness: 32,
  room: { start: 80, end: 40 },
  css: ".rhp-bar { opacity: .5 }",
  attrs: (d) => ({ class: "row", "data-fruit": d.name, "data-price": d.unitPrice, "data-extra": d.extra }),
}, (d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.sold }),
  h(Label, { at: () => d.sold }, () => d.sold),
]);
const PlainRow = slat("plain-row", (d) => h(Bar, { class: "plain", to: () => d.value }));
T.FruitRow = FruitRow;
T.PlainRow = PlainRow;
T.isChart = (el) => el instanceof RhpChart;
Object.assign(T, { slat, h, Bar });

const CHART = `<rhp-chart id="c1" scale="[0, 30]" cross-ticks="false" label="Fruit sold">
  <rhp-plot id="p1" name='["Apples", "Bananas", "Cherries"]' sold="[12, 18, 7]" unit-price="[1.5, 2, 3]">
    <template><fruit-row></fruit-row></template>
  </rhp-plot>
</rhp-chart>
<rhp-chart id="c2" orientation="vertical" scale="[0, 10]" height="120">
  <rhp-plot value="[2, 4, 8]"><template><plain-row thickness="20"></plain-row></template></rhp-plot>
</rhp-chart>`;

const $ = (sel) => document.querySelector(sel);
T.setSold = (v) => ($("#p1").sold = v);
T.setAttr = (sel, name, value) => (value == null ? $(sel).removeAttribute(name) : $(sel).setAttribute(name, value));
T.addPlot = () => {
  const p = document.createElement("rhp-plot");
  p.id = "p2";
  p.value = [5, 10, 15];
  p.slat = "plain-row";
  $("#c1").append(p);
};
T.removePlot = () => $("#p2").remove();
T.swapSlat = (v) => ($("#p1").slat = v === "fn" ? PlainRow : v);
T.hide = () => $("#c1").remove();

// Mounts and unmounts a chart n times, and reports what is left in the page
T.cycles = async (n) => {
  const box = document.body.appendChild(document.createElement("div"));
  const before = document.adoptedStyleSheets.length;
  const counts = [];
  for (let k = 0; k < n; k++) {
    box.innerHTML = `<rhp-chart scale="[0, 30]"><rhp-plot name='["A", "B"]' sold="[3, 4]"><template><fruit-row></fruit-row></template></rhp-plot></rhp-chart>`;
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
    counts.push(box.querySelectorAll("fruit-row").length);
    box.innerHTML = "";
    await Promise.resolve();
    await Promise.resolve();
  }
  box.remove();
  return { drawn: counts.every((c) => c === 2), added: document.adoptedStyleSheets.length - before };
};

const start = () => {
  const box = document.body.appendChild(document.createElement("div"));
  box.id = "box";
  box.innerHTML = CHART;
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else start();

// Scale, Axis and Theme (<rhp-scale>, <rhp-axis>, <rhp-theme>). Uses slat, h, Bar, Label, T and plain-row from above.
// A tick slat: its root carries the tick's d (toEnd is Infinity until the chart is measured)
slat("tick-row", { attrs: (d) => ({ "data-at": d.at, "data-next": d.next, "data-first": d.first, "data-last": d.last, "data-to-end": d.toEnd }) }, (d) => h(Label, { at: () => d.at }, () => d.at));
// A second tick slat, given as .slat (a slat function from slat())
T.TickDot = slat("tick-dot", (d) => h(Label, { at: () => d.at, class: "dot" }, () => "|" + d.at));
slat("theme-row", (d) => h(Bar, { to: () => d.value, color: "series-2" }));
const SAT = `<rhp-chart id="s1" scale="[0, 30]">
  <rhp-scale id="sc1" ticks="[0, 10, 20, 30]" class="my-scale"><template><tick-row></tick-row></template></rhp-scale>
  <rhp-plot value="[12, 18]"><template><plain-row></plain-row></template></rhp-plot>
</rhp-chart>
<rhp-chart id="a1" scale="[0, 10]" ticks="false">
  <rhp-axis id="ax1" ticks="[0, 5, 10]"></rhp-axis>
  <rhp-plot value="[2, 4]"><template><plain-row></plain-row></template></rhp-plot>
</rhp-chart>
<rhp-theme id="th1" ink="#112233" series='["#ff0000", "#00ff00"]'>
  <div><rhp-chart id="t1" scale="[0, 10]"><rhp-plot value="[3]"><template><theme-row></theme-row></template></rhp-plot></rhp-chart></div>
  <rhp-chart id="t2" scale="[0, 10]"><rhp-plot value="[5]"><template><theme-row></theme-row></template></rhp-plot></rhp-chart>
  <rhp-theme id="th2" value='{"muted": "#445566", "ink": "#000001"}' ink="#abcdef">
    <rhp-chart id="t3" scale="[0, 10]"><rhp-plot value="[7]"><template><theme-row></theme-row></template></rhp-plot></rhp-chart>
  </rhp-theme>
</rhp-theme>
<rhp-theme id="th3" value='{"ink": "#010203"}'></rhp-theme>`;

const q = (sel) => document.querySelector(sel);
const vars = (sel, ...names) => names.map((n) => q(sel + " > .rhp-chart")?.style.getPropertyValue("--rhp-" + n) ?? null);
// Each tick slat's [at, next, first, last, toEnd], and the scale's class
T.ticks = (sel = "#s1") => [...document.querySelectorAll(sel + " tick-row")].map((r) => [r.dataset.at, r.dataset.next, r.dataset.first, r.dataset.last, r.dataset.toEnd]);
T.scaleState = () => ({ cls: q("#s1 .rhp-scale")?.className ?? null, plot: q("#sc1")?.plot === q("#s1 .rhp-scale"), axes: document.querySelectorAll("#s1 .rhp-axis").length, hidden: q("#sc1")?.hidden ?? null });
// The numbers each axis of a chart draws
T.axisNumbers = (sel = "#a1") => [...document.querySelectorAll(sel + " .rhp-axis")].map((a) => [...a.querySelectorAll(".rhp-gridline > span")].map((s) => s.textContent).join(" "));
T.themeVars = (sel) => vars(sel, "ink", "series-1", "series-2", "muted");
T.barColor = (sel) => getComputedStyle(q(sel + " theme-row .rhp-bar")).backgroundColor;
T.themeEl = (sel) => ({ hidden: q(sel).hidden, children: q(sel).querySelectorAll(":scope > .rhp-chart").length, value: q(sel).themeValue() });
T.satAttr = (sel, name, value) => (value == null ? q(sel).removeAttribute(name) : q(sel).setAttribute(name, value));
T.satSet = (sel, key, value) => (q(sel)[key] = value);
T.moveChart = (sel, to) => q(to).appendChild(q(sel));

// Called by the checks (not on load), so the charts of the checks above are the only ones in the page until then
T.startSat = () => {
  const box = document.body.appendChild(document.createElement("div"));
  box.id = "sat";
  box.innerHTML = SAT;
};

// <rhp-many-dots>: ManyDots described by properties and attributes. Its charts are mounted on demand (T.md.mount()), in
// their own container, so the checks that count the page's charts are not affected.
{
  const T = window.T;
  const md = (T.md = {});
  const $ = (sel) => document.querySelector(sel);
  const wait = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
  md.rows = (n) => Array.from({ length: n }, (_, i) => ({ id: "r" + i, x: (i * 37) % 100, y: (i * 61) % 100, hot: i % 3 === 0 }));
  md.count = (sel) => document.querySelectorAll(sel + " .rhp-manydot").length;
  md.mount = async () => {
    const box = document.body.appendChild(document.createElement("div"));
    box.id = "mdbox";
    box.innerHTML = `<rhp-chart id="md1" scale="[0, 100]" cross="[0, 100]" height="200"><rhp-many-dots id="d1"></rhp-many-dots></rhp-chart>
      <rhp-chart id="md2" scale="[0, 10]" cross="[0, 10]" height="100">
        <rhp-many-dots id="d2" rows='[{"id": "a", "x": 2, "y": 3}, {"id": "b", "x": 5, "y": 6}, {"id": "c", "x": 8, "y": "oops"}]' at="x" cross="y" key="id" color="positive" size="6" point-class="pt" point-style="opacity: .5"></rhp-many-dots>
      </rhp-chart>
      <rhp-chart id="md3" scale="[0, 10]" cross="[0, 10]" height="100"><rhp-many-dots id="d3" rows='[{"x": 1, "y": 2}]' at="x"></rhp-many-dots></rhp-chart>`;
    const d1 = $("#d1");
    d1.rows = md.rows(1000);
    d1.at = (r) => r.x;
    d1.cross = (r) => r.y;
    d1.key = (r) => r.id;
    d1.color = (r) => (r.hot ? "positive" : "negative");
    await wait();
  };
  // New rows by property (a new array of new objects), and what that changed in the DOM: the points made (nodes
  // added that were not there before), the points gone, the points moved within the collection, and the points
  // whose style was written
  md.update = async (rows) => {
    const d1 = $("#d1");
    const coll = d1.dots, before = new Set(coll.querySelectorAll(".rhp-manydot"));
    const added = new Set(), removed = new Set(), styled = new Set();
    const mo = new MutationObserver((ms) => ms.forEach((m) => {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => added.add(n));
        m.removedNodes.forEach((n) => removed.add(n));
      } else styled.add(m.target.getAttribute("data-rhp-index"));
    }));
    mo.observe(coll, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    d1.rows = rows;
    await wait();
    mo.disconnect();
    const now = new Set(coll.querySelectorAll(".rhp-manydot"));
    return {
      count: now.size,
      sameCollection: d1.dots === coll,
      made: [...added].filter((n) => !before.has(n)).length,
      gone: [...removed].filter((n) => !now.has(n)).length,
      moved: [...added].filter((n) => before.has(n)).length,
      styled: [...styled],
    };
  };
  // One value changed (r500 moved to x = 1), then the first 10 rows removed
  md.moveOne = () => {
    const rows = md.rows(1000);
    rows[500].x = 1;
    return md.update(rows);
  };
  md.dropTen = () => {
    const rows = md.rows(1000).slice(10);
    rows[490].x = 1;
    return md.update(rows);
  };
  // A chart with no cross scale: the error is reported, and the collection draws once the chart has one
  md.noCross = async () => {
    $("#mdbox").insertAdjacentHTML("beforeend", `<rhp-chart id="md4" scale="[0, 10]" height="100"><rhp-many-dots id="d4" rows='[{"x": 1, "y": 2}]' at="x" cross="y"></rhp-many-dots></rhp-chart>`);
    await wait();
  };
  md.wait = wait;
}

// <rhp-poster>: rhp's Poster around charts, mounted on demand (T.ps.mount()) in its own container, so the checks that
// count the page's charts are not affected
{
  const T = window.T;
  const ps = (T.ps = {});
  const $ = (sel) => document.querySelector(sel);
  const wait = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
  const text = (el) => el?.textContent.trim().replace(/\s+/g, " ") ?? null;
  ps.mount = async () => {
    const box = document.body.appendChild(document.createElement("div"));
    box.id = "psbox";
    box.innerHTML = `<rhp-poster id="ps1" look="day" kicker="Fruit" title="Bananas lead" dek="Sold this week" note="Source: the shop">
        <rhp-chart id="psc" scale="[0, 30]"><rhp-plot id="psp" name='["Apples", "Bananas"]' sold="[12, 18]"><template><fruit-row></fruit-row></template></rhp-plot></rhp-chart>
      </rhp-poster>
      <rhp-poster id="ps2" title="ignored" kicker="K">
        <b slot="title" id="pst">Rich <i>title</i></b>
        <p id="psintro">Intro</p>
        <rhp-chart id="psc2" scale="[0, 10]"><rhp-plot value="[2, 4]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart>
        <span slot="note" id="psnote">A <a href="#">source</a></span>
      </rhp-poster>
      <rhp-chart id="psc3" scale="[0, 10]"><rhp-plot value="[7]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart>`;
    await wait();
  };
  // What a poster drew: the figure's class, its figcaption's parts, then each of the figure's children after the
  // figcaption (tag#id, or text), and the host's own element children
  ps.shape = (sel) => {
    const host = $(sel), fig = host.figure;
    if (!fig) return { figure: null, host: [...host.children].map((c) => c.localName + (c.id ? "#" + c.id : "")) };
    const cap = fig.querySelector(":scope > figcaption");
    return {
      figure: fig.className,
      parts: ["kicker", "headline", "dek"].map((k) => text(cap.querySelector(":scope > ." + k))),
      body: [...fig.childNodes].slice(1).filter((n) => n.nodeType === 1 || n.data.trim()).map((n) => (n.nodeType === 1 ? n.localName + (n.id ? "#" + n.id : "") + (n.className ? "." + n.className : "") : "text")),
      note: text(fig.querySelector(":scope > .note")),
      host: [...host.children].map((c) => c.localName),
    };
  };
  ps.bars = (sel) => [...document.querySelectorAll(sel + " .rhp-bar")].map((b) => b.style.getPropertyValue("--rhp-to")).join(" ");
}

// Blocks as web components (<rhp-bar> ... <rhp-line>, web/src/elements/blocks.js) and the named attribute forms
// (web/src/helpers.js). Nothing here is in the page until T.blocks() puts it there.

// The same rows drawn with block elements and with the Solid blocks: they must draw the same
slat("block-row", { thickness: 24, room: { start: 0, end: 40 } }, (d) => [
  h("rhp-bar", { to: () => d.value }),
  h("rhp-label", { at: () => d.value }, () => d.value),
]);
slat("solid-block-row", { thickness: 24, room: { start: 0, end: 40 } }, (d) => [
  h(Bar, { to: () => d.value }),
  h(Label, { at: () => d.value }, () => d.value),
]);
// Attributes (attr: sets the attribute itself), class, a shape() property and a CSS length; a Line, both ways
T.diamond = shape(["M", 0.5, 0], ["L", 1, 0.5], ["L", 0.5, 1], ["L", 0, 0.5], "Z");
slat("attr-row", (d) => [
  h("rhp-tick", { "attr:at": () => String(d.value), "attr:color": "negative", class: "t" }),
  h("rhp-dot", { at: () => d.value, shape: T.diamond, size: "14px" }),
  h("rhp-line", { class: "el", points: () => d.pts }),
  h(Line, { class: "solid", points: () => d.pts }),
]);
// Made with createElement and given an accessor as a property (read inside the block, so it stays live)
slat("accessor-row", (d) => {
  const el = document.createElement("rhp-bar");
  el.to = () => d.value * 2;
  return el;
});

const BLOCKS = `<div id="bx" style="width: 600px">
  <rhp-chart id="b1" scale="[0, 40]" ticks="every:5">
    <rhp-plot id="bp1" name='["a", "b", "c"]' value="[10, 25, 5]" order="sortBy:value:desc"><template><block-row></block-row></template></rhp-plot>
  </rhp-chart>
  <rhp-chart id="b2" scale="[0, 40]">
    <rhp-plot id="bp2" name='["a", "b", "c"]' value="[10, 25, 5]" order="sortBy:value:desc"><template><solid-block-row></solid-block-row></template></rhp-plot>
  </rhp-chart>
  <rhp-chart id="b3" scale="[0, 40]">
    <rhp-plot id="bp3" value="[10, 20]" pts="[[[0, 1], [20, 3], [40, 2]], [[0, 2], [10, 1], [30, 3]]]"><template><attr-row></attr-row></template></rhp-plot>
    <rhp-plot id="bp4" value="[3, 4]"><template><accessor-row></accessor-row></template></rhp-plot>
  </rhp-chart>
</div>`;

T.blocks = () => document.body.insertAdjacentHTML("beforeend", BLOCKS);
// Each block's box, relative to its chart, rounded to a tenth of a pixel
T.boxes = (sel) => {
  const chart = document.querySelector(sel + " .rhp-chart").getBoundingClientRect();
  return [...document.querySelectorAll(sel + " .rhp-bar, " + sel + " .rhp-label")].map((e) => {
    const r = e.getBoundingClientRect();
    return [e.className, ...[r.left - chart.left, r.top - chart.top, r.width, r.height].map((v) => Math.round(v * 10) / 10)];
  });
};
T.labels = (sel) => [...document.querySelectorAll(sel + " .rhp-label")].map((e) => e.textContent).join(" ");
T.setValues = (v) => { document.querySelector("#bp1").value = v; document.querySelector("#bp2").value = v; };
T.positions = (sel) => [...document.querySelectorAll(sel + " .rhp-plot > *")].map((r) => r.style.getPropertyValue("--rhp-position")).join(" ");
T.axisTicks = (sel) => [...document.querySelectorAll(sel + " .rhp-axis:not([data-rhp-cross]) .rhp-gridline")].map((g) => g.style.getPropertyValue("--rhp-at")).join(" ");
// A block element made outside any slat: reported, and nothing drawn
T.outside = () => {
  const el = document.createElement("rhp-bar");
  el.to = 5;
  document.body.append(el);
  el.to = 6;
  const out = [el.childNodes.length, el.block, el.to];
  el.remove();
  return out;
};

// Fixes after review: an element that throws or names an odd slot is reported or ignored, and a block element drawn
// first on connect in a static Plot is drawn once
{
  const T = window.T;
  const $ = (sel) => document.querySelector(sel);
  // <rhp-axis>: a ticks function and a format that throw
  T.badTicks = () => {
    throw new Error("bad ticks");
  };
  T.badFormat = () => {
    throw new Error("bad format");
  };
  // A chart whose <rhp-axis> is given a ticks function that throws before the chart builds
  T.axisEarly = () => {
    const c = document.createElement("rhp-chart");
    c.id = "a2";
    c.setAttribute("scale", "[0, 10]");
    c.setAttribute("ticks", "false");
    c.innerHTML = `<rhp-axis></rhp-axis><rhp-plot value="[2, 4]"><template><plain-row></plain-row></template></rhp-plot>`;
    c.querySelector("rhp-axis").ticks = T.badTicks;
    $("#sat").append(c);
  };
  T.rows = (sel) => document.querySelectorAll(sel + " .rhp-plot > *").length;
  // <rhp-poster>: children whose slot names a key of Object.prototype are the figure's, like any other
  T.ps.oddSlots = () => $("#psbox").insertAdjacentHTML("beforeend", `<rhp-poster id="ps4" title="T"><span slot="constructor">x</span><i slot="toString">y</i>
    <rhp-chart id="psc4" scale="[0, 10]"><rhp-plot value="[3]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart></rhp-poster>`);
  // A block element made with createElement and given only an attribute, so it first draws when it is connected, in a
  // static Plot (whose row owner is disposed before the row is connected)
  slat("static-tick-row", (d) => {
    const el = document.createElement("rhp-tick");
    el.setAttribute("at", String(d.value));
    return el;
  });
  T.staticTick = () => $("#bx").insertAdjacentHTML("beforeend", `<rhp-chart id="b4" scale="[0, 40]"><rhp-plot id="bp5" static value="[5]"><template><static-tick-row></static-tick-row></template></rhp-plot></rhp-chart>`);
}

// Fixes after the second review: block points from a column, a prop that switches between a list and an object, style
// declarations with ";" inside and !important, waiting for a slat tag that is never defined, ManyDots' other props and
// its <style> under a nonce, and the chart host's role and aria-* attributes
import { Area } from "../web/src/index.js";
import { parseStyle } from "../web/src/coerce.js";
{
  const T = window.T;
  const $ = (sel) => document.querySelector(sel);
  const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
  const settle = () => new Promise((r) => setTimeout(r, 400));
  const mount = (html) => {
    const box = document.body.appendChild(document.createElement("div"));
    box.innerHTML = html;
    return box;
  };

  // The same points drawn by <rhp-line>/<rhp-area> (written with h) and by the Solid Line and Area, in a Plot that is
  // not static: each pair's paths, and whether they are the same, after each change of the column
  slat("pts-row", (d) => [
    h("rhp-line", { class: "le", points: () => d.pts }),
    h(Line, { class: "ls", points: () => d.pts }),
    h("rhp-area", { class: "ae", points: () => d.pts }),
    h(Area, { class: "as", points: () => d.pts }),
  ]);
  T.livePoints = async () => {
    const box = mount(`<rhp-chart id="lp1" scale="[0, 10]"><rhp-plot id="lpp" pts="[[[0, 1], [5, 3], [10, 2]]]"><template><pts-row></pts-row></template></rhp-plot></rhp-chart>`);
    const paths = (cls) => [...$("#lp1 ." + cls).querySelectorAll("path")].map((p) => p.getAttribute("d")).join("|");
    const read = () => [paths("le") === paths("ls"), paths("ae") === paths("as"), paths("le").split("L").length];
    await frame(); await settle();
    const out = [read()];
    $("#lpp").pts = [[[0, 1], [5, 8], [10, 2]]]; await frame(); await settle(); out.push(read());
    $("#lpp").pts = [[[0, 1], [5, 8], [8, 4], [10, 2]]]; await frame(); await settle(); out.push(read());
    $("#lpp").setAttribute("pts", "[[[0, 5], [10, 5]]]"); $("#lpp").pts = undefined; await frame(); await settle(); out.push(read());
    box.remove();
    return out;
  };

  // A prop that switches between an object and a list (point-style, animate, room) holds the new value, not a merge
  T.typeSwitch = async () => {
    const box = mount(`<rhp-chart id="ts1" scale="[0, 10]" cross="[0, 10]" height="100">
        <rhp-many-dots id="tsd" rows='[{"x": 2, "y": 3}, {"x": 5, "y": 6}]' at="x" cross="y" point-style='{"opacity": "0.5"}'></rhp-many-dots>
      </rhp-chart>
      <rhp-chart id="ts2" scale="[0, 10]"><rhp-plot id="tsp" animate='["value"]' value="[1, 2]" room='{"start": 30}'><template><plain-row></plain-row></template></rhp-plot></rhp-chart>
      <rhp-chart id="ts3" scale="[0, 10]"><rhp-plot animate='{"duration": 300}' value="[1, 2]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart>`);
    await frame();
    const kind = (v) => [Array.isArray(v), Object.keys(v).join(",")];
    const ops = () => [...document.querySelectorAll("#ts1 .rhp-manydot")].map((e) => getComputedStyle(e).opacity).join(" ");
    const time = (sel) => $(sel + " .rhp-plot").style.getPropertyValue("--rhp-length-time");
    const d = $("#tsd"), p = $("#tsp"), out = [];
    d.setAttribute("point-style", '[{"opacity": "0.1"}, {"opacity": "0.9"}]'); await frame();
    out.push([ops(), kind(d.get("pointStyle"))]);
    d.setAttribute("point-style", '{"opacity": "0.3"}'); await frame();
    out.push([ops(), kind(d.get("pointStyle"))]);
    p.setAttribute("animate", '{"duration": 300}'); p.setAttribute("room", "[1, 2]"); await frame();
    out.push([kind(p.get("animate")), time("#ts2") === time("#ts3"), time("#ts2"), kind(p.get("room"))]);
    box.remove();
    return out;
  };

  // A style attribute with a data: URL (a ";" inside url(...)), a comment and !important, parsed and drawn
  T.parseStyle = parseStyle;
  T.styleAttr = async () => {
    const box = mount(`<rhp-chart id="sa1" scale="[0, 10]"><rhp-plot value="[1]" style="outline: 2px solid red !important; background-image: url('data:image/gif;base64,R0lGODlhAQABAAAAACw='); /* a; comment */ opacity: .5"><template><plain-row></plain-row></template></rhp-plot></rhp-chart>`);
    await frame(); await settle();
    // The element's own style (rhp's core rules, !important, decide what a .rhp-plot's outline and background show)
    const s = $("#sa1 .rhp-plot").style;
    const out = [s.outline, s.backgroundImage, s.opacity];
    box.remove();
    return out;
  };

  // Charts whose plot or scale wait for a slat tag that is never defined (a template, .slat, a scale's template),
  // mounted and removed n times; WeakRefs to each chart, plot and scale tell what is still in memory after a GC
  const refs = [];
  T.neverDefined = async (n) => {
    const box = document.body.appendChild(document.createElement("div"));
    for (let k = 0; k < n; k++) {
      box.innerHTML = `<rhp-chart scale="[0, 10]"><rhp-scale><template><never-tick-z></never-tick-z></template></rhp-scale>
        <rhp-plot value="[1]"><template><never-defined-x></never-defined-x></template></rhp-plot><rhp-plot value="[2]"></rhp-plot></rhp-chart>`;
      box.querySelectorAll("rhp-plot")[1].slat = "never-defined-y";
      await frame();
      for (const el of box.querySelectorAll("rhp-chart, rhp-plot, rhp-scale")) refs.push(new WeakRef(el));
      box.innerHTML = "";
      await frame();
    }
    box.remove();
    return refs.length;
  };
  T.alive = () => refs.filter((r) => r.deref()).length;
  // A chart that waits for a slat tag still draws once it is defined
  T.definedLater = async () => {
    const box = mount(`<rhp-chart id="dl1" scale="[0, 10]"><rhp-plot value="[3, 4]"><template><later-row></later-row></template></rhp-plot></rhp-chart>`);
    await frame();
    const out = [document.querySelectorAll("#dl1 later-row").length];
    slat("later-row", (d) => h(Bar, { class: "later", to: () => d.value }));
    await frame();
    out.push([...document.querySelectorAll("#dl1 .later")].map((b) => b.style.getPropertyValue("--rhp-to")).join(" "));
    box.remove();
    return out;
  };

  // <rhp-many-dots>: props it has no form for reach ManyDots' element (by set(), and role and aria-* as attributes)
  T.manyDotsProps = async () => {
    const box = mount(`<rhp-chart id="mp1" scale="[0, 10]" cross="[0, 10]" height="100">
      <rhp-many-dots id="mpd" rows='[{"x": 2, "y": 3}]' at="x" cross="y" aria-description="From the attribute"></rhp-many-dots></rhp-chart>`);
    await frame();
    const md = $("#mpd");
    let clicked = 0;
    md.set("aria-label", "Points");
    md.set("role", "list");
    md.set("classList", { hot: true });
    md.set("data-x", "1");
    md.set("onClick", () => clicked++);
    await frame();
    md.dots.click();
    const e = md.dots;
    const out = { ariaLabel: e.getAttribute("aria-label"), description: e.getAttribute("aria-description"), role: e.getAttribute("role"), hot: e.classList.contains("hot"), dataX: e.getAttribute("data-x"), clicked, dots: e.querySelectorAll(".rhp-manydot").length };
    md.set("aria-label", undefined); await frame();
    out.removed = e.getAttribute("aria-label");
    box.remove();
    return out;
  };

  // <rhp-chart role="img" aria-label="Sales">: the host keeps them, and the .rhp-chart inside does not repeat them;
  // label names the inner chart, and set() still reaches the Chart
  T.chartAria = async () => {
    mount(`<div id="ca"><rhp-chart id="ca1" role="img" aria-label="Sales" scale="[0, 10]"><rhp-plot value="[2]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart>
      <rhp-chart id="ca2" label="Fruit" scale="[0, 10]"><rhp-plot value="[2]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart></div>`);
    const c3 = document.createElement("rhp-chart");
    c3.id = "ca3";
    c3.setAttribute("scale", "[0, 10]");
    c3.set("role", "img");
    c3.set("aria-label", "By property");
    $("#ca").append(c3);
    await frame();
    const of = (sel) => { const c = $(sel + " > .rhp-chart"); return [c.getAttribute("role"), c.getAttribute("aria-label")]; };
    return [[$("#ca1").getAttribute("role"), $("#ca1").getAttribute("aria-label")], of("#ca1"), of("#ca2"), of("#ca3")];
  };
}

// Large data in a static chart: a 20,000-point line (drawn by Line and by <rhp-line>, written with h) reads the plot's
// column as plain values, not through its store item by item; it draws within a generous bound and draws again when the
// column is set again
{
  const T = window.T;
  const $ = (sel) => document.querySelector(sel);
  const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
  slat("big-row", (d) => [
    h(Line, { class: "bl", points: () => d.pts }),
    h("rhp-line", { class: "be", points: () => d.pts }),
  ]);
  T.bigStatic = async (n) => {
    const box = document.body.appendChild(document.createElement("div"));
    const line = (k) => Array.from({ length: n }, (_, i) => [i, Math.sin(i / 50) + (i === n >> 1 ? k : 0)]);
    const d = (cls) => $("#bs1 ." + cls)?.querySelector(".rhp-stroke")?.getAttribute("d") ?? "";
    const read = () => [d("bl").split("L").length, d("bl") === d("be")];
    box.innerHTML = `<rhp-chart id="bs1" static scale="[0, ${n - 1}]" cross="[-3, 3]" height="200"><rhp-plot overlap><template><big-row></big-row></template></rhp-plot></rhp-chart>`;
    const t0 = performance.now();
    $("#bs1 rhp-plot").set("pts", [line(0)]);
    await frame();
    const ms = performance.now() - t0;
    const first = d("bl");
    const out = [ms < 5000, read()];
    $("#bs1 rhp-plot").set("pts", [line(1.5)]);
    await frame();
    out.push(read(), d("bl") !== first);
    box.remove();
    return out;
  };
}

// Templates with {bindings} (web/src/template.js): a slat written as a template string, and <template> markup with no
// JS in <rhp-plot> and <rhp-scale>. Nothing here is in the page until a T.tpl function mounts it.
{
  const T = window.T;
  const tpl = (T.tpl = { picked: [] });
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
  const mount = (html) => {
    const box = document.body.appendChild(document.createElement("div"));
    box.innerHTML = html;
    return box;
  };
  const to = (el) => el?.style.getPropertyValue("--rhp-to") ?? null;

  // A template string with helpers: label is a helper and a column (the helper wins), tone a helper, pick an event
  const TPL_ROW = `
    <rhp-label edge="start">{label}</rhp-label>
    <rhp-bar to="{sold}" color="{tone}" class="tb">
    </rhp-bar>
    <rhp-label at="{sold}">{sold} kg</rhp-label>
    <span class="t-{tone} extra" data-sold="{sold}" data-first="{items[0]}" data-deep="{meta.size}" style="--w: {sold}px; color: red" on:click="{pick}">#{index}: {name} {not a path}</span>`;
  const TPL_SETTINGS = {
    thickness: 30,
    room: { start: 60, end: 40 },
    helpers: { tone: (d) => (d.sold > 15 ? "positive" : "muted"), label: (d) => d.name.toUpperCase(), pick: (e, d) => tpl.picked.push(d.name + ":" + e.type) },
  };
  tpl.type = slat("tpl-row", TPL_SETTINGS, TPL_ROW);
  // Defined again: the same string with the same settings (a copy of them) is the same slat; another string, or the
  // same string with other helpers, layout or css, throws
  tpl.redefine = () => {
    const same = slat("tpl-row", { ...TPL_SETTINGS, room: { ...TPL_SETTINGS.room }, helpers: { ...TPL_SETTINGS.helpers } }, TPL_ROW) === tpl.type;
    const thrown = (settings, string = TPL_ROW) => {
      try {
        slat("tpl-row", settings, string);
        return null;
      } catch (e) {
        return e.message;
      }
    };
    return [same, thrown(TPL_SETTINGS, TPL_ROW + "<b>{name}</b>"),
      ...[
        { ...TPL_SETTINGS, helpers: { ...TPL_SETTINGS.helpers, tone: () => "muted" } },
        { ...TPL_SETTINGS, room: { start: 60, end: 50 } },
        { ...TPL_SETTINGS, css: ".rhp-bar { opacity: .5 }" },
      ].map((s) => thrown(s))];
  };

  tpl.strings = async () => {
    mount(`<rhp-chart id="ts1" scale="[0, 30]"><rhp-plot id="tsp1" name='["Apples", "Bananas", "Cherries"]' label='["x", "y", "z"]' sold="[12, 18, 7]"
      items="[[1, 2], [3, 4], [5, 6]]" meta='[{"size": "s"}, {"size": "m"}, null]'><template><tpl-row></tpl-row></template></rhp-plot></rhp-chart>`);
    await frame();
    return tpl.read();
  };
  tpl.read = () => $$("#ts1 .rhp-plot > *").map((r) => {
    const s = r.querySelector("span");
    return [r.localName, $$("#ts1 .rhp-plot > *").indexOf(r), [...r.querySelectorAll(".rhp-label")].map((l) => l.textContent).join("|"), to(r.querySelector(".rhp-bar")),
      r.querySelector(".rhp-bar").style.getPropertyValue("--rhp-color"), r.querySelectorAll(".rhp-label")[1].style.getPropertyValue("--rhp-at"), s.className, s.dataset.sold, s.dataset.first, s.dataset.deep ?? null, s.style.getPropertyValue("--w"), s.style.color, s.textContent];
  });
  // One new number: the rows whose elements were written (style or text), and whether every element is the same one
  tpl.oneNumber = async () => {
    const before = $$("#ts1 .rhp-plot *");
    const seen = new Set();
    const mo = new MutationObserver((ms) => ms.forEach((m) => seen.add((m.target.nodeType === 1 ? m.target : m.target.parentNode).closest("tpl-row").querySelector("span").textContent.split(":")[1].trim().split(" ")[0])));
    $$("#ts1 tpl-row").forEach((r) => mo.observe(r, { attributes: true, subtree: true, characterData: true, childList: true }));
    $("#tsp1").sold = [12, 25, 7];
    await frame();
    mo.disconnect();
    const after = $$("#ts1 .rhp-plot *");
    return { same: before.length === after.length && before.every((e, i) => e === after[i]), rows: [...seen] };
  };
  tpl.click = () => {
    $$("#ts1 tpl-row span")[1].click();
    return tpl.picked;
  };
  // A bound block takes its props from the template: set() and a property are reported, and change nothing
  tpl.setBound = () => {
    const bar = $("#ts1 tpl-row rhp-bar");
    bar.set("to", 3);
    bar.to = 4;
    return to(bar.block);
  };

  // Declarative templates: no JS, a <style>, a <div> root, a JSON attribute left as written, beside a slat element plot
  const DECL = (id) => `<rhp-chart id="${id}" scale="[0, 30]"><rhp-plot name='["A", "B"]' sold="[12, 18]" tone='["muted", "positive"]'>
      <template>
        <style>.rhp-bar { opacity: .5 }</style>
        <div class="drow" data-cfg='{"a": 1}'>
          <rhp-label edge="start">{name}</rhp-label>
          <rhp-bar to="{sold}" color="{tone}"></rhp-bar>
        </div>
      </template>
    </rhp-plot><rhp-plot value="[3]"><template><plain-row></plain-row></template></rhp-plot></rhp-chart>`;
  tpl.declarative = async () => {
    mount(DECL("td1"));
    await frame();
    return $$("#td1 .drow").map((r) => [r.parentNode.className, !!r.dataset.rhpSlat, r.dataset.cfg, r.querySelector(".rhp-label").textContent, to(r.querySelector(".rhp-bar")),
      r.querySelector(".rhp-bar").style.getPropertyValue("--rhp-color"), getComputedStyle(r.querySelector(".rhp-bar")).opacity])
      .concat([getComputedStyle($("#td1 plain-row .rhp-bar")).opacity]);
  };
  // 50 charts with the same template: one slat type (one scope), one sheet more in the page
  tpl.fifty = async () => {
    const before = document.adoptedStyleSheets.length;
    const box = mount(Array.from({ length: 50 }, (_, i) => DECL("tf" + i)).join(""));
    await frame();
    const out = [$$("[id^=tf] .drow").length, new Set($$("[id^=tf] .drow").map((r) => r.dataset.rhpSlat)).size, document.adoptedStyleSheets.length - before];
    box.remove();
    return out;
  };

  // <rhp-scale> with a template (d is the tick), and a static plot whose compiled rows hold their values and are drawn
  // again when the data changes
  tpl.scaleAndStatic = async () => {
    mount(`<rhp-chart id="tk1" scale="[0, 20]">
      <rhp-scale ticks="[0, 10, 20]" room='{"after": 30}'><template><div class="tk" data-at="{at}" data-first="{first}"><rhp-label at="{at}">{at}</rhp-label></div></template></rhp-scale>
      <rhp-plot id="tkp" static value="[4, 8]"><template><div class="st"><rhp-bar to="{value}"></rhp-bar><span>{value}</span></div></template></rhp-plot>
    </rhp-chart>`);
    await frame();
    const read = () => $$("#tk1 .st").map((r) => to(r.querySelector(".rhp-bar")) + "/" + r.querySelector("span").textContent).join(" ");
    const out = [$$("#tk1 .tk").map((t) => [t.dataset.at, t.dataset.first, t.textContent]), read(), getComputedStyle($("#tk1 .rhp-chart")).paddingBottom];
    $("#tkp").value = [6, 2, 9];
    await frame();
    out.push(read());
    return out;
  };

  // Errors: what cannot be compiled is reported once and left out, and the rest draws
  slat("risky-row", { helpers: { risky: (d) => {
    if (d.index > 0) throw new Error("bad row");
    return d.value;
  } } }, `<rhp-bar to="{risky}"></rhp-bar><span class="r">{risky}</span><span class="v">{value}</span>`);
  tpl.errors = async () => {
    mount(`<rhp-chart id="te1" scale="[0, 30]">
      <rhp-plot id="te-two" value="[1]"><template><div></div><div></div></template></rhp-plot>
      <rhp-plot id="te-block" value="[2]"><template><rhp-bar to="{value}"></rhp-bar></template></rhp-plot>
      <rhp-plot id="te-bad" value="[3]"><template><div id="{value}" class="ok"><span onclick="alert(1)" on:click="{nope}">{value}</span><rhp-bar to="{value}"/><rhp-label>{value}</rhp-label></rhp-bar></div></template></rhp-plot>
      <rhp-plot id="te-risky" value="[4, 5, 6]"><template><risky-row></risky-row></template></rhp-plot>
    </rhp-chart>`);
    await frame();
    const bad = $("#te1 .ok");
    return [$$("#te1 .rhp-plot").length, bad && [bad.id, bad.querySelector("span").hasAttribute("onclick"), bad.querySelector("span").textContent, bad.querySelectorAll("rhp-bar").length, bad.querySelectorAll("rhp-label").length],
      $$("#te1 risky-row").map((r) => [to(r.querySelector(".rhp-bar")) ?? "", r.querySelector(".r").textContent, r.querySelector(".v").textContent])];
  };

  // A {...} that is not a path stays as written
  tpl.literal = async () => {
    mount(`<rhp-chart id="tx1" scale="[0, 30]">
      <rhp-plot value="[3, 12]"><template><div class="x"><span class="m">{value * 2}</span><span class="e">{Math.max(value, 10)} {value}</span></div></template></rhp-plot>
    </rhp-chart>`);
    await frame();
    return $$("#tx1 .x").map((r) => [r.querySelector(".m").textContent, r.querySelector(".e").textContent]);
  };
  // Fixes after the review: a bound or mixed style on a block is parsed (the block keeps --rhp-from and --rhp-to), the
  // row root takes no binding on tabindex
  // A block element (display: contents, no box of its own) measures as the block it draws
  tpl.measure = async () => {
    mount(`<rhp-chart id="tm1" scale="[0, 30]">
      <rhp-plot value="[12, 20]"><template><div class="mr"><rhp-label edge="start">{value}</rhp-label><rhp-bar to="{value}"></rhp-bar><rhp-dot at="{value}"></rhp-dot></div></template></rhp-plot>
    </rhp-chart>`);
    await frame();
    const KEYS = ["offsetWidth", "offsetHeight", "offsetTop", "offsetLeft", "clientWidth", "clientHeight", "clientTop", "clientLeft"];
    const rect = (r) => [r.x, r.y, r.width, r.height].join(",");
    return $$("#tm1 .mr rhp-label, #tm1 .mr rhp-bar, #tm1 .mr rhp-dot").map((el) => [
      el.localName,
      el.getBoundingClientRect().width > 0,
      rect(el.getBoundingClientRect()) === rect(el.block.getBoundingClientRect()),
      el.getClientRects().length === el.block.getClientRects().length,
      el.offsetParent === el.block.offsetParent,
      KEYS.every((k) => el[k] === el.block[k]),
    ].join(" "));
  };
  tpl.reviewFixes = async () => {
    mount(`<rhp-chart id="tr1" scale="[0, 30]">
      <rhp-plot id="trp" sold="[3, 4]" op="[0.3, 0.6]" st='["opacity: 0.2", "opacity: 0.4"]'><template><div class="rr" tabindex="{sold}">
        <rhp-bar class="mixed" to="{sold}" style="opacity: {op}"></rhp-bar><rhp-bar class="whole" to="{sold}" style="{st}"></rhp-bar>
      </div></template></rhp-plot>
    </rhp-chart>`);
    await frame();
    const read = () => $$("#tr1 .rr").map((r) => [r.getAttribute("tabindex"), ...[...r.querySelectorAll("rhp-bar")].map((b) => [b.block.style.getPropertyValue("--rhp-from"), to(b.block), getComputedStyle(b.block).opacity].join("/"))]);
    const out = [read()];
    $("#trp").op = [0.7, 0.8];
    await frame();
    out.push(read());
    return out;
  };

  // Templates never reach Function (counted with a stand-in while they compile and draw)
  tpl.noFunction = async () => {
    const F = globalThis.Function;
    let made = 0;
    globalThis.Function = new Proxy(F, { construct: (t, a) => (made++, Reflect.construct(t, a)), apply: (t, self, a) => (made++, Reflect.apply(t, self, a)) });
    try {
      mount(DECL("tn1").replace("{name}", "{name} again"));
      await frame();
      return [$$("#tn1 .drow").length, made];
    } finally {
      globalThis.Function = F;
    }
  };
}
