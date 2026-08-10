import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { describe, expect, it } from "vitest";
import Navbar from "./Navbar";
import WorkCard from "./WorkCard";

describe("canonical internal navigation", () => {
  it("links directly to trailing-slash work routes", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <Navbar />
        <WorkCard item={{ slug: "iewc", title: "IEWC", summary: "Summary" }} />
      </StaticRouter>,
    );

    expect(html).toContain('href="/work/"');
    expect(html).toContain('href="/work/iewc/"');
  });
});
