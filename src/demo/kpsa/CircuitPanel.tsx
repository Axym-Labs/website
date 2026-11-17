import DepthDiagram from "./DepthDiagram";
import { prob } from "./format";
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
  /** Probability after zeroing the circuit at each budget, aligned with `budgets`. */
  effects: number[];
  intact: number;
  outcome: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Sensitivity circuit at a chosen budget, drawn across depth. */
export default function CircuitPanel({ budgets, budget, onBudget, features, layers, featuresPerLayer, layerMass, effects, intact, outcome, selectedId, onSelect }: Props) {
  const index = Math.max(0, budgets.findIndex((b) => b.pct === budget));
  const { k } = budgets[index] ?? { k: features.length };
  const circuit = features.slice(0, k);
  const effect = effects[index];
  const total = layers * featuresPerLayer;

  return (
    <Panel label="Sensitivity circuit">
      <PanelHeading aside={<span className="tabular-nums">{`${k} of ${total.toLocaleString("en-US")} MLP features`}</span>}>Sensitivity circuit across depth</PanelHeading>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#5c5966]">Budget</span>
          <PillChoice label="Circuit budget" options={budgets.map((b) => ({ value: b.pct, label: `${b.pct} %` }))} value={budget} onChange={onBudget} />
        </div>
        {effect !== undefined && (
          <p className="text-[0.8rem] text-[#5c5966]">
            Probability of <span className="font-medium text-[#18161f]">“{outcome}”</span>: <span className="tabular-nums text-[#18161f]">{prob(intact)}</span>
            <span className="mx-1.5 text-[#8a8794]">→</span>
            <span className="font-medium tabular-nums text-[#3f21b6]">{prob(effect)}</span> with the circuit zeroed
          </p>
        )}
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
