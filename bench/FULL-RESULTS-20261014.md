# Results

Machine: Apple M1, 16 GB, macOS 26 (headed Chrome for the bar charts).
How it was measured: [README.md](README.md).
Smaller times, bundle sizes, memory use and dropped-frame counts are better.

Environment: [saved metadata](results-full-20261014/environment.json).
Apple M1 (16 GB), macOS 26, 14 October 2026.
The run was made on this branch before the block measuring getters were added to web/src/elements/blocks.js (the recorded commit, 2abd175, was rewritten since); the benchmark does not call them, so the code it measured is the code in this commit.
Bar charts: the installed Chrome, headed, all 24 adapters one after another (15:39 to 16:04).
Scale charts: Playwright Chromium, as scale.mjs runs them (16:04 to 16:13).
The machine was not otherwise idle (other terminals and agents open); CPU idle gates are disabled.

## Size

A bar chart app, minified and gzipped, in kB.

| Library | Total | Without React or Solid |
|---|---:|---:|
| Plain DOM | 0.4 | 0.4 |
| Charts.css | 6.3 | 6.3 |
| D3 | 18.7 | 18.7 |
| rhp (CSS) | 27.7 | 18.4 |
| rhp (JS) | 27.7 | 18.4 |
| rhp (static) | 27.7 | 18.4 |
| rhp (Solid with h) | 28.9 | 18.3 |
| rhp-web (template string) | 46.9 | 38.0 |
| Chart.js | 47.9 | 47.9 |
| rhp-web (static) | 48.2 | 38.0 |
| rhp-web (JS) | 48.2 | 38.0 |
| rhp-web (CSS) | 48.2 | 38.0 |
| rhp-web (createElement) | 48.3 | 38.1 |
| rhp-web (slat with html) | 51.5 | 38.0 |
| Observable Plot | 93.1 | 93.1 |
| rhp in React (@bezda/rhp-react) | 99.5 | 18.8 |
| Highcharts | 104.9 | 104.9 |
| Victory | 148.0 | 78.7 |
| Nivo | 159.8 | 90.7 |
| ECharts | 161.2 | 161.2 |
| Recharts | 164.2 | 95.9 |
| ApexCharts | 284.6 | 284.6 |
| Vega-Lite | 304.0 | 304.0 |
| AntV G2 | 407.6 | 407.6 |

## Chrome

Browser: 155.0.8059.40.
Started: 2026-10-14T12:39:41.752Z.
Completed: 2026-10-14T13:04:49.662Z.
Libraries: 24.

### Mount (ms)

"Frame" is the frame the chart is made in.
"Total" is all main-thread time in the second after, with deferred drawing and entry animations.

| Library | 20 bars: frame | total | 1,000 bars: frame | total | 50 charts: frame | total |
|---|---:|---:|---:|---:|---:|---:|
| Plain DOM | 4.8 | 8.0 | 20 | 30 | 9.5 | 13 |
| Charts.css | 6.0 | 9.3 | 28 | 35 | 13 | 16 |
| D3 | 9.8 | 13 | 32 | 36 | 23 | 26 |
| rhp (static) | 13 | 17 | 96 | 100 | 38 | 41 |
| Observable Plot | 12 | 15 | 40 | 43 | 39 | 42 |
| rhp (CSS) | 14 | 17 | 100 | 104 | 38 | 43 |
| rhp (JS) | 14 | 17 | 99 | 103 | 40 | 44 |
| rhp (Solid with h) | 14 | 18 | 97 | 103 | 41 | 44 |
| rhp in React (@bezda/rhp-react) | 17 | 20 | 111 | 114 | 49 | 52 |
| rhp-web (static) | 18 | 22 | 109 | 113 | 51 | 55 |
| rhp-web (slat with html) | 19 | 23 | 113 | 119 | 50 | 55 |
| rhp-web (createElement) | 19 | 22 | 116 | 119 | 52 | 56 |
| rhp-web (CSS) | 18 | 21 | 116 | 119 | 55 | 59 |
| rhp-web (JS) | 18 | 22 | 115 | 118 | 57 | 60 |
| rhp-web (template string) | 20 | 23 | 137 | 141 | 61 | 65 |
| Victory | 23 | 28 | 162 | 167 | 95 | 102 |
| Vega-Lite | 33 | 37 | 78 | 82 | 177 | 195 |
| Chart.js | 22 | 70 | 47 | 253 | 73 | 349 |
| ECharts | 34 | 97 | 78 | 454 | 107 | 354 |
| ApexCharts | 33 | 107 | 311 | 844 | 206 | 448 |
| Highcharts | 35 | 96 | 201 | 509 | 294 | 508 |
| Nivo | 30 | 101 | 416 | 1233 | 183 | 527 |
| Recharts | 36 | 97 | 191 | 662 | 264 | 628 |
| AntV G2 | 54 | 100 | 379 | 822 | 411 | 784 |

