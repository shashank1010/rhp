// rhp as web components (web/): the charts of rhp.solid.jsx written as markup, both static. A scatter plot is an overlap
// <rhp-plot> given its points as the rows property, drawn by <point-row>, a slat holding one Dot (so each point is the
// slat element plus its Dot, where rhp.solid.jsx's slat returns the bare Dot); a line is one <curve-row> holding a Line.
import { slat, h, Dot, Line } from "../../web/src/index.js";

slat("point-row", (d) => h(Dot, { at: () => d.x, cross: () => d.y, size: "4px" }));
slat("curve-row", (d) => h(Line, { points: () => d.points }));

const draw = (el, markup) => {
  el.innerHTML = markup;
  return el.querySelector("rhp-plot");
};
export default {
  name: "rhp-web",
  scatter(el, pts) {
    draw(el, `<rhp-chart scale="[0, 100]" cross="[0, 100]" height="400" static><rhp-plot overlap><template><point-row></point-row></template></rhp-plot></rhp-chart>`).rows = pts;
  },
  line(el, pts) {
    const plot = draw(el, `<rhp-chart scale="[0, ${pts.length - 1}]" cross="[-2, 2]" height="400" static><rhp-plot overlap><template><curve-row></curve-row></template></rhp-plot></rhp-chart>`);
    // points is no attribute of the plot, so it has no points property: data gives the new data group
    plot.data = { points: [pts.map((p) => [p.x, p.y])] };
  },
};
