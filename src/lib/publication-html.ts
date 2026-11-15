import { iconForHref, platformIconSvg } from "@/lib/platform-icons";

const COPY_BUTTON =
  '<button type="button" class="publication-copy" data-copy-code aria-label="Copy to clipboard">Copy</button>';

/**
 * Site-side adjustments to the HTML that the LaTeX renderer (tex4ht) emits:
 * - tex4ht writes every space inside verbatim blocks as U+00A0, so copied
 *   BibTeX and shell commands contain non-breaking spaces that BibTeX and
 *   shells reject; inside <pre> ordinary spaces already keep the layout.
 * - verbatim blocks get a copy button (handled by LatexContent).
 * - action buttons get the icon of the platform they link to.
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
    });
}

/** Text of a code block as it should land on the clipboard. */
export function codeBlockText(pre: HTMLElement): string {
  return (pre.textContent ?? "").replace(/\u00a0/g, " ").replace(/^\n/, "").replace(/\s+$/, "") + "\n";
}
