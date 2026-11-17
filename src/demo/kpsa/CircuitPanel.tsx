import DepthDiagram from "./DepthDiagram";
import { factorLabel, prob } from "./format";
import type { Budget, RankedFeature } from "./types";
import { Panel, PanelHeading, PillChoice } from "./ui";

interface Props {
  budgets: Budget[];
  budget: number;
  onBudget: (pct: number) => void;
  features: RankedFeature[];
  layers: number;
  featuresPerLayer: number;
  layerMass: number[];
  factors: number[];
  /** Probability after scaling the circuit's activations, [budget][factor]. */
  sets: number[][];
  intact: number;
  outcome: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Sensitivity circuit at a chosen budget, drawn across depth. */
export default function CircuitPanel({ budgets, budget, onBudget, features, layers, featuresPerLayer, layerMass, factors, sets, intact, outcome, selectedId, onSelect }: Props) {
  const index = Math.max(0, budgets.findIndex((b) => b.pct === budget));
  const { k } = budgets[index] ?? { k: features.length };
  const circuit = features.slice(0, k);
  const effects = sets[index] ?? [];
  const total = layers * featuresPerLayer;

  return (
    <Panel label="Sensitivity circuit">
      <PanelHeading aside={<span className="tabular-nums">{`${k} of ${total.toLocaleString("en-US")} MLP features`}</span>}>Sensitivity circuit across depth</PanelHeading>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#5c5966]">Budget</span>
          <PillChoice label="Circuit budget" options={budgets.map((b) => ({ value: b.pct, label: `${b.pct} %` }))} value={budget} onChange={onBudget} />
        </div>
        <p className="text-[0.8rem] text-[#5c5966]">
          Probability of <span className="font-medium text-[#18161f]">“{outcome}”</span>: <span className="tabular-nums text-[#18161f]">{prob(intact)}</span>
        </p>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Probability after scaling the circuit's activations">
        {factors.map((factor, j) => {
          const label = factorLabel(factor);
          const p = effects[j];
          return (
            <div key={factor} className="rounded-md border border-[#18161f]/[0.08] bg-white/60 px-3 py-2">
              <p className="text-[0.7rem] text-[#6b6875]">
                <span className="font-mono text-[#18161f]">{label.short}</span> {label.long}
              </p>
              <p className={`text-base font-medium tabular-nums ${p !== undefined && p < intact ? "text-[#3f21b6]" : "text-[#18161f]"}`}>{p !== undefined ? prob(p) : "–"}</p>
            </div>
          );
        })}
      </div>
      <DepthDiagram layers={layers} features={circuit} layerMass={layerMass} massOf={features.length} selectedId={selectedId} onSelect={onSelect} outcome={outcome} />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.72rem] text-[#6b6875]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3f21b6]" /> feature, sized by KPSA score
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2 rounded-t-[2px] bg-[#9c8ee0]/70" /> block's share of the top-{features.length} score
        </span>
      </div>
    </Panel>
  );
}
