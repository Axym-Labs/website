import { useEffect, useMemo, useRef, useState } from "react";
import { featureLabel, prob, share } from "./format";
import type { RankedFeature } from "./types";

interface Props {
  layers: number;
  features: RankedFeature[];
  layerMass: number[];
  /** Number of features behind `layerMass`, for its label. */
  massOf: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  outcome: string;
}

const MIN_D = 10;
const MAX_D = 30;
const GAP = 5;
const MASS_H = 44;

/**
 * Circuit at one budget, laid out by depth: one column per block, the
 * selected features stacked in their block. No edges: KPSA scores parameter
 * groups, it does not assert connections between them.
 */
export default function DepthDiagram({ layers, features, layerMass, massOf, selectedId, onSelect, outcome }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ feature: RankedFeature; x: number; y: number; below: boolean } | null>(null);
  const top = features[0]?.s ?? 1;
  const columns = useMemo(() => {
    const byLayer: RankedFeature[][] = Array.from({ length: layers }, () => []);
    for (const feature of features) byLayer[feature.l]?.push(feature);
    return byLayer;
  }, [features, layers]);
  const diameter = (s: number) => MIN_D + (MAX_D - MIN_D) * Math.sqrt(s / top);
  const height = Math.max(MAX_D * 3, ...columns.map((col) => col.reduce((sum, f) => sum + diameter(f.s) + GAP, 0))) + 8;
  const maxMass = Math.max(1e-9, ...layerMass);
  const minColumn = layers > 16 ? 34 : 48;

  // On narrow screens the diagram scrolls; bring the circuit's mass-weighted centre into view.
  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const total = layerMass.reduce((a, b) => a + b, 0) || 1;
    const centre = layerMass.reduce((acc, m, l) => acc + m * (l + 0.5), 0) / total;
    el.scrollLeft = Math.max(0, (centre / layers) * el.scrollWidth - el.clientWidth / 2);
  }, [layerMass, layers]);

  const show = (feature: RankedFeature, element: HTMLElement) => {
    const box = area.current?.getBoundingClientRect();
    const node = element.getBoundingClientRect();
    if (!box) return;
    const x = node.left + node.width / 2 - box.left;
    const yTop = node.top - box.top;
    const below = yTop < 84;
    setHover({ feature, x, y: below ? yTop + node.height + 6 : yTop - 6, below });
  };

  return (
    <div ref={scroller} className="kpsa-scroll -mx-1 overflow-x-auto px-1 pb-1">
      <div ref={area} className="relative" style={{ minWidth: layers * minColumn }} onMouseLeave={() => setHover(null)}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${layers}, minmax(0, 1fr))` }}>
          {columns.map((column, l) => (
            <div key={l} className="relative flex flex-col items-center pt-1" style={{ height, gap: GAP }}>
              <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#18161f]/[0.07]" />
              {column.map((feature) => {
                const d = diameter(feature.s);
                const strength = Math.sqrt(feature.s / top);
                const selected = feature.id === selectedId;
                return (
                  <button
                    key={feature.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${featureLabel(feature.l, feature.f)}, rank ${feature.rank}, KPSA score ${share(feature.s)}`}
                    onClick={() => onSelect(feature.id)}
                    onMouseEnter={(event) => show(feature, event.currentTarget)}
                    onFocus={(event) => show(feature, event.currentTarget)}
                    onBlur={() => setHover(null)}
                    className={`relative z-[1] shrink-0 rounded-full transition-[transform,box-shadow] duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6] focus-visible:ring-offset-2 ${
                      selected ? "ring-2 ring-[#18161f] ring-offset-2 ring-offset-[#f7f5f1]" : ""
                    }`}
                    style={{ width: d, height: d, backgroundColor: `rgb(63 33 182 / ${(0.3 + 0.7 * strength).toFixed(3)})` }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 grid items-end border-b border-[#18161f]/20" style={{ gridTemplateColumns: `repeat(${layers}, minmax(0, 1fr))`, height: MASS_H }}>
          {layerMass.slice(0, layers).map((mass, l) => (
            <div key={l} className="flex h-full items-end justify-center" title={`Block ${l + 1}: ${share(mass)} of the top-${massOf} score`}>
              <div className="w-[58%] max-w-6 rounded-t-[3px] bg-[#9c8ee0]/70" style={{ height: `${Math.max(mass > 0 ? 2 : 0, (mass / maxMass) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="grid pt-1" style={{ gridTemplateColumns: `repeat(${layers}, minmax(0, 1fr))` }}>
          {Array.from({ length: layers }, (_, l) => (
            <span key={l} className="text-center text-[0.68rem] tabular-nums text-[#6b6875]">
              {l + 1}
            </span>
          ))}
        </div>
        <p className="mt-0.5 text-center text-[0.68rem] text-[#8a8794]">Block</p>

        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 w-max max-w-[14rem] rounded-md border border-[#18161f]/10 bg-white px-3 py-2 text-xs shadow-[0_8px_24px_rgb(18_15_35/12%)]"
            style={{
              left: Math.min(Math.max(hover.x, 80), (area.current?.clientWidth ?? 0) - 80),
              top: hover.y,
              transform: `translate(-50%, ${hover.below ? "0" : "-100%"})`,
            }}
          >
            <p className="font-mono text-[0.8rem] font-semibold text-[#3f21b6]">{featureLabel(hover.feature.l, hover.feature.f)}</p>
            <p className="mt-0.5 tabular-nums text-[#4b4857]">
              Rank {hover.feature.rank} · score {share(hover.feature.s)}
            </p>
            {hover.feature.deact !== undefined && (
              <p className="tabular-nums text-[#4b4857]">
                p(“{outcome}”) with it zeroed: {prob(hover.feature.deact)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
