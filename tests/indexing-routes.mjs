import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const origin = "https://axym.org";
const dist = path.resolve("dist");
const routes = ["/", "/work/", "/work/iewc/", "/work/terel/", "/work/pptrain/"];

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

console.log("Axym indexing route test: PASS");
