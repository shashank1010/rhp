# rhp against other chart libraries

Every library draws the same chart: a horizontal bar chart with a name and a value per bar, on a fixed 0 to 100 scale, 600px wide.
Each one is written the way its own docs suggest, with its default settings, including its default animation.

| Library | Draws with | Animation by default |
|---|---|---|
| rhp, CSS version | HTML and CSS | CSS transitions, 150 ms |
| rhp, JS version | HTML and CSS | JS, 150 ms |
| rhp, static | HTML and CSS, rows drawn once | none: a change draws the rows again |
| Plain DOM | divs, widths set by hand | none (the floor) |
| Charts.css | an HTML table and CSS | none |
| D3, by hand | SVG | a 150 ms transition, as rhp |
| Observable Plot | SVG, drawn again on each change | none |
| Chart.js | canvas | 1000 ms |
| ECharts | canvas | 300 ms |
| ApexCharts | SVG | 350 ms |
| Recharts (React) | SVG | 400 ms |
| Nivo (React) | SVG | spring |
| Victory (React) | SVG | none |
| Highcharts | SVG | its default |
| AntV G2 | canvas (AntV G) | its default |
| Vega-Lite (vega-embed) | canvas, compiled and drawn asynchronously | none |

The adapters are in `libs/`, one file each.
The React libraries render with `flushSync`, so an update is drawn in the frame it is made, like the others.

## What is measured

- **Mount:** one chart of 20 bars, one of 1,000 bars (8px each), and a dashboard of 50 charts of 7 bars. The chart is made at the start of a frame; the time is that frame's work, from the call until the frame is drawn. Chrome also reports all main-thread time in the second after, which includes drawing a library defers to later frames and its entry animation. Median of 10 runs (5 for the large chart and the dashboard), a fresh page each.
- **Update:** one value changes, 20 times, 700 ms apart. Latency is the time from the change to its frame being drawn. In Chrome, main-thread time per change includes every animation frame that follows.
- **Drag:** one value changes in every frame for 240 frames, as when a slider is dragged. Frame gaps show dropped frames, and in Chrome, main-thread time per frame. Chrome runs it again with the CPU slowed 4x, like a mid-range phone; there only dropped frames count, because Chrome's time counters don't scale with the slowdown.
- **Size:** the adapter bundled and minified, then gzipped: what an app ships for this chart. "Without framework" leaves out React or Solid.
- **Memory:** in Chrome, the JS heap and the number of DOM nodes the 50-chart dashboard adds, after garbage collection.

## Running it

```sh
cd bench
npm install
npm run build              # out/: one page per library, and out/sizes.json
node run.mjs chrome        # or firefox, webkit, safari; writes results/<browser>.json
node run.mjs chrome rhp-css,d3   # only some libraries
npm run report             # RESULTS.md from results/ and out/sizes.json
```

`chrome` runs the installed Chrome, headed, through Playwright; `chromium` runs Playwright's Chromium headless (with `BENCH_BROWSER=<path>` for a build already on the machine), for a machine without Chrome such as a Linux container; `firefox` and `webkit` run Playwright's builds.
`BENCH_RESULTS=<folder>` writes the results to another folder, and `BENCH_RESULTS=<folder> BENCH_OUT=<file> BENCH_MACHINE=<text> npm run report` writes a separate results page from them.
`safari` runs the real Safari through `safaridriver` (enable it once with `safaridriver --enable`, and allow remote automation in Safari's Develop menu).
Close other apps while it runs: timings are only as steady as the machine.

A page in `out/` shows nothing on its own: `run.mjs` calls its `window.bench` methods. To look at an adapter's chart, serve `out/` (`npx serve out`) and open its page with `?demo` (`out/rhp-web.html?demo`, or `?demo=50` for 50 bars); a scale page takes `?demo=scatter:1000` or `?demo=line:1000`.

For a repeat with recorded idle baselines and exact input hashes:

```sh
npm ci
npm run build
node scale.mjs build
export BENCH_RESULTS=results-local-repeat
node snapshot.mjs
BENCH_IDLE=1 node run.mjs chromium
BENCH_IDLE=1 node scale.mjs run
```

`BENCH_IDLE=1` requires at least 90% aggregate CPU idle for three consecutive two-second samples before each bar adapter and each scale scenario.
The samples are saved alongside the measurements.
If the baseline does not qualify within two minutes, the run stops and records the failed samples.
This establishes a measured baseline without claiming exclusive use of the machine during a scenario.
New results retain individual mount and scale samples as well as medians.
`snapshot.mjs` records dependency versions, source and bundle hashes, machine details and the bundle-size snapshot.
`BENCH_INPUTS` can point to a frozen directory containing copies of `out/` and `out-scale/`, so concurrent development cannot change benchmark inputs during a run.

## Scale: scatter plots and lines with many points

`scale.mjs` draws one chart of many points in each library of `scale/`: a scatter plot of 1,000 and 10,000 dots, and a line of 1,000 and 100,000 points, with each library's defaults (rhp's charts are `static`, as its docs say for data that never changes).
It reports the frame the chart is made in, all main-thread time in the 2 seconds after, and the DOM elements it adds, the median of 5 fresh pages.
DOM size counts connected elements before and after drawing, outside the timing window.
The earlier Chromium `Nodes` counter included detached nodes awaiting garbage collection and could report negative changes for canvas charts.

