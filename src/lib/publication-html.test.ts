import { describe, expect, it } from "vitest";
import { iconForHref } from "./platform-icons";
import { preparePublicationHtml, publicationHeadings } from "./publication-html";

describe("preparePublicationHtml", () => {
  it("restores ordinary spaces in verbatim blocks and adds a copy button", () => {
    const html = preparePublicationHtml("<pre class='verbatim' id='verbatim-1'>\n@misc{x,\n\u00a0\u00a0year\u00a0=\u00a0{2026}\n}\n</pre>");

    expect(html).not.toContain("\u00a0");
    expect(html).toContain("  year = {2026}");
    expect(html).toContain("data-copy-code");
  });

  it("marks booktabs cmidrule rows and keeps hline rows", () => {
    const html = preparePublicationHtml(
      "<table><tr id='TBL-1-4-' style='vertical-align:baseline;'><td class='td11'>   </td><td class='td11' colspan='2'></td><span class='cmidrule'><!-- x --></span>\n</tr><tr class='hline'><td></td></tr></table>",
    );

    expect(html).toBe("<table><tr class='cmidrule'><td class='td11'>   </td><td class='td11' colspan='2'></td></tr><tr class='hline'><td></td></tr></table>");
  });

  it("puts the platform icon on action buttons", () => {
    const html = preparePublicationHtml("<a class='publication-action' href='https://arxiv.org/abs/2611.16039'>Read paper</a>");

    expect(html).toMatch(/^<a class='publication-action' href='https:\/\/arxiv\.org\/abs\/2611\.16039'><svg class="publication-action-icon"/);
  });
});

describe("iconForHref", () => {
  it.each([
    ["https://arxiv.org/abs/2611.16039", "arxiv"],
    ["https://github.com/Axym-Labs/iewc", "github"],
    ["https://github.com/Axym-Labs/marey/blob/main/docs/guide/README.md", "docs"],
    ["https://huggingface.co/datasets/Axym-Labs/axobench", "huggingface"],
    ["https://pypi.org/project/axosim/", "pypi"],
    ["https://www.nuget.org/packages/Marey.Plot", "nuget"],
    ["https://axo.axym.org/datasets/", "docs"],
    ["/work/axosim-connectome-demo/", "demo"],
    ["mailto:contact@axym.org", "mail"],
    ["/work/iewc/", undefined],
  ])("%s -> %s", (href, icon) => {
    expect(iconForHref(href)).toBe(icon);
  });
});

describe("links line and headings", () => {
  it("puts the icon of its kind on each links-line entry", () => {
    const html = preparePublicationHtml(
      "<nav aria-label='Links' class='publication-links'><a class='publication-link publication-link-github' href='https://github.com/Axym-Labs/iewc'>Code</a><a class='publication-link publication-link-email' href='mailto:dw@axym.org'>dw@axym.org</a></nav>",
    );

    expect(html).toContain("<a class='publication-link publication-link-github' href='https://github.com/Axym-Labs/iewc'><svg class=\"publication-link-icon\"");
    expect(html).toContain("✉️");
  });

  it("gives section headings ids that the table of contents links to", () => {
    const source = '<h2 class="sectionHead"><a id="x1-1000"></a>Background: Why do it?</h2><h3 class=\'subsectionHead\'><a id="x1-2000"></a>A &amp; B</h3><h2 class="likesectionHead"><a id="x1-3000"></a>References</h2>';
    const html = preparePublicationHtml(source);

    expect(html).toContain('id="background-why-do-it"');
    expect(publicationHeadings(source)).toEqual([
      { id: "background-why-do-it", text: "Background: Why do it?", level: 2 },
      { id: "a-b", text: "A & B", level: 3 },
      { id: "references", text: "References", level: 2 },
    ]);
  });
});

describe("author block", () => {
  it("drops an affiliation line that only names Axym Labs and keeps others", () => {
    const html = preparePublicationHtml(
      "<p class='publication-authors'>A</p><p class='publication-affiliations'>Axym Labs</p><p class='publication-affiliations'>TU Darmstadt</p>",
    );

    expect(html).toBe("<p class='publication-authors'>A</p><p class='publication-affiliations'>TU Darmstadt</p>");
  });
});
