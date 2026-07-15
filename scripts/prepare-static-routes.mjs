import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";

const origin = "https://axym.org";
const dist = path.resolve("dist");
const generated = path.resolve("src/generated/work");
const baseHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const setHead = (html, item, route) => {
  const title = `${item.title} | Axym Labs`;
  const canonical = `${origin}${route}`;
  const schemaType = item.category === "product" ? "SoftwareSourceCode" : item.category === "research" ? "ScholarlyArticle" : "Article";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": schemaType,
    name: item.title,
    headline: item.title,
    description: item.summary,
    url: canonical,
    author: { "@type": "Person", name: "Davide Wiest" },
    publisher: { "@type": "Organization", name: "Axym Labs", url: origin },
    datePublished: item.date,
  }).replaceAll("<", "\\u003c");

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(item.summary)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(item.summary)}" />`)
    .replace(/<meta property="og:type"[^>]*>/, '<meta property="og:type" content="article" />')
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)
    .replace("</head>", `<script type="application/ld+json">${schema}</script>\n  </head>`);
};

const items = fs.readdirSync(generated)
  .filter((name) => name.endsWith(".html"))
  .map((name) => fm(fs.readFileSync(path.join(generated, name), "utf8")))
  .filter(({ attributes }) => !attributes.draft)
  .sort((a, b) => (a.attributes.rank ?? 999) - (b.attributes.rank ?? 999));

for (const { attributes } of items) {
  const route = `/work/${attributes.slug}`;
  const routeDir = path.join(dist, "work", attributes.slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), setHead(baseHtml, attributes, route));
}

const workDir = path.join(dist, "work");
fs.mkdirSync(workDir, { recursive: true });
fs.writeFileSync(path.join(workDir, "index.html"), baseHtml
  .replace(/<title>.*?<\/title>/, "<title>Work | Axym Labs</title>")
  .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${origin}/work" />`));

const urls = ["/", "/work", ...items.map(({ attributes }) => `/work/${attributes.slug}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((route) => `  <url><loc>${origin}${route}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

console.log(`Prepared ${items.length + 1} static work routes and sitemap.xml`);
