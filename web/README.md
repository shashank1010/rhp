# @shashank1010/rhp-web

[rhp](https://github.com/bezda-team/rhp) charts as web components: `<rhp-chart>`, `<rhp-plot>` and slat elements made with `slat()`.
A chart is markup; a slat, the template for one row, is a few lines of JS, or markup with `{bindings}`.
It runs in the browser only, with no shadow root: the chart is plain DOM inside `<rhp-chart>`.

## Install

`@shashank1010/rhp-web` is not on npm yet. Once it is, with a bundler, importing the package defines the elements:

```sh
npm install @shashank1010/rhp-web
```

```js
import { slat, h, Bar, Label } from "@shashank1010/rhp-web";
```

With no build step, one module holds Solid, rhp and the elements (`@shashank1010/rhp-web/standalone`, the file `dist/rhp-web.js`).
Loading it defines the elements, and importing from it gives the same exports:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@shashank1010/rhp-web/dist/rhp-web.js"></script>
```

Both export `slat`, `RhpSlat`, `h`, `define` and the element classes, and everything else `@bezda/rhp/standalone` exports (the blocks, the helpers, `html`, `render`, `createSignal`, the store), from the one Solid the elements use.
The one name that differs is `slat`: this package's `slat(tag, settings?, fn)` defines a slat element and replaces rhp's `slat(settings?, fn)`, which it does not export.

## Example

```html
<rhp-chart scale="[0, 30]">
  <rhp-plot name='["Apples", "Bananas", "Cherries"]' sold="[12, 18, 7]">
    <template><fruit-row></fruit-row></template>
  </rhp-plot>
</rhp-chart>

<script type="module">
  import { slat, h, Bar, Label } from "https://cdn.jsdelivr.net/npm/@shashank1010/rhp-web/dist/rhp-web.js";

  slat("fruit-row", { thickness: 32, room: { start: 80, end: 40 } }, (d) => [
    h(Label, { edge: "start" }, () => d.name),
    h(Bar, { to: () => d.sold }),
    h(Label, { at: () => d.sold }, () => d.sold),
  ]);
</script>
```

Each attribute of `<rhp-plot>` that is not a setting is a column of data, and each row reads its values as `d.name` and `d.sold`.
`<fruit-row>` is the row's own element: the Plot draws one per row and stacks them.
The slat can be defined before or after the markup; a plot waits for its slat element to be defined.

`document.querySelector("rhp-plot").sold = [12, 25, 7]` moves one bar and remakes nothing (`sold` is a column the plot already has; see [The elements](#the-elements) for new ones).

## Examples

[`examples/`](examples/) has a page per feature: the bar chart above, live data set as properties, a large scatter, slats made of block elements, posters and themes, a strict Content-Security-Policy, and React 19 rendering the elements.
Each page shows its slats written three ways, as tabs that switch every chart on the page: markup with `{path}` bindings, `h`, and `html`, each drawing the same chart; per chart, an editor holds the selected tab's chart markup and slats, marked where they add to what every tab shares, and the chart beside it redraws as you edit.
An example's page loads the package through an import map, so one line points it at the local build, a CDN or a linked package (plus the `<link>` to `posters.css` in the poster examples); [`examples/README.md`](examples/README.md) says how to open them.

## Writing a slat

A slat is written in one of three ways: a function of the row in JS, a template string with `{bindings}` given to `slat()`, or a `<template>` with `{bindings}` in the chart's markup, with no JS at all.

### A function

`slat(tag, settings?, fn)` defines `<tag>` and returns rhp's slat type for it.
`fn(d)` runs once per row and returns the row's content: a node, text, a list, or a function that gives one.
Read values inside functions (`() => d.sold`) so the row follows them.

- **`h`** (Solid's hyperscript, `solid-js/h`): plain JS, no build, no eval. It works under a strict Content-Security-Policy.
- **`html`** (Solid's template, `solid-js/html`): ``(d) => html`<${Bar} to=${() => d.sold} />` ``, or with the block elements, ``(d) => html`<rhp-bar to=${() => d.sold}></rhp-bar>` ``. A hole that reads the row is a function (`${() => d.sold}`, not `${d.sold}`), so the block follows the data. It compiles its templates with `new Function`, so the page's CSP must allow `'unsafe-eval'`.
- **JSX**, in an app whose build compiles Solid's JSX: `(d) => <><Label edge="start">{d.name}</Label><Bar to={d.sold} /></>`. The app's `solid-js` must be the copy `@shashank1010/rhp-web` uses (one install, deduped).

### A template string

`slat(tag, settings?, template)` takes the row's content as markup with `{bindings}`:

```js
slat("fruit-row", { thickness: 32, helpers: { tone: (d) => (d.sold > 15 ? "positive" : "muted") } }, `
  <rhp-label edge="start">{name}</rhp-label>
  <rhp-bar to="{sold}" color="{tone}"></rhp-bar>
  <rhp-label at="{sold}">{sold}</rhp-label>`);
```

`<fruit-row>` is still the row's element, and the template is its content: any number of elements, text and block elements.
The template is compiled once, when `slat()` runs; each row is a copy of it, bound to the row.
`settings.helpers` are names the bindings read besides the columns: `{tone}` is `helpers.tone(d)`.
`attrs` and `css` work as for a function, and a `<style>` in the template is added to `css`.
Calling `slat()` again with the same string and the same settings does nothing; with another string, or other settings (other helpers), it throws, as for a tag defined with another `fn`.

### A template in the markup

With no JS of your own, a plot's `<template>` holds the row itself, one element with `{bindings}`:

```html
<rhp-plot name='["Apples", "Bananas"]' sold="[12, 18]" tone='["muted", "positive"]'>
  <template>
    <style>.rhp-bar { opacity: .9 }</style>
    <div>
      <rhp-label edge="start">{name}</rhp-label>
      <rhp-bar to="{sold}" color="{tone}"></rhp-bar>
      <rhp-label at="{sold}">{sold}</rhp-label>
    </div>
  </template>
</rhp-plot>
```

The page loads the package and that is all: `<script type="module">import "@shashank1010/rhp-web";</script>`.
The template's one element (here the `<div>`) is the row's root: any element but a block element (the Plot would place a bare block as the row).
A `<style>` in the template is the slat's CSS, scoped to its rows. `thickness`, `inset`, `room` and `css` on `<rhp-plot>` give the layout.
`<rhp-scale>` takes a template the same way, and its `d` is the tick (`{at}`, `{next}`, `{first}`, `{last}`, `{toEnd}`).
A template holding one slat element alone, `<template><fruit-row></fruit-row></template>`, draws that slat as before; a slat element with content, or with a `<style>` next to it, is an error.
A markup is compiled once per page: every plot with the same template shares one slat type and one stylesheet, so 50 charts with one template add one sheet.
Declarative templates have no helpers (they have no JS); a column gives what a helper would.

### Bindings

A binding is `{path}`: a name, then any number of `.name` or `[n]`, with no spaces (`{sold}`, `{meta.unit}`, `{points[0]}`).
The first name is a helper when the slat has one by that name, else the row's column (`d.name`; `index` and `position` too). After a value that is `null` or `undefined`, the path gives `undefined`.
A `{...}` that is not a path is text like any other: a JSON attribute, `room='{"start": 80}'`, stays as written.
There is no JavaScript in a template: a value worked out from the row (a tone from a number, a rounded label) is a helper of the slat, or a column computed before the data is set.

- **Text**: `{name}` is a text node of its own, written when its value changes (`null` and `undefined` write nothing).
- **A whole attribute**: `to="{sold}"` is the value itself, so a number stays a number. On a plain element, `false`, `null` and `undefined` remove the attribute, and `true` sets it empty.
- **Part of an attribute**: `class="row {tone}"` is a string.
- **`class` and `style`**: `class` is set through `className`, and `style` (bound or written as is) through the CSSOM, one declaration at a time.
- **Events**: `on:click="{select}"` listens with the helper `select(event, d)`. Every other `on...` attribute (`onclick="..."`) is refused (the browser would compile its code), reported and left out.
- **Block elements** (`<rhp-bar>`, `<rhp-label>` ...) take their attributes as the block's props: static ones read by the block's types once, when the template is compiled, and bound ones live. Their content is the block's children (a Label's text), blank text dropped. They are bound by the template with no store of their own, and `set()` or a property set on one is reported and changes nothing.
- **The row's root** takes no binding on `hidden`, `id`, `role`, `tabindex`, `data-rhp-o` or `data-rhp-slat`, which its Plot sets.

A `style="..."` attribute in a template is applied through the CSSOM, so it draws under any policy. The browser still reports a `style-src-attr` violation for each one when it parses the markup (the page's, or a template string's) under a Content-Security-Policy without `style-src 'unsafe-inline'`: under such a policy, put the styles in the slat's CSS (a `<style>` in the template, or `css`).
A custom element needs its end tag: `<rhp-bar to="{sold}"/>` does not close (HTML ignores the `/`), so the elements after it are inside the bar. A block element inside another block element is reported, with both names, and left out.
A `<script>` in a template is left out.

### Errors in a template

What can't be compiled (an `onclick`, an `on:` naming no helper, a binding on the root's `id`) is reported once per template, as one error, and only that part is left out.
A template with no root (none, or two elements, or a block element) is reported and leaves its plot out.
A helper that throws on a row is reported once per binding (not once per row), and the binding keeps the value it had, so the plot keeps drawing.

### Settings

The settings are those of rhp's `slat()`, plus `attrs` and `helpers`:

| Setting | |
|---|---|
| `thickness` | px per row along the stack |
| `inset` | the empty share of the band on each side of a Bar, Tick or Area |
| `room` | room outside the plot: `{ start, end, before, after }`, or `"auto"` |
| `css` | CSS scoped to this slat's rows (one stylesheet, shared by every chart that draws it) |
| `attrs` | `(d) => ({ class, style, "data-x": ..., onClick })`: attributes and handlers for the row's element; it runs again when what it reads changes |
| `helpers` | a template string's names besides the columns: `{ tone: (d) => ... }`, and `(event, d) => ...` for `on:click="{name}"` |

The same slat as a class:

```js
import { RhpSlat, h, Bar } from "@shashank1010/rhp-web";

class FruitRow extends RhpSlat {
  static layout = { thickness: 32 };
  static css = ".rhp-bar { opacity: .9 }";
  static attrs = (d) => ({ class: "row" });
  draw(d) { return h(Bar, { to: () => d.sold }); }
}
customElements.define("fruit-row", FruitRow);
```

- **One slat, many charts.** Any number of charts can name `<fruit-row>`. A template can override the layout for one plot, `<template><fruit-row thickness="24"></fruit-row></template>`, and so can `<rhp-plot thickness="24">` (also `inset`, `room`, `css`).
- **New CSS later.** `customElements.get("fruit-row").css = "..."` restyles every row of it in place, wherever it is drawn. `restyle` is exported too.
- **Nested plots in JS.** A slat can hold a Plot. Its own slat is a slat type made with `slat()`: `slat("fruit-row", (d) => h(Plot, { size: () => d.sizes }, SizeRow))`, where `SizeRow = slat("size-row", ...)` reads `d.size`.
- **From JS.** `plot.slat` takes a slat type or a tag, and replaces the template.

## The elements

Attributes are the declarative part. Properties take the exact values rhp's Solid components take (functions, `shape()` results, `sortBy()`), and a property wins over its attribute.
Setting a property to `undefined` brings the attribute's value back.
Every element has `set(name, value)` and `get(name)` for any prop, including those whose name `HTMLElement` already has (`animate`, `role`, `style`, `title`).

`<rhp-chart>`: one chart. Its children are drawn in DOM order; nodes that are not rhp elements (a legend, an overlay) are moved into the chart, as in a Solid chart.

| Attributes | Properties beyond them |
|---|---|
| `scale` `cross` `ticks` `cross-ticks` `orientation` `height` `aspect` (`16/9` or a number) `animate` `static` `theme` `label` | `format` `crossFormat` `ref`; `.chart`: the rendered `.rhp-chart` (null until drawn) |

`role` and `aria-*` attributes on `<rhp-chart>` are the host's own: they apply to `<rhp-chart>` itself and are not passed to the Chart, so the chart is one node in the accessibility tree (`<rhp-chart role="img" aria-label="Sales">`).
`label="Sales"` names the rendered chart instead (it becomes a figure), and `set("role", ...)` or `set("aria-label", ...)` pass a prop to the Chart.

`<rhp-plot>`: a Plot. It is hidden and draws inside the chart.

| Attributes | Properties beyond them |
|---|---|
| settings: `order` `reorder` `orientation` `overlap` `slats` `key` `rows` `animate` `thick` `static` `keyboard` `class` `style` | `ref` `onLoop` |
| layout: `thickness` `inset` `room` `css` | `.slat` (a slat type or a tag) |
| any other attribute is a column: a JSON list, or one value for every row | `.plot`: the rendered `.rhp-plot` |

Columns as properties: a column the plot already has (from an attribute, or set before) is a property, `plot.sold = [...]`.
A new column goes through `plot.set("price", [...])` or `plot.data = { name: [...], price: [...] }`.
Once the plot is in the page, `plot.price = [...]` for a column it does not have yet is a plain JS property: it is not read, draws nothing, and reports nothing.
`data` gives every column at once, and setting it removes the columns a property gave that it leaves out.
Properties set before the element first connects (before `define()` ran, or on a `createElement` before it is appended) are taken as props.

`<rhp-scale>`: the chart's scale drawn by a slat, one row per tick. Each tick's `d` has `at`, `next`, `first`, `last` and `toEnd` (px to the end of the scale, `Infinity` until measured).

| Attributes | Properties beyond them |
|---|---|
| `ticks` `class` `style`; layout overrides `thickness` `inset` `room` `css`, as on a plot (`room='{"after": 26}'` keeps space for numbers drawn below the rows); the slat in a `<template>`, as for a plot | `ref`; `.slat`; `.plot`: the rendered `.rhp-scale` |

`<rhp-axis>`: grid lines and numbers, besides the chart's own axis.

| Attributes | Properties beyond them |
|---|---|
| `ticks`: a JSON list, a count of round values (`ticks="4"`), `every:5`, or `false` | `ticks` as a function of the chart's `[min, max]`; `format`: `(v) => text or a node` |

`<rhp-many-dots>`: the experimental ManyDots collection, for large scatters. The chart needs a `cross` scale; nothing is drawn until `rows`, `at` and `cross` are set.

| Attributes | Properties beyond them |
|---|---|
| `rows` (JSON); `at` and `cross` name a row field (`at="x"`), or are a JSON list by point; `key` names a row field; `color` `size` `point-class` `point-style` `class` `style`; `role` and `aria-*` for the collection's element | each as a value or a `(row, index) => value` accessor; `shape` `ref`; `.dots`: the rendered collection; any other prop with `set()` (`id`, `classList`, `data-*`, `onClick`), put on the collection's element |

`<rhp-theme>`: the theme of every chart below it, at any depth. It is not hidden and its content stays as it is. Nested themes merge outer to inner, and a chart's own `theme` wins key by key. A theme inside an `<rhp-chart>` does not theme that chart.

| Attributes | Properties |
|---|---|
| `value` (JSON), and one per key, which wins over `value`: `series` (JSON list) `positive` `negative` `ink` `muted` `grid` `surface` `low` `high` `font` | the same names |

`<rhp-poster>`: rhp's Poster around the charts it holds. It draws its own `<figure class="poster">` and moves its children into it.

| Attributes | Properties beyond them |
|---|---|
| `look` `kicker` `title` `dek` `note` | the same as any content (a string, a Node, a list); `title` through `set()`/`get()` (its attribute also shows a tooltip); `.figure` |

A child with `slot="kicker"`, `"title"`, `"dek"` or `"note"` goes into that part and wins over the attribute.
The looks are the page's CSS: `@shashank1010/rhp-web/posters.css` has the gallery's.

The blocks `<rhp-bar>` `<rhp-dot>` `<rhp-tick>` `<rhp-label>` `<rhp-cell>` `<rhp-place>` `<rhp-area>` `<rhp-line>`: rhp's blocks as elements, for a slat that names a tag, `h("rhp-bar", { to: () => d.sold })`, or a template (`<rhp-bar to="{sold}">`, see [Bindings](#bindings)).
A block element is `display: contents`: it has no box, and the block it draws (its `.block`) is laid out in its place. Measured, it is that block: `getBoundingClientRect()`, `getClientRects()`, `offsetWidth`, `offsetHeight`, `offsetTop`, `offsetLeft`, `offsetParent` and `clientWidth` / `clientHeight` / `clientTop` / `clientLeft` give the block's. The browser's own measuring does not go through them: a `ResizeObserver` or `IntersectionObserver` on the element sees no box, `:hover` and `document.elementFromPoint()` find the block inside, and a selector like `.row > .rhp-bar` does not match (the block's parent is the element; `.row .rhp-bar` does).
They draw only when made inside a slat's `fn` or by a template; made anywhere else they report an error and draw nothing.
Each takes its block's props as properties (values, `shape()`, `() => value` accessors), and the scalar ones as attributes (`from` `to` `at` `thick` `size` `across` `cross` `color` `side` `edge` `value` `points` `peak` `base` `fill` `smooth` `mirror`, plus `class` and `style`).
Their children are the block's children (a Label's text), except for `<rhp-area>` and `<rhp-line>`, whose svg has its own content. `.block` is the rendered block.
The Solid blocks, `h(Bar, ...)`, are faster: each element is one more store, root and host per block (a template's blocks have no store, only the root and the host).

## Attributes

- A JSON value is read as JSON: `scale="[0, 30]"`, `room='{"start": 80}'`, `sold="[12, 18, 7]"`. A number is a number. Anything else is the string.
- A boolean is true when present (`static`, `keyboard=""`), false when `"false"`. `animate` also takes JSON (`animate='{"duration": 300}'`).
- `style` and `point-style` take a CSS declaration list: `style="opacity: .5; --x: 1"`. A `;` inside quotes or parentheses (a `data:` URL in `url(...)`) stays in its value, and comments are dropped. `!important` is dropped too: the declaration applies, with no priority.
- Kebab-case names are props in camelCase: `cross-ticks` is `crossTicks`, `unit-price` is the column `d.unitPrice`. `aria-*` stays as it is.
- HTML lowercases attribute names, so `unitPrice="..."` is the column `d.unitprice`. Write `unit-price`, or set the column as a property.
- Two settings that take functions have a named form for plain HTML: `order="sortBy:sold"` or `"sortBy:sold:desc"` is `sortBy("sold", "desc")`, and `ticks="every:10"` or `"every:10:ends"` is `every(10, { ends: true })`. A form that can't be read is reported and the setting left unset. Every other function is a property.

## What changes live

Most changes update in place: a new number moves one bar, and the chart's settings, `order`, `reorder`, `orientation`, `animate`, `thick`, `class`, `style` and the themes are live.
A static Plot (`static` on it or on its chart) draws every row again when its data changes, as in rhp.
A few things are read once when a Plot is made, and changing them makes that Plot again (its animation and focus start over):

- its slat: `.slat`, a replaced `<template>`, or a layout override (`thickness`, `inset`, `room`, `css` on `<rhp-plot>`);
- its set of columns (a new column, or one removed), and whether it has `rows`;
- `key`, `static`, `keyboard` and `overlap`.

`static` on `<rhp-chart>` makes the whole chart again, and a new slat makes an `<rhp-scale>` again.
Adding, removing or moving an `<rhp-plot>` adds, removes or moves that plot alone.

A chart draws in a microtask after it is connected, and is removed a microtask after it leaves the page; moving it (into a poster, another container) keeps it drawn.

## Events and rows

Listen on the chart or any ancestor. Each row's element carries `$row()`, the row's index:

```js
chart.addEventListener("click", (e) => {
  const i = e.target.closest("[data-rhp-slat]")?.$row();
  if (i != null) console.log(plot.get("name")[i]);
});
```

A slat's `attrs` can attach a handler to each row: `attrs: (d) => ({ onClick: () => select(d.name) })`.

## Content-Security-Policy

`h`, compiled JSX and templates with `{bindings}` (their paths are never compiled as code) need no `'unsafe-eval'`. `html` does.
Under a policy without it, a slat written with `html` is reported as an error and leaves only its own plot out.
Under a policy without `style-src 'unsafe-inline'`, write no `style="..."` attributes in the markup, a template's included (see [Bindings](#bindings)).
rhp's styles are adopted stylesheets, except two small `<style>` elements: one that declares its cascade layers, and one in each `<rhp-many-dots>` collection (its defaults).
They need `style-src 'unsafe-inline'` or a nonce, which they take from the page's first `<style>`, `<link>` or `<script>` that has one.

## Errors

A bad template (no root element, or two; a block element as its root; a slat element with content), an element that is defined but is not a slat, a slat or a `format` that throws, or an attribute form that can't be read is reported (`reportError`, as an uncaught error) and leaves out only that element.
A slat tag that is a valid custom element name but not defined is not an error: the plot waits for it and draws nothing until it is defined, so a misspelled tag or a slat script that never loads shows no message.
A chart removed from the page while it waits is not kept in memory by the wait.
The rest of the chart keeps drawing, and fixing the element draws it.

## Limitations

- Browser only: there is no server rendering of the markup, and importing the package on a server throws (`HTMLElement is not defined`). In Astro, Next and the like, import it in client-side code only (a `<script>` or a client-only module). rhp's own server build is not affected.
- A `<template>`'s content is not observed. Replace the `<template>` element, or set `.slat`.
- Slats written with `html` need `'unsafe-eval'`.
- A template's markup is compiled once and kept for the page's life, one per distinct markup: a page that makes endless different templates keeps every one.
- A `style` or `point-style` attribute's `!important` is dropped (rhp sets style values with no priority). For a declaration that must win, use a class and the page's CSS.
- A prop whose name `HTMLElement` already has (`title`, `style`, `animate`, `role`) has no property of its own: use `set()` and `get()`. `hidden`, `id`, `slot`, `part`, `is`, `tabindex`, `inert`, `popover`, `exportparts` and `data-*` attributes are never props or columns.
- The package has its own Solid (a dependency, inlined in the standalone file). In a Solid app, use the signals and `html` it exports, or make sure the app's `solid-js` dedupes with it: two copies of Solid don't see each other's signals.
- Each row is one element more than a Solid slat that returns a bare block. For large scatters, use `<rhp-many-dots>`.

## Development

There is no test runner in `web/`: rhp's root `npm test` builds `test/web.js` and checks the elements, the standalone file and the CSP pages (the Web sections of `test/run.mjs`), and the types in `test/types/web.ts`.

```sh
cd web && npm run build    # dist/rhp-web.js and dist/posters.css
```

The build runs inside rhp's repository only (it uses rhp's `scripts/bundle.mjs` and the root `node_modules`). It takes rhp from `../src` at the same commit, or with `RHP_WEB_FROM=package` from the installed `@bezda/rhp`.
`npm publish` builds first. `bench/README.md` has the benchmark against the Solid package.

### Development without a release

To use this package with an rhp that is not released yet, link them instead of installing from npm:

```sh
npm run build && npm link             # in rhp's root: dist/, and @bezda/rhp linked globally
cd web && npm link @bezda/rhp         # web/node_modules/@bezda/rhp is the root
RHP_WEB_FROM=package npm run build    # dist/rhp-web.js from the linked rhp's dist/
npm link                              # then, in your app: npm link @shashank1010/rhp-web
```

The dependency range in `package.json` (`"@bezda/rhp": "^2.0.3"`) only matters to `npm install`: a link is taken whatever its version.
The build's Solid resolves from the root `node_modules` (the copy the linked rhp itself resolves), even though `npm link` also installs a `solid-js` into `web/node_modules`.
An app that bundles `@shashank1010/rhp-web` through the link (not the standalone file) sees both copies, so make it resolve one, e.g. Vite's `resolve: { dedupe: ["solid-js"] }`.
With two copies, a chart draws nothing and reports once, in the console: `rhp-web: @bezda/rhp and @shashank1010/rhp-web run on two different copies of solid-js…`, with what to do.
The repository's own builds (the tests, the benchmark pages and `dist/rhp-web.js`) always resolve one Solid, whatever `web/node_modules` holds.
Without the link, `npm run build` in `web/` takes rhp from `../src` and needs no `npm link` at all.

Everything else is on rhp's website: https://rhp.vercel.app
