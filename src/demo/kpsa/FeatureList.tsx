import { useEffect, useState } from "react";
import { factorLabel, featureLabel, prob, share } from "./format";
import type { Budget, RankedFeature } from "./types";
import { Bar, PanelHeading } from "./ui";

const INITIAL = 12;
const STEP = 25;

interface ListProps {
  features: RankedFeature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** What the p-after column measures, e.g. "tabby cat". */
  outcome: string;
  /** Resets the "show more" state when the input changes. */
  inputKey: string;
}

/** Ranked feature list of the attribution view. */
export function FeatureList({ features, selectedId, onSelect, outcome, inputKey }: ListProps) {
  const [shown, setShown] = useState(INITIAL);
  useEffect(() => setShown(INITIAL), [inputKey]);
  const top = features[0]?.s ?? 1;
  const visible = features.slice(0, shown);

  return (
    <div>
      <PanelHeading aside={`top ${features.length}`}>Most sensitive features</PanelHeading>
      <div className="kpsa-list-head grid grid-cols-[1.75rem_minmax(6.5rem,1fr)_minmax(5rem,1.2fr)_4.75rem] items-end gap-x-3 border-b border-[#18161f]/10 pb-1.5 text-[0.7rem] font-medium text-[#6b6875]">
        <span className="text-right">#</span>
        <span>Feature</span>
        <span>KPSA score</span>
        <span className="text-right leading-tight" title={`Probability of “${outcome}” after zeroing this feature alone`}>
          p after
        </span>
      </div>
      <ul className="divide-y divide-[#18161f]/[0.06]">
        {visible.map((feature) => {
          const selected = feature.id === selectedId;
          return (
            <li key={feature.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(feature.id)}
                className={`group grid w-full grid-cols-[1.75rem_minmax(6.5rem,1fr)_minmax(5rem,1.2fr)_4.75rem] items-center gap-x-3 rounded-md py-[0.4rem] text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f21b6] ${
                  selected ? "bg-[#3f21b6]/[0.08]" : "hover:bg-[#18161f]/[0.035]"
                }`}
              >
                <span className="text-right text-xs tabular-nums text-[#8a8794]">{feature.rank}</span>
                <span className={`font-mono text-[0.8rem] ${selected ? "font-semibold text-[#3f21b6]" : "text-[#18161f]"}`}>{featureLabel(feature.l, feature.f)}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <Bar value={feature.s} max={top} tone={selected ? "brand" : "soft"} className="flex-1" />
                  <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[#4b4857]">{share(feature.s)}</span>
                </span>
                <span className="pr-1 text-right text-xs tabular-nums text-[#4b4857]">{feature.deact !== undefined ? prob(feature.deact) : ""}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {features.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + STEP)}
          className="mt-2 w-full rounded-md border border-dashed border-[#18161f]/15 py-1.5 text-xs font-medium text-[#4b4857] transition-colors hover:border-[#3f21b6]/40 hover:text-[#3f21b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6]"
        >
          Show {Math.min(STEP, features.length - shown)} more
        </button>
      )}
    </div>
  );
}

/** Cell tint: purple for a drop, grey for a rise, stronger for larger changes. */
function changeTint(p: number, intact: number): string {
  if (!Number.isFinite(p)) return "transparent";
  const change = Math.min(1, Math.abs(Math.log((p + 1e-4) / (intact + 1e-4))) / Math.log(100));
  const alpha = (0.04 + 0.26 * change).toFixed(3);
  return p < intact ? `rgba(63, 33, 182, ${alpha})` : `rgba(24, 22, 31, ${(0.03 + 0.1 * change).toFixed(3)})`;
}

interface InterventionProps {
  budgets: Budget[];
  factors: number[];
  /** Probability after scaling the top-k set, [budget][factor]. */
  sets: number[][];
  intact: number;
  outcome: string;
  totalFeatures: number;
}

/** Probability of the model's output after scaling the activations of the top-ranked set at each budget. */
export function InterventionTable({ budgets, factors, sets, intact, outcome, totalFeatures }: InterventionProps) {
  return (
    <div>
      <PanelHeading aside={`of ${totalFeatures.toLocaleString("en-US")} features`}>Intervening on the top features together</PanelHeading>
      <p className="mb-3 text-[0.8rem] leading-snug text-[#5c5966]">
        Probability of <span className="font-medium text-[#18161f]">“{outcome}”</span>, now <span className="tabular-nums text-[#18161f]">{prob(intact)}</span>,
        after multiplying the activations of the top-ranked set.
      </p>
      <table className="w-full table-fixed border-separate border-spacing-[3px] text-sm">
        <thead>
          <tr className="text-[0.7rem] font-medium text-[#6b6875]">
            <th scope="col" className="w-[4.5rem] text-left font-medium">
              <span className="sr-only">Set</span>
            </th>
            {factors.map((factor) => {
              const label = factorLabel(factor);
              return (
                <th key={factor} scope="col" className="pb-0.5 text-center font-medium leading-tight">
                  <span className="block font-mono text-[0.75rem] text-[#18161f]">{label.short}</span>
                  <span className="block">{label.long}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget, i) => (
            <tr key={budget.pct}>
              <th scope="row" className="text-left font-normal leading-tight">
                <span className="block font-medium text-[#18161f]">Top {budget.k}</span>
                <span className="block text-[0.7rem] tabular-nums text-[#8a8794]">{budget.pct} %</span>
              </th>
              {factors.map((factor, j) => {
                const p = sets[i]?.[j];
                return (
                  <td key={factor} className="rounded-md py-1.5 text-center text-xs tabular-nums text-[#18161f]" style={{ background: changeTint(p ?? NaN, intact) }}>
                    {p !== undefined ? prob(p) : "–"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
