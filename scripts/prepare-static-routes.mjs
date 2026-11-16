import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";

const origin = "https://axym.org";
const workDescription = "Papers, project pages, articles, and code from Axym Labs.";
const dist = path.resolve("dist");
const generated = path.resolve("src/generated/work");
const markdown = path.resolve("src/content/work");
const baseHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

// Front-matter `author` is a comma-separated list, split as in src/lib/citation.ts.
const authorSchema = (author = "Davide Wiest") => String(author)
  .split(/\s*(?:,|\band\b)\s*/)
  .filter(Boolean)
  .map((name) => (name === "Axym Labs"
    ? { "@type": "Organization", name, url: origin }
    : { "@type": "Person", name }));

const setHead = (html, item, route) => {
  const title = `${item.title} | Axym Labs`;
  const canonical = `${origin}${route}`;
  const schemaType = { product: "SoftwareSourceCode", research: "ScholarlyArticle", update: "BlogPosting" }[item.category] ?? "Article";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": schemaType,
    name: item.title,
    headline: item.title,
    description: item.summary,
    url: canonical,
    author: authorSchema(item.author),
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

const read = (dir, extension) => fs.existsSync(dir)
  ? fs.readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .map((name) => fm(fs.readFileSync(path.join(dir, name), "utf8")))
  : [];

const allItems = [...read(generated, ".html"), ...read(markdown, ".md")]
  .filter(({ attributes }) => !attributes.draft)
  .sort((a, b) => (a.attributes.rank ?? 999) - (b.attributes.rank ?? 999));
const items = allItems.filter(({ attributes }) => !attributes.external_url);

// Static JSON endpoint listing the work shown on /work/, in display order.
const apiDir = path.join(dist, "api");
fs.mkdirSync(apiDir, { recursive: true });
fs.writeFileSync(path.join(apiDir, "work.json"), `${JSON.stringify({
  source: `${origin}/work/`,
  items: allItems
    .filter(({ attributes }) => attributes.listed !== false)
    .map(({ attributes: a }) => ({
      slug: a.slug,
      title: a.title,
      eyebrow: a.eyebrow ?? null,
      category: a.category,
      summary: a.summary,
      date: a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date),
      url: a.external_url ?? `${origin}/work/${a.slug}/`,
    })),
}, null, 2)}\n`);

for (const { attributes } of items) {
  const route = `/work/${attributes.slug}/`;
  const routeDir = path.join(dist, "work", attributes.slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), setHead(baseHtml, attributes, route));
}

// Site pages with their own head (direct 200 on GitHub Pages).
const sitePages = [
  { route: "/work/", title: "Work | Axym Labs", description: workDescription },
  { route: "/about/", title: "About | Axym Labs", description: "Axym Labs is a small deep learning research group based in Darmstadt, Germany. It publishes papers, code, models, and data on continual, local, and task-agnostic learning, interpretability, and neuron simulation." },
  { route: "/contact/", title: "Contact | Axym Labs", description: "How to reach Axym Labs: email for questions and collaboration, the correspondence address for papers, and Discord." },
  { route: "/legal/", title: "Legal notice and privacy | Axym Labs", description: "Legal notice (Impressum) and privacy notice (Datenschutzerklärung) for axym.org." },
];
for (const page of sitePages) {
  const dir = path.join(dist, page.route.slice(1));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${origin}${page.route}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${origin}${page.route}" />`));
}

// Old routes of renamed items (front-matter `redirect_from`, one route or a
// list): a static page that GitHub Pages serves at the old URL, with the new
// URL as canonical, a meta refresh, and noindex, as jekyll-redirect-from does.
const redirectPage = (target) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting&hellip;</title>
    <link rel="canonical" href="${target}" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <script>location.replace(${JSON.stringify(target)} + location.hash);</script>
  </head>
  <body>
    <p>This page has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`;
const itemRoutes = new Set(items.map(({ attributes }) => `/work/${attributes.slug}/`));
let redirects = 0;
for (const { attributes } of items) {
  for (const from of [].concat(attributes.redirect_from ?? [])) {
    if (!/^\/work\/[a-z0-9-]+\/$/.test(from) || itemRoutes.has(from)) {
      throw new Error(`${attributes.slug}: invalid redirect_from route ${from}`);
    }
    const dir = path.join(dist, from.slice(1));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), redirectPage(`${origin}/work/${attributes.slug}/`));
    redirects += 1;
  }
}


const urls = ["/", "/work/", ...items.map(({ attributes }) => `/work/${attributes.slug}/`), "/about/", "/contact/", "/legal/"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((route) => `  <url><loc>${origin}${route}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

console.log(`Prepared ${items.length} work routes, ${sitePages.length} site pages, ${redirects} redirects, sitemap.xml, and api/work.json`);