### Updates

One value changes.
Latency: until its frame is drawn.
Main thread: all work for the change, animation frames included.
Drag: one value changes every frame for 240 frames.

| Library | Latency (ms) | Main thread per change (ms) | Drag: main thread per frame (ms) | Drag: dropped frames | Drag, CPU 4x slower: dropped frames |
|---|---:|---:|---:|---:|---:|
| Vega-Lite | 1.2 | 1.3 | 0.6 | 0 | 0 |
| Plain DOM | 1.3 | 1.4 | 1.2 | 0 | 0 |
| Charts.css | 1.7 | 1.7 | 1.3 | 0 | 0 |
| rhp (static) | 4.0 | 3.7 | 2.6 | 0 | 0 |
| Observable Plot | 4.3 | 4.0 | 2.6 | 0 | 0 |
| rhp-web (static) | 4.5 | 4.3 | 2.6 | 0 | 0 |
| Victory | 7.7 | 7.0 | 3.2 | 0 | 0 |
| rhp (Solid with h) | 1.6 | 7.8 | 1.3 | 0 | 0 |
| rhp (CSS) | 1.6 | 7.9 | 1.4 | 0 | 0 |
| rhp in React (@bezda/rhp-react) | 1.7 | 8.0 | 1.5 | 0 | 0 |
| rhp-web (template string) | 1.6 | 8.1 | 1.3 | 0 | 0 |
| rhp-web (createElement) | 1.6 | 8.1 | 1.3 | 0 | 0 |
| rhp-web (CSS) | 1.6 | 8.1 | 1.3 | 0 | 0 |
| D3 | 2.1 | 8.2 | 1.8 | 0 | 0 |
| rhp (JS) | 0.8 | 11 | 1.2 | 0 | 0 |
| rhp-web (JS) | 0.7 | 11 | 1.3 | 0 | 0 |
| rhp-web (slat with html) | 3.2 | 12 | 1.6 | 0 | 0 |
| Chart.js | 15 | 31 | 2.3 | 0 | 0 |
| Highcharts | 7.4 | 33 | 3.2 | 0 | 1 |
| ECharts | 15 | 34 | 2.7 | 0 | 1 |
| Nivo | 11 | 41 | 3.4 | 0 | 1 |
| ApexCharts | 16 | 47 | 7.7 | 0 | 143 |
| AntV G2 | 18 | 53 | 2.7 | 0 | 12 |
| Recharts | 9.1 | 63 | 4.5 | 0 | 5 |

### Memory

What the 50-chart dashboard adds.

