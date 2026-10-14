// Builds what the examples load into out/, so that web/examples/ can be served on its own (npx serve web/examples):
//   out/rhp-web.js, out/posters.css  the package's build (as npm run build makes dist/), built here from rhp's source
//   out/react.js                     react.jsx for react.html: JSX compiled for React (automatic runtime), React bundled
//                                    from rhp's root node_modules, "@shashank1010/rhp-web" left to the page's import map
//   cd web && npm run examples       (or node examples/build.mjs)
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { buildWeb } from "../scripts/build.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function buildExamples(outDir = path.join(here, "out")) {
  await buildWeb(outDir);
  const outfile = path.join(outDir, "react.js");
  await build({
    entryPoints: [path.join(here, "react.jsx")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    external: ["@shashank1010/rhp-web"],
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    logLevel: "warning",
  });
  return outfile;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(here, "out");
  await buildExamples(out);
  console.log(["rhp-web.js", "posters.css", "react.js"].map((f) => path.relative(process.cwd(), path.join(out, f))).join("\n"));
}
