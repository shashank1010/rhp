// @shashank1010/rhp-web: rhp charts as web components. Everything @bezda/rhp/standalone exports is exported here too (rhp,
// Solid's primitives, html, render, the store), with h (Solid's hyperscript) for slats written with no build step.
// The one exception is rhp's slat(settings?, fn): this package's slat(tag, settings?, fn) replaces it.
import type { JSX } from "solid-js";
import type {
  ChartProps,
  PlotSettings,
  SlatLayout,
  Slat,
  Row,
  Ticks,
  Format,
  ThemeValues,
  Color,
  Shape,
  ManyDotsValue,
  BarProps,
  DotProps,
  TickProps,
  LabelProps,
  CellProps,
  PlaceProps,
  AreaProps,
  LineProps,
} from "@bezda/rhp";

export * from "@bezda/rhp/standalone";
/** Solid's hyperscript (solid-js/h): slats written in plain JS, with no build step and no eval (CSP-safe).
 *  h(Bar, { to: () => d.sold }), h("div", { class: "row" }, h(Label, {}, () => d.name)). */
export { default as h } from "solid-js/h";

/** What a slat's fn gives for a row: anything Solid inserts (a node, text, a list), or a function that gives one, as
 *  h() returns. */
export type SlatContent = JSX.Element | (() => SlatContent) | readonly SlatContent[];

/** A slat element's settings: rhp's SlatLayout (thickness, inset, room, css), and attrs for the row's own element;
 *  helpers for a slat written as a template string. */
export interface SlatSettings<T extends object = Record<string, any>> extends SlatLayout {
  /** Attributes, class, style and event handlers for the row's root (the slat element itself), from its row. It runs
   *  again when what it reads changes: attrs: (d) => ({ class: "row", "data-name": d.name, onClick: ... }). */
  attrs?: (d: Row<T>) => Record<string, unknown>;
  /** For a template string: names its {bindings} read besides the row's columns. {tone} is helpers.tone(d), and a
   *  helper wins over a column of the same name. on:click="{select}" calls helpers.select(event, d). */
  helpers?: Record<string, SlatHelper<T>>;
}

/** A template string's helper: (d) => value for a {binding}, or (event, d) => ... for an on:event attribute. */
export type SlatHelper<T extends object = Record<string, any>> = (d: any, row: Row<T>) => unknown;

/** A custom element name: lower case letters, with a dash. */
export type SlatTag = `${string}-${string}`;

/** Defines <tag> as a slat element: a chart's <rhp-plot> draws one per row (<template><tag></tag></template>), and fn(d)
 *  gives the row's content. Returns the rhp slat type behind it, which a Plot in JS takes too. */
export function slat<T extends object = Record<string, any>>(tag: SlatTag, fn: (d: Row<T>) => SlatContent): Slat<T>;
export function slat<T extends object = Record<string, any>>(tag: SlatTag, settings: SlatSettings<T>, fn: (d: Row<T>) => SlatContent): Slat<T>;
/** Defines <tag> as a slat element whose content is a template string with {bindings}:
 *  slat("fruit-row", `<rhp-label edge="start">{name}</rhp-label><rhp-bar to="{sold}"></rhp-bar>`). Defined again
 *  with the same string and settings, it is the same slat; with another string or other settings, it throws. */
export function slat<T extends object = Record<string, any>>(tag: SlatTag, template: string): Slat<T>;
export function slat<T extends object = Record<string, any>>(tag: SlatTag, settings: SlatSettings<T>, template: string): Slat<T>;

/** The base class of slat elements, for a slat written as a class:
 *  class FruitRow extends RhpSlat { static layout = { thickness: 32 }; draw(d) { return h(Bar, { to: () => d.sold }); } }
 *  customElements.define("fruit-row", FruitRow); */
