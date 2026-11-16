import type { WorkItem } from "@/data/work-items";

const ORIGIN = "https://axym.org";

const bibAuthor = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return `{${name.trim()}}`;
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(" ")}`;
};

const escapeBib = (text: string) => text.replace(/([&%$#_])/g, "\\$1");

/** BibTeX @misc entry for a research update, from its front matter. */
export function updateBibtex(item: Pick<WorkItem, "slug" | "title" | "date" | "author">): string {
  const authors = (item.author ?? "Axym Labs").split(/\s*(?:,|\band\b)\s*/).filter(Boolean);
  const year = String(item.date).slice(0, 4);
  const first = authors[0].split(/\s+/).pop() ?? "axym";
  const key = `${first}${year}${item.slug.replace(/[^a-z0-9]/gi, "")}`.toLowerCase();
  const fields: [string, string][] = [
    ["author", authors.map(bibAuthor).join(" and ")],
    ["title", escapeBib(item.title)],
    ["year", year],
    ["howpublished", "Axym Labs research update"],
    ["url", `${ORIGIN}/work/${item.slug}/`],
  ];
  const width = Math.max(...fields.map(([name]) => name.length));
  return `@misc{${key},\n${fields.map(([name, value]) => `  ${name.padEnd(width)} = {${value}}`).join(",\n")}\n}`;
}
