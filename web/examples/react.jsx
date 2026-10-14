// React 19 rendering rhp-web's elements: <rhp-chart> and <rhp-plot> are JSX like any tag, and the chart follows React
// state. Built by build.mjs into out/react.js (React bundled, "@shashank1010/rhp-web" left to the page's import map).
//
// How the data gets in: React 19 sets a prop on a custom element as a property when the element has a property of
// that name (`name in element`), and as a string attribute when it does not. A column such as `sold` only gets its
// property once the plot has that column, so on the first render `sold={[12, 18]}` would land as the attribute
// "12,18" (not JSON) and the plot would draw nothing until the next render. `data` and `scale` are properties of the
// element classes, so `data={{ name, sold }}` and `scale={[0, 30]}` always arrive as properties: React sets them
// before it inserts the element, and again on each render with the new object (a new number moves one bar; a new row
// adds one slat).
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { slat, h, Bar, Label, every } from "@shashank1010/rhp-web";

// The slat, once at module level: a name, a bar to the value, the value at the bar's end
slat("fruit-row", { thickness: 30, inset: 0.2, room: { start: 100, end: 40 }, css: ".rhp-bar { background: #3b7d5c }" }, (d) => [
  h(Label, { edge: "start" }, () => d.name),
  h(Bar, { to: () => d.sold }),
  h(Label, { at: () => d.sold }, () => d.sold),
]);

// A string prop on an element that has a property of that name is set as that property, as it is (not read like an
// attribute), so ticks takes every(10) and not "every:10". Made once: a new function on each render would re-set it.
const TICKS = every(10);
const MORE = ["Kiwis", "Mangoes", "Pears", "Plums", "Figs", "Limes", "Peaches", "Melons", "Papayas", "Lychees"];

function Fruit() {
  const [rows, setRows] = useState([
    { name: "Apples", sold: 12 },
    { name: "Bananas", sold: 18 },
    { name: "Cherries", sold: 7 },
  ]);
  const add = () => setRows((rs) => [...rs, { name: MORE[rs.length % MORE.length], sold: 3 + Math.round(Math.random() * 25) }]);
  const bump = () => setRows((rs) => rs.map((r, i) => (i === 0 ? { ...r, sold: (r.sold % 30) + 2 } : r)));
  const data = { name: rows.map((r) => r.name), sold: rows.map((r) => r.sold) };

  return (
    <>
      <p>
        <button id="add" onClick={add}>Add a fruit</button> <button id="bump" onClick={bump}>More {rows[0].name}</button>{" "}
        <span id="count">{rows.length} rows</span>
      </p>
      <rhp-chart scale={[0, 30]} ticks={TICKS} label="Fruit sold, crates">
        <rhp-plot data={data}>
          <template dangerouslySetInnerHTML={{ __html: "<fruit-row></fruit-row>" }} />
        </rhp-plot>
      </rhp-chart>
    </>
  );
}

createRoot(document.getElementById("root")).render(<Fruit />);
