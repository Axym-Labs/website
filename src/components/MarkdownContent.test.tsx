import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MarkdownContent from "./MarkdownContent";

const markdown = `Inline math $E = mc^2$.

Inline HTML: <span data-kind="inline">rendered inline</span>.

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

| Method | Score |
| --- | ---: |
| Baseline | 0.75 |

\`inline code\`

\`\`\`python
print("research")
\`\`\`

<figure data-kind="research">
  <img src="/work/neural-architecture.jpg" alt="A research diagram" />
  <figcaption>A useful research caption.</figcaption>
</figure>`;

const renderMarkdown = () =>
  renderToStaticMarkup(<MarkdownContent>{markdown}</MarkdownContent>);

describe("MarkdownContent", () => {
  it("renders math, GFM tables, and code", () => {
    const html = renderMarkdown();

    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).toContain("<table>");
    expect(html).toContain("language-python");
  });

  it("renders repository-controlled inline and block HTML", () => {
    const html = renderMarkdown();

    expect(html).toContain('<span data-kind="inline">rendered inline</span>');
    expect(html).toContain('<figure data-kind="research">');
    expect(html).toContain("<figcaption>A useful research caption.</figcaption>");
  });

  it("wraps wide tables for horizontal scrolling", () => {
    const html = renderMarkdown();

    expect(html).toContain('class="markdown-table-scroll"');
    expect(html).toContain('<div class="markdown-table-scroll"><table>');
  });
});