export class RhpSlat extends HTMLElement {
  /** thickness, inset and room, as rhp's slat() takes them. */
  static layout?: Omit<SlatLayout, "css">;
  /** CSS scoped to this slat's rows. Setting it later restyles them in place, wherever they are drawn. */
  static css?: SlatLayout["css"];
  /** Attributes for the row's root, from its row (as SlatSettings.attrs). */
  static attrs?: (d: Row<any>) => Record<string, unknown>;
  /** Runs once per row, inside the row's owner; returns the row's content (or appends it to this itself). */
  draw(d: Row<any>): SlatContent | void;
}

/** Defines the elements (rhp-chart, rhp-plot, ...). Importing the package already does it; a name already defined is skipped. */
export function define(): void;

// A slat function for any row type (a method's parameter is bivariant, so a Slat<Fruit> is one)
type AnySlat = { slat(d: Row<any>): SlatContent }["slat"];

/** A slat for a <rhp-plot> or <rhp-scale> given as a property: a slat function (from slat() or rhp's slat()) or a slat
 *  element's tag. */
export type SlatSource = AnySlat | string;

/** set(key, value) and get(key) for props whose name HTMLElement has (animate, role, style, title) or that have no
 *  property; a known key takes its own type. undefined removes what a property gave (the attribute's value comes back). */
interface Props<Known> {
  set<K extends string>(key: K, value: K extends keyof Known ? Known[K] | undefined : unknown): void;
  get<K extends string>(key: K): K extends keyof Known ? Known[K] | undefined : unknown;
}

// <rhp-chart>

type ChartKnown = Omit<ChartProps, "children" | "ref"> & { ref?: (el: HTMLDivElement) => void };
type ChartProperties = Pick<ChartKnown, "scale" | "cross" | "ticks" | "crossTicks" | "orientation" | "height" | "aspect" | "static" | "theme" | "label" | "format" | "crossFormat" | "ref">;

/** <rhp-chart>: a Chart. Its <rhp-plot>, <rhp-scale>, <rhp-axis> and <rhp-many-dots> children describe it (hidden, in
 *  the light DOM); any other child is passed to the Chart in DOM order. Every Chart prop is a property (animate and role
 *  through set() and get()), and the declarative ones attributes too (scale="[0, 30]", cross-ticks="false"). role and
 *  aria-* attributes are the host's own and are not passed to the Chart (label names the chart; set("role", ...) and
 *  set("aria-...", ...) reach it). */
export interface RhpChart extends ChartProperties, Props<ChartKnown> {}
export class RhpChart extends HTMLElement {
  /** The rendered .rhp-chart element (null until the chart is drawn). */
  get chart(): HTMLDivElement | null;
}

// <rhp-plot>

type LayoutKnown = Pick<SlatLayout, "thickness" | "inset" | "room" | "css">;
type PlotKnown = Omit<PlotSettings, "children" | "ref"> & LayoutKnown & { ref?: (el: HTMLDivElement) => void };
type PlotProperties = Pick<PlotKnown, "order" | "reorder" | "orientation" | "overlap" | "slats" | "key" | "rows" | "thick" | "static" | "keyboard" | "class" | "thickness" | "inset" | "room" | "css" | "ref">;

/** <rhp-plot>: a Plot inside a <rhp-chart>. Its settings (order, key, ...) and the slat's layout overrides (thickness,
 *  inset, room, css) are known names; any other attribute or property is a data group (plot.sold = [12, 18]). Its slat is
 *  the one slat element in its <template>, the template's markup with {bindings}, or .slat. */
export interface RhpPlot extends PlotProperties, Props<PlotKnown> {
  /** A data group, by name (one named by an attribute, by set(), or set as a property before the plot connected). */
  [group: string]: unknown;
}
export class RhpPlot extends HTMLElement {
  /** The slat, replacing the template's: a slat function or a slat element's tag. undefined goes back to the template. */
  get slat(): SlatSource | undefined;
  set slat(v: SlatSource | null | undefined);
  /** Every data group at once; data groups given by property and missing from a new object are removed. */
  get data(): Record<string, unknown>;
  set data(groups: Record<string, unknown> | null | undefined);
  /** The rendered .rhp-plot element (null until drawn). */
  get plot(): HTMLDivElement | null;
}

