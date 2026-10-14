// rhp as web components, JS version: <rhp-chart animate>, the counterpart of rhp-js.
import { benchRow, make } from "./rhp-web.js";
const mount = make(" animate");
export default { name: "rhp-web (JS version)", mount: (el, rows, o) => (benchRow(), mount(el, rows, o)) };
