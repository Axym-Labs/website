import fm from "front-matter";

export interface WorkItem {
  slug: string;
  title: string;
  /** "update": research updates and articles, shown as dated cards with a blog layout. */
  category: "product" | "research" | "idea" | "update" | "demo";
  summary: string;
  eyebrow?: string;
  /** Visual for cards: a cover from public/work/covers/ or the item's first figure. */
  cover_image?: string;
  /** "contain" (default) frames a figure on paper; "cover" fills the frame. */
  cover_fit?: "contain" | "cover";
  cover_animated?: boolean;
  cover_poster?: string;
  use_cover_as_card_bg?: boolean;
  show_cover_in_detail?: boolean;
  external_url?: string;
  external_url_label?: string;
  main_points?: [string, string][];
  draft: boolean;
  /** false hides the item from /work/ and api/work.json (read by davidewiest.com). */
  listed?: boolean;
  /** false hides the item from the axym.org homepage only (default true). */
  homepage?: boolean;
  author?: string;
  /** Kind in the sheet's title block when the category does not say it, e.g. "library". */
  kind?: string;
  date: string;
  rank?: number;
  content: string;
  links?: { label: string; url: string; kind?: string }[];
  content_format?: "markdown" | "html";
}


// Parse markdown files with frontmatter
const parseWorkItem = (markdownContent: string): WorkItem => {
  const { attributes, body } = fm<Partial<WorkItem>>(markdownContent);
  return {
    slug: attributes.slug,
    title: attributes.title,
    category: attributes.category,
    summary: attributes.summary,
    eyebrow: attributes.eyebrow,
    cover_image: attributes.cover_image,
    cover_fit: attributes.cover_fit,
    cover_animated: attributes.cover_animated,
    cover_poster: attributes.cover_poster,
    use_cover_as_card_bg: attributes.use_cover_as_card_bg,
    show_cover_in_detail: attributes.show_cover_in_detail,
    external_url: attributes.external_url,
    external_url_label: attributes.external_url_label,
    main_points: attributes.main_points,
    draft: attributes.draft,
    listed: attributes.listed,
    homepage: attributes.homepage,
    author: attributes.author,
    kind: attributes.kind,
    date: (attributes.date as unknown) instanceof Date ? (attributes.date as unknown as Date).toISOString().slice(0, 10) : attributes.date,
    rank: attributes.rank,
    content: body,
    links: attributes.links,
    content_format: attributes.content_format || "markdown",
  };
};

// Import markdown files
// import realTimeInferenceContent from "../content/work/real-time-inference.md?raw";

// export const workItems: WorkItem[] = [
//   parseWorkItem(realTimeInferenceContent),
// ];

const markdownFiles = import.meta.glob('../content/work/*.md', {
  query: '?raw',
  import: 'default',
});
const latexHtmlFiles = import.meta.glob('../generated/work/*.html', {
  query: '?raw',
  import: 'default',
});

export async function getWorkItems(): Promise<WorkItem[]> {
  const entries = Object.entries({ ...markdownFiles, ...latexHtmlFiles });

  const workItems: WorkItem[] = [];

  for (const [, importer] of entries) {
    const content = (await importer()) as string;
    workItems.push(parseWorkItem(content));
  }

  return workItems;
}

export interface ResourceLink {
  /** Icon kind: arxiv, alphaxiv, hfpapers, github, huggingface, code, data, docs, package, demo, home, email. */
  kind: string;
  label: string;
  url: string;
}

const decodeEntities = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .trim();

/**
 * Links of an item: the links line of its LaTeX page (\makepublicationlinks),
 * or the front-matter `links` of a Markdown item.
 */
export function resourceLinks(item: Pick<WorkItem, "content" | "links">): ResourceLink[] {
  const links: ResourceLink[] = [];
  const anchor = /<a\s+class=['"][^'"]*\bpublication-link-([a-z]+)['"]\s+href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/g;
  for (const match of item.content?.matchAll(anchor) ?? []) {
    links.push({ kind: match[1], url: match[2].replace(/&amp;/g, "&"), label: decodeEntities(match[3]) });
  }
  for (const link of item.links ?? []) {
    links.push({ kind: link.kind ?? "home", label: link.label, url: link.url });
  }
  return links;
}

const byRankThenDate = (a: WorkItem, b: WorkItem) => {
  if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
  if (a.rank !== undefined) return -1;
  if (b.rank !== undefined) return 1;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
};

export const isUpdate = (item: WorkItem) => item.category === "update";

/** Items for the updates grid rather than the featured work list: updates and interactive demos. */
const isGridItem = (item: WorkItem) => item.category === "update" || item.category === "demo";

/** Papers and software: /work/ shows the listed ones, the homepage additionally drops homepage: false. */
export function workEntries(items: WorkItem[], { homepage = false } = {}): WorkItem[] {
  return items
    .filter((item) => !item.draft && !isGridItem(item) && item.listed !== false)
    .filter((item) => !homepage || item.homepage !== false)
    .sort(byRankThenDate);
}

/**
 * Research updates, articles, and demos, newest first. `listed` is ignored
 * here: it only governs /work/'s paper list and api/work.json.
 */
export function updateEntries(items: WorkItem[], { homepage = false } = {}): WorkItem[] {
  return items
    .filter((item) => !item.draft && isGridItem(item))
    .filter((item) => !homepage || item.homepage !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const itemHref = (item: Pick<WorkItem, "slug" | "external_url">) => item.external_url ?? `/work/${item.slug}/`;

export function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
