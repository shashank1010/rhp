// Whether rhp and these elements run on one Solid. A page or a build can end up with two copies of solid-js (one next
// to @bezda/rhp, one next to this package: web/node_modules/solid-js after an npm link there, or a bundler that didn't
// dedupe). rhp's components then run on the other Solid: its effects don't see this Solid's update cycle, so an onMount
// runs at once, before the element it is for exists, and nothing draws (the first sign is "Cannot read properties of
// undefined (reading 'querySelectorAll')" from Chart's onMount). Checked once, by a bare Chart made in a root of this
// Solid: with one Solid its onMount waits for the root's update to end; with two it throws right away.
import { createRoot } from "solid-js";
import { Chart } from "@bezda/rhp";

let one;

export function oneSolid() {

  if (one !== undefined) return one;
  one = true;
  createRoot((dispose) => {
    try {
      Chart({ ticks: false });
    } catch {
      one = false;
    }
    dispose(); // before the root's effects run: the Chart's onMount never does
  });

  return one;
}

export const TWO_SOLIDS = "rhp-web: @bezda/rhp and @shashank1010/rhp-web run on two different copies of solid-js, so rhp's components can't see the elements' context and nothing draws. Make both resolve to one solid-js: in a bundler dedupe or alias it (Vite: resolve.dedupe: [\"solid-js\"]); after an npm link, delete the solid-js inside web/node_modules (the linked @bezda/rhp has its own); or load the one-file build, @shashank1010/rhp-web/standalone.";