| Library | JS heap (MB) | DOM nodes |
|---|---:|---:|
| Charts.css | 0.1 | 2250 |
| Plain DOM | 0.1 | 2150 |
| D3 | 0.5 | 3550 |
| rhp (static) | 1.7 | 3373 |
| Observable Plot | 1.8 | 3800 |
| rhp (CSS) | 2.8 | 3373 |
| rhp-web (static) | 2.9 | 3820 |
| rhp (Solid with h) | 3.0 | 3370 |
| rhp (JS) | 3.0 | 3373 |
| rhp in React (@bezda/rhp-react) | 4.0 | 3470 |
| Chart.js | 4.4 | 150 |
| rhp-web (slat with html) | 4.7 | 3778 |
| rhp-web (createElement) | 4.8 | 3520 |
| rhp-web (CSS) | 4.9 | 3770 |
| rhp-web (JS) | 5.0 | 3820 |
| rhp-web (template string) | 5.2 | 4826 |
| Victory | 5.4 | 4352 |
| ApexCharts | 5.6 | 7402 |
| Highcharts | 5.6 | 7250 |
| ECharts | 6.8 | 201 |
| Vega-Lite | 13.8 | 6104 |
| Nivo | 21.7 | 5900 |
| AntV G2 | 28.3 | 150 |
| Recharts | 29.0 | 6552 |

## Web components over Solid (Chrome)

Each web-component adapter (web/, @shashank1010/rhp-web) next to the Solid adapter drawing the same chart, and the ratio (web / Solid: above 1 is slower or larger).
"rhp (Solid with h)" is Solid without web components, written with h instead of JSX.
An rhp-web chart is built in a microtask after it connects, inside the measured frame.
Size: the ratio of the adapters' minified and gzipped sizes, with Solid (the kB are in the tables below).

| Adapter | Against | 20 bars: frame | 1,000 bars: frame | 50 charts: frame | Update latency | JS heap | DOM nodes | Size |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| rhp-web (CSS) | rhp (CSS) | 1.28× | 1.16× | 1.43× | 1.00× | 1.71× | 1.12× | 1.74× |
| rhp-web (createElement) | rhp (CSS) | 1.31× | 1.16× | 1.37× | 1.00× | 1.71× | 1.04× | 1.74× |
| rhp-web (slat with html) | rhp (CSS) | 1.35× | 1.13× | 1.32× | 2.00× | 1.65× | 1.12× | 1.86× |
| rhp-web (template string) | rhp (CSS) | 1.40× | 1.37× | 1.60× | 1.00× | 1.81× | 1.43× | 1.69× |
| rhp-web (JS) | rhp (JS) | 1.29× | 1.15× | 1.43× | 0.87× | 1.67× | 1.13× | 1.74× |
| rhp-web (static) | rhp (static) | 1.36× | 1.13× | 1.35× | 1.13× | 1.76× | 1.13× | 1.74× |
| rhp (Solid with h) | rhp (CSS) | 0.99× | 0.97× | 1.07× | 1.00× | 1.05× | 1.00× | 1.04× |
| rhp in React (@bezda/rhp-react) | rhp (CSS) | 1.22× | 1.10× | 1.28× | 1.06× | 1.41× | 1.03× | 3.59× |

### rhp-web (CSS) against rhp (CSS)

