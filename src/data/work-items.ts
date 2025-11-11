import matter from "gray-matter";

export interface WorkItem {
  slug: string;
  title: string;
  category: "product" | "research" | "idea";
  summary: string;
  cover_image?: string;
  cover_animated?: boolean;
  cover_poster?: string;
  use_cover_as_card_bg?: boolean;
  external_url?: string;
  main_points?: [string, string][];
  draft: boolean;
  date: string;
  rank?: number;
  content: string;
  links?: { label: string; url: string }[];
}

// Import markdown files
import realTimeInferenceContent from "../content/work/real-time-inference.md?raw";
import attentionMechanismsContent from "../content/work/attention-mechanisms.md?raw";
import metaLearningContent from "../content/work/meta-learning-thoughts.md?raw";

// Parse markdown files with frontmatter
const parseWorkItem = (markdownContent: string): WorkItem => {
  const { data, content } = matter(markdownContent);
  return {
    slug: data.slug,
    title: data.title,
    category: data.category,
    summary: data.summary,
    cover_image: data.cover_image,
    cover_animated: data.cover_animated,
    cover_poster: data.cover_poster,
    use_cover_as_card_bg: data.use_cover_as_card_bg,
    external_url: data.external_url,
    main_points: data.main_points,
    draft: data.draft,
    date: data.date,
    rank: data.rank,
    content,
    links: data.links,
  };
};

export const workItems: WorkItem[] = [
  parseWorkItem(realTimeInferenceContent),
  parseWorkItem(attentionMechanismsContent),
  parseWorkItem(metaLearningContent),
];
