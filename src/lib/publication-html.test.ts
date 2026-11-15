import { describe, expect, it } from "vitest";
import { iconForHref } from "./platform-icons";
import { preparePublicationHtml } from "./publication-html";

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
    ["https://github.com/Jonathan-Schaefer-git/marey/blob/main/docs/guide.md", "docs"],
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
