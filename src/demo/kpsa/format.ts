/** Feature id `{l}_{f}` as "L{l+1} · #{f}". */
export const featureLabel = (l: number, f: number) => `L${l + 1} · #${f}`;

export const featureId = (l: number, f: number) => `${l}_${f}`;

/** A KPSA score (share of the input's sensitivity, 0..1) as a percent with two significant digits. */
export function share(s: number): string {
  const percent = s * 100;
  if (percent === 0) return "0 %";
  const digits = percent >= 10 ? 0 : Math.max(0, 1 - Math.floor(Math.log10(percent)));
  return `${percent.toFixed(digits)} %`;
}

/** A probability as a percent: one decimal below 10 %, none above. */
export function prob(p: number): string {
  const percent = p * 100;
  if (percent >= 99.95) return "100 %";
  if (percent >= 10) return `${percent.toFixed(0)} %`;
  if (percent >= 0.1) return `${percent.toFixed(1)} %`;
  return percent > 0 ? "<0.1 %" : "0 %";
}

/** Budget as the share of all MLP features, e.g. "0.05 %". */
export const budgetLabel = (pct: number) => `${pct} %`;

/** A token for display: visible text without the leading space. */
export function tokenText(token: string): string {
  const text = token.replace(/^\s+/, "");
  if (text) return text;
  return token.includes("\n") ? "↵" : "␣";
}

/** Column label of an activation multiplier. */
export function factorLabel(factor: number): { short: string; long: string } {
  if (factor === 0) return { short: "×0", long: "deactivate" };
  if (factor < 1) return { short: `×${factor}`, long: "scale down" };
  return { short: `×${factor}`, long: "scale up" };
}
