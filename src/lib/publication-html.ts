import { linkIconHtml } from "@/lib/link-icons";
import { iconForHref, platformIconSvg } from "@/lib/platform-icons";

const COPY_BUTTON =
  '<button type="button" class="publication-copy" data-copy-code aria-label="Copy to clipboard">Copy</button>';

/**
 * Site-side adjustments to the HTML that the LaTeX renderer (tex4ht) emits:
 * - tex4ht writes every space inside verbatim blocks as U+00A0, so copied
 *   BibTeX and shell commands contain non-breaking spaces that BibTeX and
 *   shells reject; inside <pre> ordinary spaces already keep the layout.
 * - verbatim blocks get a copy button (handled by LatexContent).
 * - action buttons get the icon of the platform they link to, and links-line
 *   entries (\makepublicationlinks), including disabled ones, the icon of
 *   their kind.
 * - section headings get stable ids for the table of contents.
 * - booktabs \cmidrule leaves a stray <span> inside <tr> and a row of empty
 *   cells, whose column span tex4ht gets wrong; the row is marked and hidden.
 */
export function preparePublicationHtml(html: string): string {
  return html
    .replace(/<pre class='verbatim'([^>]*)>([\s\S]*?)<\/pre>/g, (_match, attributes: string, body: string) =>
      `<div class="publication-code">${COPY_BUTTON}<pre class='verbatim'${attributes}>${body.replace(/\u00a0|&nbsp;|&#x00A0;|&#160;/g, " ")}</pre></div>`,
    )
    .replace(/<span class='cmidrule'>[\s\S]*?<\/span>/g, "")
    .replace(/<tr id='[^']*'[^>]*>((?:\s*<td\b[^>]*>\s*<\/td>)+)\s*<\/tr>/g, (_match, cells: string) =>
      `<tr class='cmidrule'>${cells}</tr>`,
    )
    .replace(/<a class='publication-action' href='([^']*)'>/g, (match, href: string) => {
      const icon = iconForHref(href);
      return icon ? `${match}${platformIconSvg(icon, "publication-action-icon")}` : match;
    })
    .replace(/(<(?:a|span) class=['"]publication-link publication-link-([a-z]+)(?: publication-link-disabled)?['"][^>]*>)/g, (_match, open: string, kind: string) =>
      `${open}${linkIconHtml(kind)}`,
    )
    .replace(/<(h[23]) class=['"]((?:like)?(?:sub)?sectionHead)['"]>([\s\S]*?)<\/\1>/g, (_match, tag: string, cls: string, inner: string) =>
      `<${tag} class="${cls}" id="${headingId(inner)}">${inner}</${tag}>`,
    );
}

const headingText = (inner: string) =>
  inner
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();

const headingId = (inner: string) =>
  headingText(inner)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Section and subsection headings of rendered LaTeX HTML, in order, for a table of contents. */
export function publicationHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const pattern = /<(h[23]) class=['"](?:(?:like)?(?:sub)?sectionHead|publication-citation-heading)['"][^>]*>([\s\S]*?)<\/\1>/g;
  for (const match of html.matchAll(pattern)) {
    const text = headingText(match[2]);
    if (!text) continue;
    headings.push({ id: match[0].includes("publication-citation-heading") ? "citation" : headingId(match[2]), text, level: match[1] === "h2" ? 2 : 3 });
  }
  return headings;
}

/** Text of a code block as it should land on the clipboard. */
export function codeBlockText(pre: HTMLElement): string {
  return (pre.textContent ?? "").replace(/\u00a0/g, " ").replace(/^\n/, "").replace(/\s+$/, "") + "\n";
}
