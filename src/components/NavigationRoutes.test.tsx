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

  it("links external work entries to their own site", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <WorkCard item={{ slug: "axo", title: "AxoSim and AxoBench", summary: "Summary", external_url: "https://axo.axym.org" }} />
      </StaticRouter>,
    );

    expect(html).toContain('href="https://axo.axym.org"');
    expect(html).not.toContain('href="/work/axo/"');
  });

  it("keeps site pages and the AxoSim site in the navbar, platform links out of it", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <Navbar />
      </StaticRouter>,
    );

    expect(html).toContain('href="/#about"');
    expect(html).toContain('href="https://axo.axym.org"');
    expect(html).not.toContain("github.com");
    expect(html).not.toContain("huggingface.co");
  });

  it("renders the Axym wordmark without a graphic mark", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <Navbar />
      </StaticRouter>,
    );

    expect(html).toContain('aria-label="Axym Labs home"');
    expect(html).toContain("Axym");
    expect(html).not.toContain("<img");
  });
});