```sh
node scale.mjs build                       # out-scale/: one page per library
node scale.mjs run                         # Chromium; BENCH_BROWSER and BENCH_RESULTS as above; writes <results>/scale.json
```

An rhp scatter plot is one slat per point, each an HTML element, so its cost grows with the points the way the DOM's does; a Line is one SVG path, whatever its length.


## Web components

`web/` (`@shashank1010/rhp-web`) draws the same charts as custom elements over the same rhp.
Its adapters draw the bar chart of `rhp-css` and are compared with the Solid adapters, not with the other libraries:

| Adapter | How | Against |
|---|---|---|
| `rhp-web` | `<rhp-chart>` markup set with `innerHTML`, the slat `<bench-row>` defined once with `slat()` and `h`, data given as properties of `<rhp-plot>` | `rhp-css` |
| `rhp-web-dom` | the same chart made with `createElement` and properties: no HTML parsing | `rhp-css` |
| `rhp-web-html` | the slat written with Solid's `html` instead of `h` | `rhp-css` |
| `rhp-web-template` | the slat written as a template string with `{bindings}` and block elements (`<rhp-bar to="{value}">`), which the template binds with no store per block | `rhp-css` |
| `rhp-web-js`, `rhp-web-static` | the `animate` and `static` attributes | `rhp-js`, `rhp-static` |
| `rhp-h` | Solid without web components, written with `h` instead of JSX (the cost of `h` alone) | `rhp-css` |
| `rhp-react` | rhp in React through `react/`'s `toReact`, the slat written with `h`, React re-rendering it with `flushSync` as the other React adapters do | `rhp-css` |

An `<rhp-chart>` builds its chart in a microtask after it connects. The harness measures until the frame is drawn, so the mount times include that build, as well as the parsing and upgrade of the markup.
`scale/rhp-web.js` draws the scale charts as markup (static): a scatter point is a `<point-row>` slat holding a Dot, so each point is two elements where the Solid slat returns the bare Dot.
The build resolves `@bezda/rhp` and `@bezda/rhp/standalone` (imported by `web/src` and `react/`) to this repo's `src/`, and gives each page one React (`react/` would otherwise find the repo root's copy); the sizes without the framework still leave React out.
The report adds a "Web components over Solid" section with each adapter next to its counterpart and the ratio, when these adapters are in the results.

```sh
npm run build && node scale.mjs build
node run.mjs chrome rhp-css,rhp-js,rhp-static,rhp-h,rhp-web,rhp-web-dom,rhp-web-html,rhp-web-template,rhp-web-js,rhp-web-static,rhp-react
node scale.mjs run rhp,rhp-web
npm run report
```

## Local comparison run (October 5, 2026)

The Apple M5 measurements are stored separately in `results-macos-m5-20261005/`.
That folder includes the browser version, start/end load averages, dependency versions and the bundle-size snapshot used by the report.
Other desktop applications were active; no poster-generation agents ran during the timings.
The bar and scale runners save a checkpoint after each library, and add `completed` only after every requested library finishes.

```sh
BENCH_RESULTS=results-macos-m5-20261005 node run.mjs chromium
BENCH_RESULTS=results-macos-m5-20261005 node scale.mjs run
BENCH_RESULTS=results-macos-m5-20261005 BENCH_OUT=RESULTS-MACOS-M5-20261005.md BENCH_MACHINE="Apple M5, 10 logical CPUs, 24 GiB, macOS 26.5.2" npm run report
```

The report includes both bar-chart and large-point scenarios.
The completed run covers sixteen bar-chart adapters and forty scale combinations across ten libraries, with no observed page errors.
The original scale measurements using Chromium's detached-node counter are retained in `scale-cdp-nodes.json`; the report uses the corrected `scale.json`.
It uses the saved `sizes.json` in the results directory when present, so rebuilding another version does not silently change a saved run's bundle-size comparison.
