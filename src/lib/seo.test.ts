import { afterEach, describe, expect, it } from "vitest";
import { setPageMetadata } from "./seo";

const originalDocument = globalThis.document;

afterEach(() => {
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: originalDocument,
  });
});

describe("setPageMetadata", () => {
  it("uses the direct trailing-slash URL for directory-route metadata", () => {
    const elements: Array<Record<string, string>> = [];
    const fakeDocument = {
      title: "",
      createElement: () => ({ setAttribute(name: string, value: string) { this[name] = value; } }),
      head: {
        appendChild: (element: Record<string, string>) => elements.push(element),
        querySelector: () => null,
      },
    };
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: fakeDocument,
    });

    setPageMetadata({
      title: "IEWC | Axym Labs",
      description: "A project page",
      path: "/work/iewc",
      type: "article",
    });

    const canonical = elements.find((element) => element.rel === "canonical");
    expect(canonical?.href).toBe("https://axym.org/work/iewc/");
    expect(elements.find((element) => element.property === "og:url")?.content)
      .toBe("https://axym.org/work/iewc/");
  });
});
