// The named helper forms that function-valued attributes take in plain HTML (coerce.js, type "fn"): a name and its
// arguments, mapped to rhp's own helpers. Not an evaluator: an attribute naming no helper stays a string.
//   order="sortBy:sold"        sortBy("sold")            order="sortBy:sold:desc"   sortBy("sold", "desc")
//   ticks="every:10"           every(10)                 ticks="every:10:ends"      every(10, { ends: true })
// Imported for its side effect; it exports nothing.
import { sortBy, every } from "@bezda/rhp";
import { registerNamed } from "./coerce.js";
import { report } from "./registry.js";

// A form that can't be read is reported, and the prop is left unset (as if the attribute were not there)
const invalid = (message) => {
  report(new Error("rhp-web: " + message));
  return undefined;
};

registerNamed("sortBy", ([key, direction, ...more]) => {

  if (key == null || key === "" || more.length) return invalid(`order="sortBy:key" or "sortBy:key:asc" or "sortBy:key:desc" (got sortBy:${[key, direction, ...more].join(":")})`);
  if (direction != null && direction !== "asc" && direction !== "desc") return invalid(`sortBy's direction is asc or desc, not ${JSON.stringify(direction)}`);

  return sortBy(String(key), direction ?? "asc");
});

registerNamed("every", ([step, ends, ...more]) => {

  if (typeof step !== "number" || !(step > 0) || more.length) return invalid(`ticks="every:step" or "every:step:ends", with a step above 0 (got every:${[step, ends, ...more].join(":")})`);
  if (ends != null && ends !== "ends" && typeof ends !== "boolean") return invalid(`every's second part is "ends" (every:${step}:ends), not ${JSON.stringify(ends)}`);

  return every(step, { ends: ends === "ends" || ends === true });
});
