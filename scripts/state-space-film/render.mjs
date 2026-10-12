// Render the article film's 3D panel with the connectome demo's three.js scene.
//
//   PLAYWRIGHT=/path/to/node_modules/playwright [CHROMIUM_ARGS=...] node scripts/state-space-film/render.mjs \
//     --path <dir with path.json + path.bin> --out <frames dir> [--frames 4050 --fps 30 --size 720 --distance 3.55]
//
// path.json/path.bin come from `python -m axosim_demo.natural_manifold place` (Axym-Labs/axosim-demo);
// the reference cloud is the demo's public/demo/connectome/state-cloud. Frames are PNGs holding the raw
// premultiplied canvas (composite as rgb + background * (1 - alpha), as the browser does), plus meta.json.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";
import { parseArgs } from "node:util";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const { values } = parseArgs({
  options: {
    path: { type: "string" },
    out: { type: "string" },
    frames: { type: "string", default: "4050" },
    fps: { type: "string", default: "30" },
    size: { type: "string", default: "720" },
    distance: { type: "string", default: "3.55" },
  },
});
if (!values.path || !values.out) throw new Error("--path and --out are required");
const size = Number(values.size);
const fps = Number(values.fps);
const frames = Number(values.frames);
const distance = Number(values.distance);
mkdirSync(values.out, { recursive: true });

function png(raw, width, height) {
  // Flip to top row first and prepend PNG filter byte 0 to each row.
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const source = (height - 1 - y) * width * 4;
    raw.copy(rows, y * (width * 4 + 1) + 1, source, source + width * 4);
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
    return Buffer.concat([head, data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const bundle = await build({
  entryPoints: [join(here, "main.ts")],
  bundle: true,
  write: false,
  format: "esm",
  target: "es2020",
});
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright");
// Software WebGL by default: portable, and some GPU drivers lose the first headless context.
const args = (process.env.CHROMIUM_ARGS ?? "--use-angle=swiftshader --enable-unsafe-swiftshader").split(" ").filter(Boolean);
const browser = await chromium.launch({ args });
const page = await browser.newPage();
const files = {
  "/main.js": [bundle.outputFiles[0].contents, "text/javascript"],
  "/": ['<!doctype html><meta charset="utf-8"><body style="margin:0"><script type="module" src="/main.js"></script>', "text/html"],
};
const cloudDir = join(root, "public/demo/connectome");
await page.route("http://film.local/**", (route) => {
  const url = new URL(route.request().url());
  if (files[url.pathname]) return route.fulfill({ body: Buffer.from(files[url.pathname][0]), contentType: files[url.pathname][1] });
  const [, area, name] = url.pathname.split("/");
  const dir = area === "cloud" ? cloudDir : area === "path" ? values.path : null;
  if (!dir) return route.fulfill({ status: 404 });
  return route.fulfill({ body: readFileSync(join(dir, name)) });
});
page.on("console", (message) => console.log("[page]", message.text()));
await page.goto("http://film.local/");
await page.waitForFunction(() => typeof window.filmSetup === "function");
await page.evaluate((options) => window.filmSetup(options), { width: size, height: size, distance, fps });
const started = Date.now();
for (let index = 0; index < frames; index++) {
  const raw = Buffer.from(await page.evaluate((i) => window.filmFrame(i), index), "base64");
  writeFileSync(join(values.out, `frame-${String(index).padStart(5, "0")}.png`), png(raw, size, size));
  if (index % 300 === 0) console.log(`frame ${index}/${frames} ${((Date.now() - started) / 1000).toFixed(0)} s`);
}
await browser.close();
const meta = {
  frames,
  fps,
  width: size,
  height: size,
  distance,
  camera: { fov: 38, direction: [2.2, 1.0, 2.6] },
  auto_rotate_speed: 0.6,
  rotation: "OrbitControls autoRotate stepped by 1/fps per frame: 2*pi*0.6/60 rad/s, one turn per 100 s",
  alpha: "premultiplied",
  path: JSON.parse(readFileSync(join(values.path, "path.json"), "utf8")),
};
writeFileSync(join(values.out, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log("done", frames, "frames");
