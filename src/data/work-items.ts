import fm from "front-matter";

export interface WorkItem {
  slug: string;
  title: string;
  category: "product" | "research" | "idea";
  summary: string;
  cover_image?: string;
  cover_animated?: boolean;
  cover_poster?: string;
  use_cover_as_card_bg?: boolean;
  show_cover_in_detail?: boolean;
  external_url?: string;
  external_url_label?: string;
  main_points?: [string, string][];
  draft: boolean;
  date: string;
  rank?: number;
  content: string;
  links?: { label: string; url: string }[];
}


// Parse markdown files with frontmatter
const parseWorkItem = (markdownContent: string): WorkItem => {
  const { attributes, body } = fm<any>(markdownContent);
  return {
    slug: attributes.slug,
    title: attributes.title,
    category: attributes.category,
    summary: attributes.summary,
    cover_image: attributes.cover_image,
    cover_animated: attributes.cover_animated,
    cover_poster: attributes.cover_poster,
    use_cover_as_card_bg: attributes.use_cover_as_card_bg,
    show_cover_in_detail: attributes.show_cover_in_detail,
    external_url: attributes.external_url,
    external_url_label: attributes.external_url_label,
    main_points: attributes.main_points,
    draft: attributes.draft,
    date: attributes.date,
    rank: attributes.rank,
    content: body,
    links: attributes.links,
  };
};

// Import markdown files
// import realTimeInferenceContent from "../content/work/real-time-inference.md?raw";

// export const workItems: WorkItem[] = [
//   parseWorkItem(realTimeInferenceContent),
// ];

const markdownFiles = import.meta.glob('../content/work/*.md', { as: 'raw' });

export async function getWorkItems(): Promise<WorkItem[]> {
  const entries = Object.entries(markdownFiles);

  const workItems: WorkItem[] = [];

  for (const [, importer] of entries) {
    const content = await importer();
    workItems.push(parseWorkItem(content));
  }

  return workItems;
}