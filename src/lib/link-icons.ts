import { platformIconSvg, type PlatformIconName } from "@/lib/platform-icons";

// Icons of the links line, matching the papers' links line
// (axym-publication.sty): Hugging Face emoji for Hugging Face, the GitHub
// mark for GitHub code, house for the project page, envelope for
// correspondence; plus a page for arXiv and alphaXiv's alpha for papers.
const EMOJI: Record<string, string> = {
  arxiv: "📄",
  huggingface: "🤗",
  hfpapers: "🤗",
  code: "💻",
  data: "💾",
  docs: "📖",
  package: "📦",
  demo: "🧠",
  home: "🏠",
  email: "✉️",
};

const SVG: Record<string, PlatformIconName> = {
  github: "github",
};

export type LinkIcon =
  | { type: "emoji"; value: string }
  | { type: "svg"; value: PlatformIconName }
  | { type: "glyph"; value: string };

export function linkIcon(kind: string): LinkIcon {
  if (SVG[kind]) return { type: "svg", value: SVG[kind] };
  if (kind === "alphaxiv") return { type: "glyph", value: "α" };
  return { type: "emoji", value: EMOJI[kind] ?? "🔗" };
}

/** Icon markup for HTML strings that React does not render (LaTeX pages). */
export function linkIconHtml(kind: string): string {
  const icon = linkIcon(kind);
  if (icon.type === "svg") return platformIconSvg(icon.value, "publication-link-icon");
  const cls = icon.type === "glyph" ? "publication-link-icon publication-link-glyph" : "publication-link-icon publication-link-emoji";
  return `<span class="${cls}" aria-hidden="true">${icon.value}</span>`;
}
