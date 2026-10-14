// @shashank1010/rhp-web's types (web/index.d.ts): slat() with h, the element classes with rhp's prop types, the tag name map,
// and everything @bezda/rhp/standalone exports.
import {
  slat, h, define, RhpSlat, RhpChart, RhpPlot, RhpScale, RhpAxis, RhpTheme, RhpManyDots, RhpPoster, RhpBlock, RhpBar,
  Bar, Label, Line, Chart, Plot, sortBy, every, shape, html, render, createSignal, createStore, reconcile, restyle,
  type Slat, type Row, type SlatSettings,
} from "@shashank1010/rhp-web";

// slat(tag, fn) and slat(tag, settings, fn), typed rows, the rhp slat type back
type Fruit = { name: string; sold: number };
const FruitRow: Slat<Fruit> = slat<Fruit>("fruit-row", {
  thickness: 32,
  room: { start: 80, end: 40 },
  css: ".rhp-bar { opacity: .9 }",
  attrs: (d) => ({ class: "row", "data-name": d.name }),
}, (d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.sold, color: () => (d.sold > 15 ? "positive" : "muted") }),
]);
const PlainRow = slat("plain-row", (d) => h(Bar, { to: () => d.value as number }));
const HtmlRow = slat("html-row", (d: Row<Fruit>) => html`<${Bar} to=${() => d.sold} />`);
const settings: SlatSettings = { inset: 0.2, attrs: () => ({}) };
slat("other-row", settings, () => "text");
slat("node-row", () => document.createElement("b"));
restyle(FruitRow, ".rhp-bar { opacity: .5 }");

// @ts-expect-error: slat() needs fn
slat("no-fn", { thickness: 20 });
// @ts-expect-error: a slat tag is a custom element name, with a dash
slat("fruitrow", () => null);
// @ts-expect-error: the row's fields are typed
slat<Fruit>("typed-row", (d) => h(Bar, { to: () => d.price }));

// slat(tag, template) and slat(tag, settings, template): a template string with {bindings} and helpers
const TemplateRow: Slat<Fruit> = slat<Fruit>("template-row", {
  thickness: 30,
  helpers: { tone: (d) => (d.sold > 15 ? "positive" : "muted"), pick: (e: MouseEvent, d) => console.log(e.button, d.name) },
}, `<rhp-label edge="start">{name}</rhp-label><rhp-bar to="{sold}" color="{tone}" on:click="{pick}"></rhp-bar>`);
slat("bare-template-row", `<rhp-bar to="{value}"></rhp-bar>`);
// @ts-expect-error: a helper is a function
slat("bad-helper-row", { helpers: { tone: "positive" } }, `<rhp-bar color="{tone}"></rhp-bar>`);
// @ts-expect-error: the content is a function or a template string
slat("bad-content-row", { thickness: 20 }, 42);
document.createElement("rhp-bar").bind({ to: 3 }, [document.createTextNode("3")]);

// A slat written as a class
class ClassRow extends RhpSlat {
  static layout = { thickness: 24 };
  static css = ".rhp-bar { opacity: .8 }";
  draw(d: Row) {
    return h(Bar, { to: () => d.value });
  }
}
customElements.define("class-row", ClassRow);
define();

// The tag name map gives the element classes
const chart = document.querySelector("rhp-chart")!;
const plot = document.createElement("rhp-plot");
const chart2: RhpChart = chart;
chart.scale = [0, 30];
chart.ticks = every(10);
chart.crossTicks = false;
chart.orientation = "vertical";
chart.format = (v) => v + "%";
chart.theme = { ink: "#222", series: ["#0a7"] };
chart.ref = (el) => el.classList.add("x");
chart.set("animate", { duration: 300 });
chart.set("aria-describedby", "note");
const animate: boolean | object | undefined = chart.get("animate");
const drawn: HTMLDivElement | null = chart2.chart;
// @ts-expect-error: scale is [min, max]
chart.scale = "0, 30";
// @ts-expect-error: orientation is horizontal or vertical
chart.orientation = "diagonal";
// @ts-expect-error: set() checks a known prop's type
chart.set("height", "tall");
// @ts-expect-error: .chart is read only
chart.chart = null;

plot.order = sortBy("sold", "desc");
plot.key = "name";
plot.thickness = 24;
plot.room = { start: 60 };
plot.static = true;
plot.sold = [12, 18, 7];
plot.set("unitPrice", [1.5, 2, 3]);
plot.set("animate", ["sold"]);
plot.data = { name: ["A", "B"], sold: [1, 2] };
plot.slat = FruitRow;
plot.slat = "fruit-row";
plot.slat = undefined;
const rendered: HTMLDivElement | null = plot.plot;
const groups: Record<string, unknown> = plot.data;
chart.append(plot);
// @ts-expect-error: reorder is slide, move or refill
plot.reorder = "jump";
// @ts-expect-error: keyboard is a boolean
plot.keyboard = "yes";
// @ts-expect-error: .slat is a slat or a tag
plot.slat = 42;

const scale = document.createElement("rhp-scale") as RhpScale;
scale.ticks = [0, 10, 20];
scale.slat = slat("tick-row", (t: Row<{ at: number }>) => h(Label, { at: () => t.at }, () => t.at));
const axis: RhpAxis = document.createElement("rhp-axis");
axis.ticks = 4;
axis.format = (v) => v.toFixed(1);
const theme: RhpTheme = document.createElement("rhp-theme");
theme.value = { ink: "#111" };
theme.series = ["#f00", "#0f0"];
// @ts-expect-error: series is a list of colors
theme.series = "#f00";
const dots = document.createElement("rhp-many-dots") as RhpManyDots<{ x: number; y: number }>;
dots.rows = [{ x: 1, y: 2 }];
dots.at = (r) => r.x;
dots.cross = "y";
dots.color = "positive";
dots.size = [4, 6];
const collection: HTMLDivElement | null = dots.dots;
dots.set("aria-label", "Points");
dots.set("onClick", (e) => e.currentTarget.dataset.x);
dots.set("classList", { hot: true });
// @ts-expect-error: aria-label is a string
dots.set("aria-label", 5);
const poster: RhpPoster = document.createElement("rhp-poster");
poster.look = "day";
poster.kicker = document.createElement("b");
poster.set("title", "Bananas lead");
const figure: HTMLElement | null = poster.figure;

// Blocks as elements
const bar = document.createElement("rhp-bar");
const block: RhpBlock = bar;
bar.to = 12;
bar.to = () => 14;
bar.shape = shape(["M", 0, 0], ["L", 1, 0.5], ["L", 0, 1], ["Z"]);
bar.color = "series-2";
bar.set("title", "twelve");
const barEl: RhpBar = bar;
document.createElement("rhp-line").points = [[0, 1], [10, 2]];
// @ts-expect-error: to is a number
bar.to = "12";

// Everything standalone exports, from the same module
const [n, setN] = createSignal(1);
const [store, setStore] = createStore({ sold: [1, 2] });
setStore("sold", reconcile([1, 3]));
render(() => html`<${Chart} scale=${[0, 30]}><${Plot} sold=${() => store.sold}>${PlainRow}<//><//>`, document.body);
const line = Line;

export { HtmlRow, TemplateRow, ClassRow, animate, drawn, rendered, groups, collection, figure, block, barEl, n, setN, line };
