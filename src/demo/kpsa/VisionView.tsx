import { useEffect, useMemo, useRef } from "react";
import CircuitPanel from "./CircuitPanel";
import { useJson } from "./data";
import FeatureCard from "./FeatureCard";
import { FeatureList, InterventionTable } from "./FeatureList";
import { featureLabel, prob } from "./format";
import HeatmapImage from "./Heatmap";
import { ImageNeighbors } from "./Neighbors";
import type { App, RankedFeature, VisionIndex, VisionQuery } from "./types";
import { Bar, ErrorText, Panel, PanelHeading, Skeleton } from "./ui";
import { assetUrl } from "./data";
import { useRevealCard } from "./useRevealCard";

export interface VisionSelection {
  imageId?: string;
  /** undefined: the top-ranked feature; null: none. */
  featureId?: string | null;
  budget?: number;
}

interface Props {
  app: App;
  sel: VisionSelection;
  update: (next: Partial<VisionSelection>) => void;
}

export default function VisionView({ app, sel, update }: Props) {
  const index = useJson<VisionIndex>("vision/index.json");
  const info = index.data;
  const imageId = sel.imageId ?? info?.images[0]?.id ?? null;
  const image = info?.images.find((im) => im.id === imageId) ?? null;
  const query = useJson<VisionQuery>(imageId ? `vision/q/${imageId}.json` : null);
  const q = query.data;

  const ranked: RankedFeature[] = useMemo(
    () => q?.features.map((f, i) => ({ id: f.id, l: f.l, f: f.f, s: f.s, rank: i + 1, deact: f.deact?.p, map: f.map })) ?? [],
    [q],
  );
  const featureId = sel.featureId === undefined ? ranked[0]?.id ?? null : sel.featureId;
  const feature = ranked.find((f) => f.id === featureId) ?? null;
  const budget = sel.budget ?? info?.budgets[1]?.pct ?? info?.budgets[0]?.pct ?? 0;
  const { cardRef, reveal } = useRevealCard();

  const select = (id: string) => {
    update({ featureId: id });
    reveal();
  };

  if (index.error) return <ErrorText>Could not load the vision examples ({index.error}).</ErrorText>;

  const outcome = q?.prediction.label ?? "";

  const imagePanel = (
    <Panel label="Selected image">
      <div className="relative">
        {image ? (
          <HeatmapImage key={image.id} src={image.src} alt={`${image.group}: ${image.id}`} map={feature?.map} eager className="rounded-md" />
        ) : (
          <Skeleton className="aspect-square w-full" />
        )}
        {feature?.map && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[0.72rem] font-medium text-[#3f21b6] shadow-sm backdrop-blur">
            {featureLabel(feature.l, feature.f)} activation
          </span>
        )}
      </div>
      {image?.credit && (
        <p className="mt-2 truncate text-[0.7rem] text-[#6b6875]">
          <a href={image.credit.url} target="_blank" rel="noreferrer" className="kpsa-link">
            {image.credit.author}
          </a>
          , {image.credit.license}
        </p>
      )}
      <div className="mt-4">
        <Prediction query={q} error={query.error} />
      </div>
    </Panel>
  );

  const card = feature && info && (
    <FeatureCard ref={cardRef} modality="vision" feature={feature} featuresPerLayer={info.featuresPerLayer} outcome={outcome} onClose={() => update({ featureId: null })} />
  );

  return (
    <div className="space-y-5">
      <Panel label="Query images">
        <PanelHeading>Pick an image</PanelHeading>
        {info ? (
          <Gallery info={info} selected={imageId} onSelect={(id) => update({ imageId: id, featureId: undefined })} />
        ) : (
          <div className="flex gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-14 shrink-0" />
            ))}
          </div>
        )}
      </Panel>

      {app === "attribution" ? (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            {imagePanel}
            <Panel label="Activation attribution" className="space-y-6">
              {q && info ? (
                <>
                  <FeatureList features={ranked} selectedId={featureId} onSelect={select} outcome={outcome} inputKey={q.id} />
                  <InterventionTable
                    budgets={info.budgets}
                    factors={info.factors}
                    sets={q.sets}
                    intact={q.prediction.p}
                    outcome={outcome}
                    totalFeatures={info.layers * info.featuresPerLayer}
                  />
                </>
              ) : query.error ? (
                <ErrorText>Could not load this image's features ({query.error}).</ErrorText>
              ) : (
                <ListSkeleton />
              )}
            </Panel>
          </div>
          {card}
        </>
      ) : (
        <>
          {info && q ? (
            <CircuitPanel
              budgets={info.budgets}
              budget={budget}
              onBudget={(pct) => update({ budget: pct })}
              features={ranked}
              layers={info.layers}
              featuresPerLayer={info.featuresPerLayer}
              layerMass={q.layerMass}
              factors={info.factors}
              sets={q.sets}
              intact={q.prediction.p}
              outcome={outcome}
              selectedId={featureId}
              onSelect={select}
            />
          ) : query.error ? null : (
            <Skeleton className="h-80 w-full" />
          )}
          {card}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            {imagePanel}
            <Panel label="Atlas neighbours">
              {q && info ? (
                <ImageNeighbors neighbors={q.neighbors} half={q.neighborsHalf} atlasSources={info.atlasSources} />
              ) : query.error ? (
                <ErrorText>Could not load this image's atlas neighbours ({query.error}).</ErrorText>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="aspect-square w-full" />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Gallery({ info, selected, onSelect }: { info: VisionIndex; selected: string | null; onSelect: (id: string) => void }) {
  const groups = info.groups.filter((group) => info.images.some((im) => im.group === group));
  return (
    <div className="kpsa-scroll kpsa-fade-bottom -mx-1 flex max-h-[14.5rem] flex-wrap gap-x-7 gap-y-4 overflow-y-auto px-1 pb-6 pt-1 sm:max-h-[16.75rem]">
      {groups.map((group) => (
        <div key={group} role="group" aria-label={group} className="min-w-0 max-w-full">
          <p className="mb-1.5 text-[0.72rem] font-medium text-[#5c5966]">{group}</p>
          <div className="flex flex-wrap gap-1.5">
            {info.images
              .filter((im) => im.group === group)
              .map((im) => {
                const active = im.id === selected;
                return (
                  <button
                    key={im.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${group}: ${im.id}`}
                    onClick={() => onSelect(im.id)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#ebe8e1] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6] focus-visible:ring-offset-2 sm:h-16 sm:w-16 ${
                      active ? "ring-2 ring-[#3f21b6] ring-offset-2 ring-offset-[#f7f5f1]" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={assetUrl(im.thumb)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Prediction({ query, error }: { query: VisionQuery | null; error: string | null }) {
  if (error) return <ErrorText>Could not load the prediction ({error}).</ErrorText>;
  if (!query)
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  const { label, p, top5 } = query.prediction;
  return (
    <div>
      <p className="kpsa-eyebrow mb-1">Prediction</p>
      <p className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-[1.35rem] leading-tight text-[#18161f]">{label}</span>
        <span className="text-lg font-medium tabular-nums text-[#3f21b6]">{prob(p)}</span>
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {top5.map(([name, value], i) => (
          <li key={name} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-x-3 text-xs">
            <span className={`truncate ${i === 0 ? "font-medium text-[#18161f]" : "text-[#4b4857]"}`} title={name}>
              {name}
            </span>
            <Bar value={value} tone={i === 0 ? "brand" : "muted"} />
            <span className="text-right tabular-nums text-[#4b4857]">{prob(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: 10 }, (_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}
