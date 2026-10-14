// rhp as web components, the slat written as a template string with {bindings} and block elements (web/src/template.js)
// instead of a function with h: compiled once, each row a clone of it whose block elements are bound to the row with
// no store of their own. The chart markup and the properties are as in rhp-web.
import { slat } from "../../web/src/index.js";
import { make } from "./rhp-web.js";

let row;
const benchRow = () => (row ??= slat("bench-row", `
  <rhp-label edge="start">{name}</rhp-label>
  <rhp-bar to="{value}"></rhp-bar>
  <rhp-label at="{value}">{value}</rhp-label>`));

const mount = make();
export default { name: "rhp-web (template string)", mount: (el, rows, o) => (benchRow(), mount(el, rows, o)) };
