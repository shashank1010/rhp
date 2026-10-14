// rhp as web components, static: <rhp-chart static>, the counterpart of rhp-static. A change draws every row again.
import { benchRow, make } from "./rhp-web.js";
const mount = make(" static");
export default { name: "rhp-web (static)", mount: (el, rows, o) => (benchRow(), mount(el, rows, o)) };
