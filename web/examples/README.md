# @shashank1010/rhp-web examples

A page of examples (`bar.html`) has one row of tabs, one per way of writing slats (the rows), and one or more examples, each one chart with its own editor and drawing:

- **Template** (`template.*`): slats as markup with `{path}` bindings, in a `<template>` or a `slat()` template string with helpers (`(d) => value`, for what is computed); no JS where the page needs none.
- **h** (`h.*`): `slat()` with a function that calls `h` (Solid's hyperscript).
- **html** (`html.*`): `slat()` with a function that returns an `html` tagged template (needs `'unsafe-eval'` under a Content-Security-Policy).

A tab switches every example on the page; every tab draws the same chart, pixel for pixel (the tests compare them), so the tabs compare like for like. Only csp's html tab differs, by design: the policy refuses it.

An example is a `<section class="example" data-name="bar/fruit">` on its page and a folder, `bar/fruit/`, where each piece of code lives once:

- `page.html`: the page, the same for every tab, with two regions: the chart, one `<rhp-chart>` (its elements, their data and settings), between `<!-- rhp:chart -->` and `<!-- /rhp:chart -->`, and the code every tab shares (a slat's settings and css, a `shape()`, ...) between `// rhp:slats` and `// /rhp:slats`.
- Where the tabs differ, a region has a named marker: `<!-- slat-template:scale -->` in the chart (where a slat goes, inside a `<rhp-plot>` or `<rhp-scale>`) and `// slat-template:row` in the code (the import, a slat's extra settings, its row). A name can mark more than one place.
- `<tab>.md` (`template.md`, `h.md`, `html.md`): only what the tab puts at the markers, of the chart and of the code alike, one part per name: a `## NAME` heading and a fenced code block (```` ```html ```` for the chart's, ```` ```js ```` for the code's), so each part reads and highlights as the code it is and nothing in it is escaped. For the chart, h and html put the slat's element, `<template><food-row></food-row></template>`; Template puts the row's markup with `{bindings}`, or the slat's element when its slat is a `slat()` template string in `slats.js`.
- What is the same on every tab is in the page, with no marker: a region with no marker left is the same on every tab, and no tab has a part for it (blocks' charts, for one, are the same on every tab; only their code differs).

The page (`shell.js`, `shell.css`) shows each example's two files together, `chart.html` above `slats.js`, each in a CodeMirror editor (`vendor/codemirror.js`) of its own: the page's two regions with the tab's parts at their markers (each line indented like its marker). A file the same on every tab is read-only ("same on every tab"), and `slats.js` is left out when it is only the import.
It draws beside them, in an iframe, `page.html` with its two regions replaced by the editor's text, 400 ms after the last edit.
"Changes vs base" (on at first) marks what the tab adds to each region as the page has it (with its markers taken out): exactly the tab's own lines are green, and a file the same on every tab has no marks.
Where a tab's markup needs an attribute on the chart's elements, the base has it on every tab, when it changes nothing for the others: the layout attributes (`thickness`, `inset`, `room`) scatter's Template tab needs on its `<rhp-scale>` are the ones the h and html slats set.
Edits are kept per tab while the page is open, Reset reloads the current tab's files in every example, and the tab is in the URL's hash (`bar.html#template`).
There are no pages of their own for each tab: `page.html` alone draws no chart.
`page.html` loads the package through an import map, so the examples run on the local build, a CDN, or an `npm link`ed package by changing one line (and, in the poster examples, the `<link>` to `posters.css`).

## Opening them

From a clone of rhp:

```sh
npm install                                           # in the repo root: esbuild, solid-js, React for the builds
cd web && npm run examples                            # examples/out/: rhp-web.js, posters.css, react.js
npx serve examples                                    # or: python3 -m http.server -d examples
```

Then open the server's root (http://localhost:3000/ for `serve`, http://localhost:8000/ for Python).
`npm run examples` builds the package from rhp's source straight into `examples/out/` (the same files `npm run build` makes in `dist/`), so the folder is self-contained and never loads a stale `dist/`. Run it again after a change in `web/src`.
Opening a page from disk (`file://`) does not work, since browsers do not load module scripts from files.

## Pointing the import map elsewhere

Each `page.html` has one import map:

```html
<script type="importmap">{ "imports": { "@shashank1010/rhp-web": "../out/rhp-web.js", "@shashank1010/rhp-web/posters.css": "../out/posters.css" } }</script>
```

- **A CDN**: `"@shashank1010/rhp-web": "https://cdn.jsdelivr.net/npm/@shashank1010/rhp-web/dist/rhp-web.js"` (once the package is published).
  An import map only resolves module imports, so a `<link rel="stylesheet">` does not go through it: in `poster/page.html`, also change the link's `href` to `https://cdn.jsdelivr.net/npm/@shashank1010/rhp-web/dist/posters.css`.
  The map's `@shashank1010/rhp-web/posters.css` entry is for a page that imports the looks as a CSS module script (`import looks from "@shashank1010/rhp-web/posters.css" with { type: "css" }`, then `document.adoptedStyleSheets = [...document.adoptedStyleSheets, looks]`); no page here does.
- **An `npm link`ed package** in your own app: `npm link @shashank1010/rhp-web` puts it in `node_modules`, and the map points at `/node_modules/@shashank1010/rhp-web/dist/rhp-web.js` on your dev server (run `npm run build` in `web/` first; [Development without a release](../README.md#development-without-a-release) has the steps). With a bundler, no import map is needed: `import { slat, h } from "@shashank1010/rhp-web"` resolves on its own.

## The examples

- `index.html`: the list, one line per example.
- `bar.html`: the README's bar chart (`bar/fruit`): `<rhp-chart>`, `<rhp-plot>` with JSON column attributes, `order="sortBy:pounds:desc"`, a tick slat on `<rhp-scale>`; and the same slat on other rows, thinner from the plot's template (`bar/veg`).
- `live.html`: data as properties (`plot.data`, then `plot.sold` every second), `animate`, `static` toggled by a button, `keyboard`.
- `scatter.html`: `<rhp-many-dots>` with field names, `key`, `color` and `size` accessors, `<rhp-scale>` with a tick slat and `<rhp-axis ticks="every:…">`.
- `blocks.html`: slats made of block elements (`blocks/cities`: `rhp-bar`, `rhp-label`, `rhp-tick`, `rhp-place`, an `<rhp-area>` and `<rhp-line>` sparkline per row, `shape()` as a property; `blocks/total`: `rhp-cell`, `rhp-dot`, and in the h tab a slat written as a class extending `RhpSlat`).
- `poster.html`: two `<rhp-poster>` looks from `posters.css`, each under an `<rhp-theme>`, with slotted parts: the medal table stacked by gold, silver and bronze (`poster/medals`), and Tokyo to Paris (`poster/change`).
- `csp.html`: the fruit chart under a strict Content-Security-Policy (a nonce, no `'unsafe-eval'`). Its h and Template tabs draw; its html tab shows the refusal, since `html` compiles code with `new Function`, which the policy forbids.
- `react.html` (`react.jsx`): React 19 rendering `<rhp-chart>` and `<rhp-plot>`, the chart following `useState`; the rows go in as one property, `data={{ name, sold }}` (see the comment at the top of `react.jsx` for why not `sold={...}`). One page, no tabs.

A tab that cannot write one part of its chart in its style draws the closest chart and says why in a comment at the top of its file.

rhp's `npm test` opens every tab of every example, and `react.html` (the "Web examples" checks in `test/run.mjs`).
