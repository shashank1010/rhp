// rhp as web components, the slat written with Solid's html (template cloning; needs unsafe-eval under a CSP) instead
// of h. The chart markup and the properties are as in rhp-web.
import { slat, html, Bar, Label } from "../../web/src/index.js";
import { make } from "./rhp-web.js";

let row;
const benchRow = () => (row ??= slat("bench-row", (d) => html`
  <${Label} edge="start">${() => d.name}<//>
  <${Bar} to=${() => d.value} />
  <${Label} at=${() => d.value}>${() => d.value}<//>
`));

const mount = make();
export default { name: "rhp-web (slat with html)", mount: (el, rows, o) => (benchRow(), mount(el, rows, o)) };