// <rhp-scale>

type ScaleKnown = { ticks?: Ticks; class?: string; style?: JSX.CSSProperties; ref?: (el: HTMLDivElement) => void } & LayoutKnown;

/** <rhp-scale>: a Scale (the chart's scale drawn by a slat, one per tick, whose d is a ScaleTick) inside a <rhp-chart>.
 *  Its slat is as a <rhp-plot>'s: a slat element or markup with {bindings} in its <template>, or .slat. */
export interface RhpScale extends Pick<ScaleKnown, "ticks" | "class" | "ref" | "thickness" | "inset" | "room" | "css">, Props<ScaleKnown> {}
export class RhpScale extends HTMLElement {
  /** The tick slat, replacing the template's: a slat function or a slat element's tag. */
  get slat(): SlatSource | undefined;
  set slat(v: SlatSource | null | undefined);
  /** The rendered .rhp-scale element (null until drawn). */
  get plot(): HTMLDivElement | null;
}

// <rhp-axis>

type AxisKnown = { ticks?: Ticks; format?: Format };

/** <rhp-axis>: an Axis (grid lines and numbers at its ticks) inside a <rhp-chart>, besides the chart's own. */
export interface RhpAxis extends AxisKnown, Props<AxisKnown> {}
export class RhpAxis extends HTMLElement {}

// <rhp-theme>

type ThemeKnown = ThemeValues & { value?: ThemeValues };

/** <rhp-theme>: the theme of every <rhp-chart> below it (nested themes merge outer to inner). Its keys come from value
 *  and from one attribute or property per key, which wins over value's. */
export interface RhpTheme extends ThemeKnown, Props<ThemeKnown> {}
export class RhpTheme extends HTMLElement {
  /** The keys this element gives (value's, then each key's own). */
  themeValue(): ThemeValues;
}

// <rhp-many-dots>

/** One value for every point, a list read by point index, or a (row, index) => value accessor. */
export type PerPoint<T, V> = ManyDotsValue<T, V> | readonly V[];
interface ManyDotsKnown<T> {
  rows?: readonly T[];
  /** Value-axis coordinate: a row field's name, a list, or an accessor. */
  at?: string | PerPoint<T, number>;
  /** Cross-axis coordinate: a row field's name, a list, or an accessor. */
  cross?: string | PerPoint<T, number>;
  /** A row field's name, or a function of the row, that identifies a point. */
  key?: string | ((row: T, index: number) => unknown);
  color?: PerPoint<T, Color | null | undefined>;
  size?: PerPoint<T, number | string | null | undefined>;
  shape?: PerPoint<T, Shape | null | undefined>;
  pointClass?: PerPoint<T, string | null | undefined>;
  /** A CSS declaration list ("opacity: .5"), a style object, a list of them, or an accessor. */
  pointStyle?: string | PerPoint<T, JSX.CSSProperties | null | undefined>;
  class?: string;
  style?: JSX.CSSProperties | string;
  ref?: (el: HTMLDivElement) => void;
}
/** What set() takes beyond the forms above: the attributes and handlers ManyDots puts on its element (role, aria-*,
 *  id, classList, data-*, onClick, ...). role and aria-* are attributes too. */
type ManyDotsSettable<T> = ManyDotsKnown<T> & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof ManyDotsKnown<T> | "children">;

/** <rhp-many-dots>: a ManyDots scatter collection inside a <rhp-chart> with a cross scale. Draws once rows, at and
 *  cross are set. */
export interface RhpManyDots<T = any> extends Omit<ManyDotsKnown<T>, "style">, Props<ManyDotsSettable<T>> {}
export class RhpManyDots<T = any> extends HTMLElement {
  /** The rendered .rhp-manydots element (null until drawn). */
  get dots(): HTMLDivElement | null;
}

// <rhp-poster>