| Measure | rhp-web (CSS) | rhp (CSS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 18 | 14 | 1.28× |
| 20 bars: total (ms) | 21 | 17 | 1.22× |
| 1,000 bars: frame (ms) | 116 | 100 | 1.16× |
| 1,000 bars: total (ms) | 119 | 104 | 1.15× |
| 50 charts: frame (ms) | 55 | 38 | 1.43× |
| 50 charts: total (ms) | 59 | 43 | 1.37× |
| Update: latency (ms) | 1.6 | 1.6 | 1.00× |
| Update: main thread per change (ms) | 8.1 | 7.9 | 1.02× |
| Drag: frame gap p50 (ms) | 17 | 17 | 0.99× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 4.9 | 2.8 | 1.71× |
| Memory: DOM nodes | 3770 | 3373 | 1.12× |
| Size: total (kB) | 48.2 | 27.7 | 1.74× |
| Size: without Solid (kB) | 38.0 | 18.4 | 2.07× |

### rhp-web (createElement) against rhp (CSS)

| Measure | rhp-web (createElement) | rhp (CSS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 19 | 14 | 1.31× |
| 20 bars: total (ms) | 22 | 17 | 1.25× |
| 1,000 bars: frame (ms) | 116 | 100 | 1.16× |
| 1,000 bars: total (ms) | 119 | 104 | 1.15× |
| 50 charts: frame (ms) | 52 | 38 | 1.37× |
| 50 charts: total (ms) | 56 | 43 | 1.30× |
| Update: latency (ms) | 1.6 | 1.6 | 1.00× |
| Update: main thread per change (ms) | 8.1 | 7.9 | 1.02× |
| Drag: frame gap p50 (ms) | 17 | 17 | 1.00× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 4.8 | 2.8 | 1.71× |
| Memory: DOM nodes | 3520 | 3373 | 1.04× |
| Size: total (kB) | 48.3 | 27.7 | 1.74× |
| Size: without Solid (kB) | 38.1 | 18.4 | 2.07× |

### rhp-web (slat with html) against rhp (CSS)

| Measure | rhp-web (slat with html) | rhp (CSS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 19 | 14 | 1.35× |
| 20 bars: total (ms) | 23 | 17 | 1.32× |
| 1,000 bars: frame (ms) | 113 | 100 | 1.13× |
| 1,000 bars: total (ms) | 119 | 104 | 1.14× |
| 50 charts: frame (ms) | 50 | 38 | 1.32× |
| 50 charts: total (ms) | 55 | 43 | 1.27× |
| Update: latency (ms) | 3.2 | 1.6 | 2.00× |
| Update: main thread per change (ms) | 12 | 7.9 | 1.54× |
| Drag: frame gap p50 (ms) | 17 | 17 | 1.00× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 4.7 | 2.8 | 1.65× |
| Memory: DOM nodes | 3778 | 3373 | 1.12× |
| Size: total (kB) | 51.5 | 27.7 | 1.86× |
| Size: without Solid (kB) | 38.0 | 18.4 | 2.07× |

### rhp-web (template string) against rhp (CSS)

| Measure | rhp-web (template string) | rhp (CSS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 20 | 14 | 1.40× |
| 20 bars: total (ms) | 23 | 17 | 1.35× |
| 1,000 bars: frame (ms) | 137 | 100 | 1.37× |
| 1,000 bars: total (ms) | 141 | 104 | 1.36× |
| 50 charts: frame (ms) | 61 | 38 | 1.60× |
| 50 charts: total (ms) | 65 | 43 | 1.50× |
| Update: latency (ms) | 1.6 | 1.6 | 1.00× |
| Update: main thread per change (ms) | 8.1 | 7.9 | 1.02× |
| Drag: frame gap p50 (ms) | 17 | 17 | 1.00× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 5.2 | 2.8 | 1.81× |
| Memory: DOM nodes | 4826 | 3373 | 1.43× |
| Size: total (kB) | 46.9 | 27.7 | 1.69× |
| Size: without Solid (kB) | 38.0 | 18.4 | 2.07× |

### rhp-web (JS) against rhp (JS)

| Measure | rhp-web (JS) | rhp (JS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 18 | 14 | 1.29× |
| 20 bars: total (ms) | 22 | 17 | 1.25× |
| 1,000 bars: frame (ms) | 115 | 99 | 1.15× |
| 1,000 bars: total (ms) | 118 | 103 | 1.14× |
| 50 charts: frame (ms) | 57 | 40 | 1.43× |
| 50 charts: total (ms) | 60 | 44 | 1.38× |
| Update: latency (ms) | 0.7 | 0.8 | 0.87× |
| Update: main thread per change (ms) | 11 | 11 | 1.03× |
| Drag: frame gap p50 (ms) | 17 | 17 | 1.01× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 5.0 | 3.0 | 1.67× |
| Memory: DOM nodes | 3820 | 3373 | 1.13× |
| Size: total (kB) | 48.2 | 27.7 | 1.74× |
| Size: without Solid (kB) | 38.0 | 18.4 | 2.07× |

### rhp-web (static) against rhp (static)

| Measure | rhp-web (static) | rhp (static) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 18 | 13 | 1.36× |
| 20 bars: total (ms) | 22 | 17 | 1.28× |
| 1,000 bars: frame (ms) | 109 | 96 | 1.13× |
| 1,000 bars: total (ms) | 113 | 100 | 1.13× |
| 50 charts: frame (ms) | 51 | 38 | 1.35× |
| 50 charts: total (ms) | 55 | 41 | 1.32× |
| Update: latency (ms) | 4.5 | 4.0 | 1.13× |
| Update: main thread per change (ms) | 4.3 | 3.7 | 1.14× |
| Drag: frame gap p50 (ms) | 17 | 17 | 0.99× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 2.9 | 1.7 | 1.76× |
| Memory: DOM nodes | 3820 | 3373 | 1.13× |
| Size: total (kB) | 48.2 | 27.7 | 1.74× |
| Size: without Solid (kB) | 38.0 | 18.4 | 2.07× |

### rhp (Solid with h) against rhp (CSS)

| Measure | rhp (Solid with h) | rhp (CSS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 14 | 14 | 0.99× |
| 20 bars: total (ms) | 18 | 17 | 1.05× |
| 1,000 bars: frame (ms) | 97 | 100 | 0.97× |
| 1,000 bars: total (ms) | 103 | 104 | 0.99× |
| 50 charts: frame (ms) | 41 | 38 | 1.07× |
| 50 charts: total (ms) | 44 | 43 | 1.03× |
| Update: latency (ms) | 1.6 | 1.6 | 1.00× |
| Update: main thread per change (ms) | 7.8 | 7.9 | 0.98× |
| Drag: frame gap p50 (ms) | 17 | 17 | 1.00× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 3.0 | 2.8 | 1.05× |
| Memory: DOM nodes | 3370 | 3373 | 1.00× |
| Size: total (kB) | 28.9 | 27.7 | 1.04× |
| Size: without Solid (kB) | 18.3 | 18.4 | 1.00× |

### rhp in React (@bezda/rhp-react) against rhp (CSS)

| Measure | rhp in React (@bezda/rhp-react) | rhp (CSS) | Ratio |
|---|---:|---:|---:|
| 20 bars: frame (ms) | 17 | 14 | 1.22× |
| 20 bars: total (ms) | 20 | 17 | 1.17× |
| 1,000 bars: frame (ms) | 111 | 100 | 1.10× |
| 1,000 bars: total (ms) | 114 | 104 | 1.10× |
| 50 charts: frame (ms) | 49 | 38 | 1.28× |
| 50 charts: total (ms) | 52 | 43 | 1.22× |
| Update: latency (ms) | 1.7 | 1.6 | 1.06× |
| Update: main thread per change (ms) | 8.0 | 7.9 | 1.01× |
| Drag: frame gap p50 (ms) | 17 | 17 | 0.99× |
| Drag: dropped frames | 0 | 0 |  |
| Drag, CPU 4x slower: dropped frames | 0 | 0 |  |
| Memory: JS heap (MB) | 4.0 | 2.8 | 1.41× |
| Memory: DOM nodes | 3470 | 3373 | 1.03× |
| Size: total (kB) | 99.5 | 27.7 | 3.59× |
| Size: without Solid (kB) | 18.8 | 18.4 | 1.02× |

## Web components over Solid: scale

The scale charts (static) as web components against the same charts in Solid, and the ratio (web / Solid).
An rhp-web scatter point is its slat element holding a Dot, where the Solid slat returns the bare Dot.

| Chart | rhp-web: frame (ms) | rhp: frame (ms) | Ratio | rhp-web: total (ms) | rhp: total (ms) | Ratio | rhp-web: DOM elements | rhp: DOM elements |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1,000 scatter points | 53 | 34 | 1.55× | 54 | 35 | 1.53× | 2034 | 1031 |
| 10,000 scatter points | 425 | 242 | 1.76× | 431 | 265 | 1.63× | 20034 | 10031 |
| 1,000 line points | 17 | 13 | 1.30× | 19 | 15 | 1.27× | 34 | 30 |
| 100,000 line points | 95 | 62 | 1.54× | 115 | 84 | 1.38× | 34 | 30 |

## Scale

Chromium 153.0.8010.12, started 2026-10-14T13:04:50.502Z.
Completed: 2026-10-14T13:13:31.016Z.
Libraries: 11.
Median of five fresh pages per scenario.
The frame time covers the call's frame; total covers main-thread work through the two seconds after that frame.
DOM elements are connected elements added to the document, counted outside the timing window.

### 1,000 scatter points

| Library | Frame (ms) | Total (ms) | DOM elements | Errors |
|---|---:|---:|---:|---:|
| D3 | 10 | 12 | 1073 | 0 |
| Observable Plot | 13 | 15 | 1046 | 0 |
| rhp (static) | 34 | 35 | 1031 | 0 |
| rhp-web (static) | 53 | 54 | 2034 | 0 |
| Vega-Lite | 40 | 41 | 1112 | 0 |
| Highcharts | 33 | 138 | 1057 | 0 |
| Chart.js | 35 | 248 | 3 | 0 |
| ECharts | 44 | 263 | 4 | 0 |
| ApexCharts | 43 | 281 | 1092 | 0 |
| AntV G2 | 86 | 326 | 2 | 0 |
| Recharts | 116 | 617 | 3084 | 0 |

### 10,000 scatter points

| Library | Frame (ms) | Total (ms) | DOM elements | Errors |
|---|---:|---:|---:|---:|
| D3 | 35 | 37 | 10073 | 0 |
| Observable Plot | 38 | 40 | 10046 | 0 |
| Vega-Lite | 103 | 104 | 10112 | 0 |
| ECharts | 38 | 187 | 5 | 0 |
| rhp (static) | 242 | 265 | 10031 | 0 |
| rhp-web (static) | 425 | 431 | 20034 | 0 |
| Highcharts | 108 | 383 | 10057 | 0 |
| Chart.js | 132 | 1161 | 3 | 0 |
| ApexCharts | 196 | 1288 | 10092 | 0 |
| Recharts | 862 | 2031 | 30084 | 0 |
| AntV G2 | 410 | 2414 | 2 | 0 |

### 1,000 line points

| Library | Frame (ms) | Total (ms) | DOM elements | Errors |
|---|---:|---:|---:|---:|
| D3 | 7.8 | 9.4 | 64 | 0 |
| Observable Plot | 12 | 13 | 47 | 0 |
| rhp (static) | 13 | 15 | 30 | 0 |
| rhp-web (static) | 17 | 19 | 34 | 0 |
| Vega-Lite | 34 | 35 | 122 | 0 |
| Highcharts | 26 | 57 | 57 | 0 |
| ApexCharts | 23 | 59 | 94 | 0 |
| AntV G2 | 38 | 85 | 2 | 0 |
| ECharts | 28 | 155 | 4 | 0 |
| Chart.js | 32 | 216 | 3 | 0 |
| Recharts | 38 | 290 | 84 | 0 |

### 100,000 line points

| Library | Frame (ms) | Total (ms) | DOM elements | Errors |
|---|---:|---:|---:|---:|
| D3 | 41 | 50 | 64 | 0 |
| rhp (static) | 62 | 84 | 30 | 0 |
| rhp-web (static) | 95 | 115 | 34 | 0 |
| Observable Plot | 72 | 86 | 37 | 0 |
| ECharts | 150 | 174 | 4 | 0 |
| Vega-Lite | 179 | 222 | 107 | 0 |
| AntV G2 | 253 | 435 | 2 | 0 |
| Highcharts | 176 | 839 | 61 | 0 |
| ApexCharts | 80 | 1180 | 91 | 0 |
| Chart.js | 921 | 1915 | 3 | 0 |
| Recharts | 576 | 2221 | 84 | 0 |
