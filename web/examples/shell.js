// The page around the examples: one tab bar for the page, one tab per way of writing slats, and per example
// (<section class="example">) an editor with what the selected tab writes in its own way and the example drawn in an
// iframe from the editor's text. A section names its example's folder (data-name="bar/fruit"); the first section gives
// the tabs (data-variants) and the one the page opens on (data-default). An example's folder holds its page,
// page.html, the same for every tab, with two regions: the chart, between <!-- rhp:chart --> and <!-- /rhp:chart -->,
// and the code its tabs share, between // rhp:slats and // /rhp:slats. A region has a named marker where the tabs
// differ (<!-- slat-template:NAME -->, // slat-template:NAME), and each tab's one file, <variant>.md, fills them: a
// "## NAME" heading per marker, followed by a fenced code block with its part. What is the same on every tab is in the
// page itself, with no marker. The editor shows the two regions with the tab's parts in, chart.html above slats.js
// (a region with no marker read-only, and slats.js left out when it is only the import), marks what the tab adds to
// each (with its markers taken out), and the iframe draws the page with the editor's text in its regions.
import { EditorView, basicSetup, EditorState, Compartment, html, javascript, oneDark, unifiedMergeView } from "./vendor/codemirror.js";

const FILES = [
  { name: "chart.html", open: "<!-- rhp:chart -->", close: "<!-- /rhp:chart -->", lang: html },
  { name: "slats.js", open: "// rhp:slats", close: "// /rhp:slats", lang: javascript },
];
const LABELS = { template: "Template", h: "h", html: "html" };
const main = document.querySelector("main");
const sections = [...document.querySelectorAll("section.example")];
const variants = sections[0].dataset.variants.split(/\s+/);
const el = (tag, props) => Object.assign(document.createElement(tag), props);

// The page's bar, kept at the top: the tabs as segment buttons, "Changes vs base" for every example's editor, and
// Reset, which reloads the current tab's files in every example
const tabs = el("div", { className: "tabs" });
const segments = el("div", { className: "segments" });
segments.setAttribute("role", "tablist");
for (const v of variants) {
  const b = el("button", { type: "button", textContent: LABELS[v] ?? v, onclick: () => (location.hash = v) });
  b.setAttribute("role", "tab");
  b.dataset.variant = v;
  segments.append(b);
}
const diffBox = el("input", { type: "checkbox", checked: true });
const diffLabel = el("label", { className: "diff" });
diffLabel.append(diffBox, " Changes vs base");
diffBox.onchange = () => examples.forEach((x) => x.marks());
const reset = el("button", { type: "button", className: "reset", textContent: "Reset", title: "Reload this tab's files in every example and drop their edits" });
reset.onclick = () => examples.forEach((x) => x.reset());
tabs.append(segments, diffLabel, reset);
main.prepend(el("a", { href: "index.html", textContent: "All examples" }));
sections[0].before(tabs);