type PosterKnown = { look?: string; kicker?: JSX.Element; title?: JSX.Element; dek?: JSX.Element; note?: JSX.Element };

/** <rhp-poster>: a Poster (kicker, headline, dek, the chart, a note) around its children. The title part is reached with
 *  set("title", v) (HTMLElement's title is the tooltip), or a child with slot="title". */
export interface RhpPoster extends Omit<PosterKnown, "title">, Props<PosterKnown> {}
export class RhpPoster extends HTMLElement {
  /** The rendered <figure class="poster"> (null until drawn). */
  get figure(): HTMLElement | null;
}

// Blocks as elements: <rhp-bar> <rhp-dot> <rhp-tick> <rhp-label> <rhp-cell> <rhp-place> <rhp-area> <rhp-line>

/** A block prop as a property: its value, or an accessor read inside the block (bar.to = () => d.sold). */
export type Live<V> = V | (() => V);
type BlockProperties<P, K extends keyof P, E extends Element> = { [Key in K]?: Live<P[Key]> } & { ref?: (el: E) => void };

/** The base class of the block elements: a display: contents host that draws its Solid block inside, under the slat's
 *  row. Made inside a slat's fn (h("rhp-bar", { to: () => d.sold })) or by a template with {bindings}; made anywhere
 *  else it draws nothing. */
export class RhpBlock extends HTMLElement {
  /** Any prop by name (also style, title, handlers). */
  set(key: string, value: unknown): void;
  get(key: string): unknown;
  /** The rendered block (null until drawn). */
  get block(): Element | null;
  /** Draws the block once with these props (values, or getters it reads live) and children: what a template with
   *  {bindings} does. A block drawn this way reports set() and property writes, and changes nothing. */
  bind(props: Record<string, unknown>, children?: readonly Node[]): void;
}

export interface RhpBar extends BlockProperties<BarProps, "from" | "to" | "thick" | "color" | "class" | "shape", HTMLDivElement> {}
export class RhpBar extends RhpBlock {}
export interface RhpDot extends BlockProperties<DotProps, "at" | "size" | "across" | "cross" | "color" | "class" | "shape", HTMLDivElement> {}
export class RhpDot extends RhpBlock {}
export interface RhpTick extends BlockProperties<TickProps, "at" | "thick" | "color" | "class" | "shape", HTMLDivElement> {}
export class RhpTick extends RhpBlock {}
export interface RhpLabel extends BlockProperties<LabelProps, "at" | "side" | "edge" | "cross" | "class" | "shape", HTMLDivElement> {}
export class RhpLabel extends RhpBlock {}
export interface RhpCell extends BlockProperties<CellProps, "value" | "color" | "class" | "shape", HTMLDivElement> {}
export class RhpCell extends RhpBlock {}
export interface RhpPlace extends BlockProperties<PlaceProps, "at" | "across" | "cross" | "class", HTMLDivElement> {}
export class RhpPlace extends RhpBlock {}
export interface RhpArea extends BlockProperties<AreaProps, "points" | "peak" | "mirror" | "smooth" | "color" | "class", SVGSVGElement> {}
export class RhpArea extends RhpBlock {}
export interface RhpLine extends BlockProperties<LineProps, "points" | "peak" | "fill" | "base" | "smooth" | "color" | "class", SVGSVGElement> {}
export class RhpLine extends RhpBlock {}

declare global {
  interface HTMLElementTagNameMap {
    "rhp-chart": RhpChart;
    "rhp-plot": RhpPlot;
    "rhp-scale": RhpScale;
    "rhp-axis": RhpAxis;
    "rhp-theme": RhpTheme;
    "rhp-many-dots": RhpManyDots;
    "rhp-poster": RhpPoster;
    "rhp-bar": RhpBar;
    "rhp-dot": RhpDot;
    "rhp-tick": RhpTick;
    "rhp-label": RhpLabel;
    "rhp-cell": RhpCell;
    "rhp-place": RhpPlace;
    "rhp-area": RhpArea;
    "rhp-line": RhpLine;
  }
}
