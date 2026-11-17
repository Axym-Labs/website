import { useEffect, useState } from "react";
import { featureLabel, prob, share } from "./format";
import type { Budget, RankedFeature } from "./types";
import { Bar, PanelHeading } from "./ui";

const INITIAL = 12;
const STEP = 25;

interface ListProps {
  features: RankedFeature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** What the deactivation column measures, e.g. "tabby cat". */
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
      <PanelHeading aside={`top ${features.length}`}>Features to deactivate</PanelHeading>
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

interface BudgetProps {
  budgets: Budget[];
  /** Probability after zeroing the top-k set, aligned with `budgets`. */
  effects: number[];
  intact: number;
  outcome: string;
  totalFeatures: number;
}

/** Probability of the model's output after deactivating the top-k features at each budget. */
export function BudgetSummary({ budgets, effects, intact, outcome, totalFeatures }: BudgetProps) {
  const rows = [{ key: "intact", label: "None", detail: "", p: intact }, ...budgets.map((budget, i) => ({ key: String(budget.pct), label: `Top ${budget.k}`, detail: `${budget.pct} %`, p: effects[i] }))];
  return (
    <div>
      <PanelHeading aside={`of ${totalFeatures.toLocaleString("en-US")} features`}>Deactivating the top features together</PanelHeading>
      <p className="mb-3 text-[0.8rem] leading-snug text-[#5c5966]">
        Probability of <span className="font-medium text-[#18161f]">“{outcome}”</span> after zeroing the top-ranked set.
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[4.25rem_3rem_minmax(0,1fr)_3rem] items-center gap-x-2.5 text-sm">
            <span className="font-medium text-[#18161f]">{row.label}</span>
            <span className="text-xs tabular-nums text-[#8a8794]">{row.detail}</span>
            <Bar value={row.p ?? 0} tone={row.key === "intact" ? "muted" : "brand"} />
            <span className="text-right text-xs tabular-nums text-[#4b4857]">{row.p !== undefined ? prob(row.p) : "–"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