// The editor shows a part file as it is; dedented here too, in case one is indented
const dedent = (text) => {
  const lines = text.replace(/\s+$/, "").split("\n").map((l) => l.trimEnd());
  const min = Math.min(...lines.filter(Boolean).map((l) => /^ */.exec(l)[0].length));
  return lines.map((l) => l.slice(min)).join("\n") + "\n";
};
// A base file with a tab's parts at its markers, <!-- slat-template --> in chart.html and // slat-template in slats.js
// (or with a name, <!-- slat-template:NAME -->), each line indented like the marker: { "": text } for an unnamed
// marker, { NAME: text } for named ones (a name may mark several places); a marker with none is left out
const MARK = /^([ \t]*)(?:<!-- slat-template(?::([\w-]+))? -->|\/\/ slat-template(?::([\w-]+))?)[ \t]*$/;
const markOf = (m) => m[2] ?? m[3] ?? "";
const withTemplates = (base, templates) => base.split("\n").flatMap((l) => {
  const m = MARK.exec(l);
  if (!m) return [l];
  const t = templates[markOf(m)];
  return t ? t.replace(/\n$/, "").split("\n").map((x) => (x ? m[1] + x : x)) : [];
}).join("\n");
// A tab's <variant>.md as { NAME: text }: each "## NAME" heading and the fenced code block after it
const partsOf = (md) => Object.fromEntries([...md.matchAll(/^## ([\w-]+)\n```\w*\n([\s\S]*?)\n```$/gm)].map((m) => [m[1], m[2]]));

// One example: its editor, chart.html above slats.js, each in a pane of its own, and its
// iframe. Its rhpExample (on the section, and in window.rhpExamples) is { views, iframe, variant, ready }: views the
// two panes' editors, ready a promise for the load of its next render.
function example(section) {
  const folder = new URL(`${section.dataset.name}/`, location.href).href;
  const panes = el("div", { className: "panes" });
  const code = el("div", { className: "code" });
  // A pane per file: its name, and a note when it is the same on every tab (then read-only)
  const panesOf = FILES.map((f) => {
    const pane = el("div", { className: "file" });
    pane.dataset.file = f.name;
    const head = el("div", { className: "name" });
    const note = el("span", { className: "same", textContent: "same on every tab, read-only" });
    head.append(f.name, note);
    const holder = el("div", { className: "holder" });
    pane.append(head, holder);
    return { pane, note, holder };
  });
  code.append(...panesOf.map((x) => x.pane));
  const iframe = el("iframe", { title: `${section.querySelector("h2")?.textContent ?? "The example"}, drawn from the editor` });
  panes.append(code, iframe);
  section.append(panes);

  const get = async (f) => {
    const r = await fetch(folder + f, { cache: "no-cache" });
    return r.ok ? r.text() : `<!-- ${folder + f}: ${r.status} ${r.statusText} -->`;
  };
  const pageText = get("page.html");
  // A region of the page: the lines between its two markers
  const region = (page, f) => {
    const lines = page.split("\n"), o = lines.findIndex((l) => l.trim() === f.open), c = lines.findIndex((l) => l.trim() === f.close);
    return o < 0 || c < o ? "" : dedent(lines.slice(o + 1, c).join("\n"));
  };
  const baseChart = pageText.then((t) => region(t, FILES[0]));
  const baseSlats = pageText.then((t) => region(t, FILES[1]));
  const baseFiles = Promise.all([baseChart, baseSlats].map((b) => b.then((t) => withTemplates(t, {}))));
  // A file differs between tabs where its base has markers: the tab's <variant>.md fills them, and a part it leaves
  // out leaves its marker empty. A base with no markers is the file on every tab.
  const marked = (base) => base.split("\n").some((l) => MARK.test(l));
  const partsFor = async (v) => {
    const r = await fetch(`${folder}${v}.md`, { cache: "no-cache" });
    return r.ok ? partsOf(await r.text()) : {};
  };

  // The example's page with a tab's files in its regions, each indented like the region's markers. <base> makes the page's
  // relative paths (its import map, posters.css) resolve as from the example's folder.
  const compose = (page, parts) => {
    const lines = page.split("\n");
    FILES.map((f, k) => [lines.findIndex((l) => l.trim() === f.open), lines.findIndex((l) => l.trim() === f.close), parts[k]])
      .filter(([o, c]) => o >= 0 && c > o).sort((a, b) => b[0] - a[0])
      .forEach(([o, c, text]) => {
        const indent = /^\s*/.exec(lines[o])[0];
        lines.splice(o + 1, c - o - 1, ...text.replace(/\n$/, "").split("\n").map((l) => (l ? indent + l : l)));
      });
    const text = lines.join("\n"), base = `<base href="${folder}">`;
    return /<head[^>]*>/i.test(text) ? text.replace(/<head[^>]*>/i, (m) => m + base) : base + text;
  };

  // ready: a promise for the load of the next render, made when a render is first due (an edit, a tab, Reset); a load
  // while another render is due (an edit made as a tab drew) leaves it waiting for that one
  let timer, settle, due = false;
  const pending = () => {
    due = true;
    if (!settle) api.ready = new Promise((r) => (settle = r));
  };
  const render = async () => {
    clearTimeout(timer);
    pending();
    const page = shown, text = compose(await pageText, textsOf(page));
    if (page !== shown) return; // another tab was picked meanwhile, and renders itself
    due = false;
    iframe.srcdoc = text;
  };
  iframe.addEventListener("load", () => {
    // The iframe is as tall as its page, and follows it as the charts draw
    const root = iframe.contentDocument?.documentElement;
    if (root) new ResizeObserver(() => (iframe.style.height = Math.ceil(root.getBoundingClientRect().height) + "px")).observe(root);
    if (due) return;
    const s = settle;
    settle = undefined;
    s?.();
  });

  // A tab's files: one editor state per file, edits included, kept while the page is open. The diff compartment holds
  // a merge view against the base's file while "Changes vs base" is checked. A file the same on every tab is read-only.
  const diff = new Compartment();
  const diffFor = (page, k) => (diffBox.checked && page.differs[k] ? unifiedMergeView({ original: page.originals[k], mergeControls: false, gutter: true }) : []);
  const fixed = [EditorState.readOnly.of(true), EditorView.editable.of(false), EditorState.changeFilter.of(() => false)];
  const stateOf = (text, k, same) => EditorState.create({
    doc: text,
    extensions: [same ? fixed : [], basicSetup, FILES[k].lang(), oneDark, EditorView.lineWrapping, diff.of([]), EditorView.updateListener.of((u) => {
      if (!u.docChanged) return;
      pending();
      clearTimeout(timer);
      timer = setTimeout(render, 400);
    })],
  });
  const load = async (v) => {
    const [chart, slats] = await Promise.all([baseChart, baseSlats]);
    const parts = await partsFor(v);
    const texts = [chart, slats].map((b) => withTemplates(b, parts));
    // The chart always has its pane; slats.js has none when it holds nothing but whitespace and the package's import
    const has = [true, texts[1].replace(/import\b[^;]*;/g, "").trim() !== ""];
    const differs = [chart, slats].map(marked);
    return { variant: v, states: texts.map((t, k) => stateOf(t, k, !differs[k])), has, differs, originals: await baseFiles };
  };
  const textsOf = (page) => {
    sync();
    return page.states.map((s) => s.doc.toString());
  };

  const views = panesOf.map((x) => new EditorView({ parent: x.holder, state: EditorState.create({ doc: "" }) }));
  const pages = new Map();
  let shown = null; // the tab whose files are in the editors
  const sync = () => shown && views.forEach((v, k) => (shown.states[k] = v.state));
  const marks = () => views.forEach((v, k) => v.dispatch({ effects: diff.reconfigure(diffFor(shown, k)) }));
  const show = (page) => {
    shown = page;
    views.forEach((v, k) => {
      v.setState(page.states[k]);
      panesOf[k].pane.hidden = !page.has[k];
      panesOf[k].note.hidden = page.differs[k];
    });
    marks();
  };

  const api = {
    views, iframe, variant: null, ready: Promise.resolve(),
    marks: () => shown && marks(),
    async select(v) {
      if (v === api.variant) return;
      pending();
      api.variant = v;
      if (!pages.has(v)) pages.set(v, await load(v));
      if (api.variant !== v) return; // another tab was picked while this one loaded
      sync();
      show(pages.get(v));
      render();
    },
    async reset() {
      const v = api.variant;
      pending();
      const page = await load(v);
      if (api.variant !== v) return;
      pages.set(v, page);
      shown = null; // its edits are dropped, not kept
      show(page);
      render();
    },
  };
  section.rhpExample = api;
  return api;
}

const examples = (window.rhpExamples = sections.map(example));
const select = () => {
  const v = variants.includes(location.hash.slice(1)) ? location.hash.slice(1) : sections[0].dataset.default;
  for (const b of tabs.querySelectorAll("[role=tab]")) b.setAttribute("aria-selected", String(b.dataset.variant === v));
  // A section's notes on one tab's way of writing its slats (<div class="notes" data-variant="template">), shown on that tab
  for (const n of document.querySelectorAll("section.example .notes[data-variant]")) n.hidden = n.dataset.variant !== v;
  examples.forEach((x) => x.select(v));
};
addEventListener("hashchange", select);
select();
