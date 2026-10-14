// The page side of the scale benchmark: one chart of n points, a scatter plot or a line, made at the start of a frame.
const stage = document.body.appendChild(document.createElement("div"));
stage.style.cssText = "width:600px;margin:8px";
// A person opening the page (not the runner, whose browser sets navigator.webdriver) gets a line of help, and sees
// any script error instead of a blank page
const hint = (text) => { const p = document.body.appendChild(document.createElement("p")); p.style.cssText = "margin:8px;font:14px system-ui;color:#555"; p.textContent = text; };
if (!navigator.webdriver) addEventListener("error", (e) => hint("Error: " + (e.message || e.error))), addEventListener("unhandledrejection", (e) => hint("Error: " + (e.reason?.message ?? e.reason)));
// Points from a fixed seed, so every library draws the same ones
function points(kind, n) {
  let s = 42;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  if (kind === "scatter") return Array.from({ length: n }, () => ({ x: rand() * 100, y: rand() * 100 }));
  let y = 0;
  return Array.from({ length: n }, (_, i) => ({ x: i, y: (y = Math.max(-1.9, Math.min(1.9, y + (rand() - 0.5) * 0.2))) }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inFrame = (f) => new Promise((r) => requestAnimationFrame(() => {
  const t0 = performance.now(); f();
  const c = new MessageChannel(); c.port1.onmessage = () => r(performance.now() - t0); c.port2.postMessage(0);
}));
// Opened by hand with ?demo=scatter:1000 (or line:1000), the page draws that chart and keeps it. Without it a page shows
// nothing: scale.mjs calls window.bench.run.
export function install(lib) {
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo) {
    const [kind = "scatter", n = "1000"] = demo.split(":");
    queueMicrotask(() => window.bench.run({ kind, n: Number(n) || 1000 }));
  } else if (!navigator.webdriver) {
    hint(`${lib.name}: this page draws nothing until the benchmark drives it. To look at a chart, open it with ?demo=scatter:1000 or ?demo=line:1000.`);
  }
  window.bench = {
    name: lib.name,
    async run({ kind, n }) {
      const pts = points(kind, n);
      await sleep(100);
      const box = stage.appendChild(document.createElement("div"));
      return inFrame(() => lib[kind](box, pts));
    },
  };
}
