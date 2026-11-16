import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const origin = "https://axym.org";
const dist = path.resolve("dist");
const routes = [
  "/",
  "/work/",
  "/work/axosim/",
  "/work/axobench/",
  "/work/axosim-fly-geometry/",
  "/work/hierarchical-data-hypothesis/",
  "/work/kpsa/",
  "/work/axosim-connectome-demo/",
  "/work/iewc/",
  "/work/terel/",
  "/work/pptrain/",
  "/work/marey/",
  "/work/irregular-parameter-sharing/",
  "/work/prepretraining-not-ready-yet/",
];

const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

assert.deepEqual(
  sitemapUrls,
  routes.map((route) => `${origin}${route}`),
  "sitemap URLs must be the final trailing-slash URLs served directly by GitHub Pages",
);

for (const route of routes) {
  const htmlPath = route === "/"
    ? path.join(dist, "index.html")
    : path.join(dist, route.slice(1), "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const canonical = `${origin}${route}`;

  assert.match(
    html,
    new RegExp(`<link rel="canonical" href="${canonical}" \/>`),
    `${route} must declare its direct-200 URL as canonical`,
  );
  assert.match(
    html,
    new RegExp(`<meta property="og:url" content="${canonical}" \/>`),
    `${route} must expose the same direct-200 Open Graph URL`,
  );
}

// Old routes of renamed items redirect to the new route and stay out of the sitemap.
const redirects = {
  "/work/recursive-manifolds/": "/work/hierarchical-data-hypothesis/",
};
for (const [from, to] of Object.entries(redirects)) {
  const html = fs.readFileSync(path.join(dist, from.slice(1), "index.html"), "utf8");
  const target = `${origin}${to}`;
  assert.match(html, new RegExp(`<link rel="canonical" href="${target}" \/>`), `${from} must declare ${to} as canonical`);
  assert.match(html, new RegExp(`<meta http-equiv="refresh" content="0; url=${target}" \/>`), `${from} must redirect to ${to}`);
  assert.match(html, /<meta name="robots" content="noindex" \/>/, `${from} must not be indexed`);
  assert.ok(!sitemapUrls.includes(`${origin}${from}`), `${from} must not be in the sitemap`);
}

const workApi = JSON.parse(fs.readFileSync(path.join(dist, "api", "work.json"), "utf8"));
assert.ok(workApi.items.length > 0, "api/work.json must list the work items");
for (const item of workApi.items) {
  assert.ok(item.title && item.summary && /^https:\/\//.test(item.url), `api/work.json entry ${item.slug} is incomplete`);
}

console.log("Axym indexing route test: PASS");
