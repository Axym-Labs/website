import { describe, expect, it } from "vitest";
import { resourceLinks, updateEntries, workEntries, type WorkItem } from "./work-items";
import { updateBibtex } from "@/lib/citation";

const item = (overrides: Partial<WorkItem>): WorkItem => ({
  slug: "x",
  title: "X",
  category: "research",
  summary: "",
  draft: false,
  date: "2026-01-01",
  content: "",
  ...overrides,
});

describe("work and update lists", () => {
  const items = [
    item({ slug: "paper", rank: 1 }),
    item({ slug: "library", rank: 2, homepage: false }),
    item({ slug: "hidden", rank: 0, listed: false }),
    item({ slug: "draft", draft: true }),
    item({ slug: "update-old", category: "update", date: "2026-09-01", listed: false }),
    item({ slug: "update-new", category: "update", date: "2026-11-01" }),
    item({ slug: "demo", category: "demo", date: "2026-10-11", listed: false }),
  ];

  it("keeps homepage: false items on /work/ and off the homepage", () => {
    expect(workEntries(items).map((i) => i.slug)).toEqual(["paper", "library"]);
    expect(workEntries(items, { homepage: true }).map((i) => i.slug)).toEqual(["paper"]);
  });

  it("lists updates newest first, separately from work", () => {
    expect(updateEntries(items, { homepage: true }).map((i) => i.slug)).toEqual(["update-new", "demo", "update-old"]);
  });
});

describe("resourceLinks", () => {
  it("reads the links line of a rendered LaTeX page", () => {
    const content = "<nav class='publication-links'><a class='publication-link publication-link-arxiv' href='https://arxiv.org/abs/2611.16039'>arXiv</a><a class=\"publication-link publication-link-github\" href=\"https://github.com/Axym-Labs/iewc\">Code</a></nav>";
    expect(resourceLinks({ content })).toEqual([
      { kind: "arxiv", label: "arXiv", url: "https://arxiv.org/abs/2611.16039" },
      { kind: "github", label: "Code", url: "https://github.com/Axym-Labs/iewc" },
    ]);
  });

  it("skips disabled entries, which have no link", () => {
    const content = "<nav class='publication-links'><span class='publication-link publication-link-arxiv publication-link-disabled' title='Not available yet'>arXiv</span><a class='publication-link publication-link-github' href='https://github.com/Axym-Labs/iewc'>Code</a></nav>";
    expect(resourceLinks({ content })).toEqual([
      { kind: "github", label: "Code", url: "https://github.com/Axym-Labs/iewc" },
    ]);
  });
});

describe("updateBibtex", () => {
  it("builds a copyable @misc entry from front matter", () => {
    expect(updateBibtex({ slug: "axosim-fly-geometry", title: "Finding Visual Dynamics", date: "2026-10-01", author: "Davide Wiest" })).toBe(
      [
        "@misc{wiest2026axosimflygeometry,",
        "  author       = {Wiest, Davide},",
        "  title        = {Finding Visual Dynamics},",
        "  year         = {2026},",
        "  howpublished = {Axym Labs research update},",
        "  url          = {https://axym.org/work/axosim-fly-geometry/}",
        "}",
      ].join("\n"),
    );
  });
});
