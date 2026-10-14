// npm run build (in web/)
//   dist/rhp-web.js    the elements, rhp and Solid in one minified module, for a page with no build step (a CDN):
//                      <script type="module" src=".../rhp-web.js"> defines the elements, and
//                      import { slat, h, Bar } from ".../rhp-web.js" gives everything @shashank1010/rhp-web exports
//   dist/posters.css   rhp's poster looks (src/posters.css), for a page that wants them
//
// Inside rhp's repository the bundle is built from rhp's source at this commit (@bezda/rhp -> ../src/index.js, its JSX
// compiled and its CSS embedded as rhp's own build does). With RHP_WEB_FROM=package it is built from the installed
// @bezda/rhp (web/node_modules or a parent node_modules) instead. Either way the build runs inside rhp's repository
// only: it imports rhp's scripts/bundle.mjs, which needs esbuild and Babel from the root node_modules. There is one
// Solid in the bundle: every solid-js import resolves to the copy rhp itself resolves.
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { standalone, solidNotice, jsx, cssText, oneSolid } from "../../scripts/bundle.mjs";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(web, "..");
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

function inRepo() {

  try {
    return readJson(path.join(repo, "package.json")).name === "@bezda/rhp" && fs.existsSync(path.join(repo, "src/index.js"));
  } catch {
    return false;
  }
}

// The directory of package `name` as Node would find it from `from` (node_modules here or in a parent directory)
function packageDir(name, from) {

  for (let d = from; ; d = path.dirname(d)) {
    const candidate = path.join(d, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    if (path.dirname(d) === d) return null;
  }
}

const copyright = (dir) => {
  try {
    return fs.readFileSync(path.join(dir, "LICENSE"), "utf8").match(/^Copyright .*$/m)?.[0];
  } catch {
    return undefined;
  }
};

// Builds dist/rhp-web.js and dist/posters.css into outDir. options.from: "source" (rhp's src in this repository) or
// "package" (the installed @bezda/rhp); by default the source when in the repository.
export async function buildWeb(outDir = path.join(web, "dist"), options = {}) {

  const from = options.from ?? process.env.RHP_WEB_FROM ?? (inRepo() ? "source" : "package");
  let rhpDir, solidFrom, esbuildOptions, postersCss;
  if (from === "source") {
    if (!inRepo()) throw new Error("rhp-web build: from: \"source\" needs rhp's repository around web/");
    rhpDir = repo;
    solidFrom = path.join(repo, "src");
    postersCss = path.join(repo, "src/posters.css");
    esbuildOptions = { alias: { "@bezda/rhp": path.join(repo, "src/index.js") }, plugins: [oneSolid(solidFrom), jsx(), cssText] };
  } else {
    rhpDir = packageDir("@bezda/rhp", web);
    if (!rhpDir) throw new Error("rhp-web build: @bezda/rhp is not installed (npm install in web/), and web/ is not in rhp's repository");
    solidFrom = rhpDir;
    postersCss = path.join(rhpDir, "dist/posters.css");
    // rhp's dist imports solid-js/web for its side effects only in places; solid-js says it has none, as esbuild knows
    esbuildOptions = { plugins: [oneSolid(solidFrom)], logOverride: { "ignored-bare-import": "silent" } };
  }
  const solidDir = packageDir("solid-js", solidFrom);
  if (!solidDir) throw new Error("rhp-web build: solid-js is not installed");

  const own = readJson(path.join(web, "package.json"));
  const rhp = readJson(path.join(rhpDir, "package.json"));
  const notice = `/*! ${own.name} ${own.version} with @bezda/rhp ${rhp.version}${from === "source" ? " (source)" : ""} (https://github.com/bezda-team/rhp) | MIT License${copyright(rhpDir) ? ", " + copyright(rhpDir) : ""} */`;

  fs.mkdirSync(outDir, { recursive: true });
  const js = path.join(outDir, "rhp-web.js");
  const css = path.join(outDir, "posters.css");
  await standalone(path.join(web, "src/index.js"), js, {
    ...esbuildOptions,
    banner: { js: solidNotice(solidDir) + "\n" + notice },
  });
  // The poster looks are the page's CSS, not rhp's: copied as they are, comments and all
  fs.copyFileSync(postersCss, css);

  return {
    from,
    files: [js, css].map((f) => {
      const data = fs.readFileSync(f);
      return { file: f, bytes: data.length, gzip: zlib.gzipSync(data, { level: 9 }).length };
    }),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { from, files } = await buildWeb();
  const notes = ["the elements, rhp and Solid (from " + (from === "source" ? "rhp's source" : "the installed @bezda/rhp") + ")", "the poster looks, if linked"];
  files.forEach(({ file, bytes, gzip }, k) => console.log(`${path.relative(web, file)} ${bytes} B, ${gzip} B gzip (${notes[k]})`));
}
