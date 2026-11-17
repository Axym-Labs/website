import type { PassageData } from "./types";

/** Words of a passage: runs of tokens that start at a token beginning with whitespace, or at the passage start. */
export function splitWords(tokens: string[]): { start: number; end: number }[] {
  const words: { start: number; end: number }[] = [];
  tokens.forEach((token, i) => {
    if (i === 0 || /^\s/.test(token) || words.length === 0) words.push({ start: i, end: i + 1 });
    else words[words.length - 1].end = i + 1;
  });
  return words;
}

/** A default word to show: an early content word that has a target. */
export function defaultTarget(data: PassageData): number | null {
  const words = splitWords(data.tokens);
  const candidates = words.filter((w) => data.targets[w.start]);
  if (!candidates.length) return null;
  const content = candidates.find((w) => w.start >= 10 && /^\s?[A-Za-z]{4,}/.test(data.tokens[w.start]));
  return (content ?? candidates[0]).start;
}
