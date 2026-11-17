import { describe, expect, it } from "vitest";
import { featureLabel, share } from "./format";
import { defaultTarget, splitWords } from "./words";

describe("KPSA demo formatting", () => {
  it("labels features by 1-based block", () => {
    expect(featureLabel(7, 1024)).toBe("L8 · #1024");
  });

  it("shows scores as percent with two significant digits", () => {
    expect(share(0.0123)).toBe("1.2 %");
    expect(share(0.00045)).toBe("0.045 %");
    expect(share(0.123)).toBe("12 %");
  });
});

describe("passage words", () => {
  const tokens = ["The", " bumbl", "ebee", ",", " is", "\n", " here"];

  it("starts a word at the passage start and at tokens with leading whitespace", () => {
    expect(splitWords(tokens)).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 4 },
      { start: 4, end: 5 },
      { start: 5, end: 6 },
      { start: 6, end: 7 },
    ]);
  });

  it("defaults to a word that has a target", () => {
    expect(defaultTarget({ id: "p", tokens, targets: { 2: {} as never, 4: {} as never } })).toBe(4);
  });
});
