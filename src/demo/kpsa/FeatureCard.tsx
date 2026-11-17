import { forwardRef } from "react";
import { X } from "lucide-react";
import { useJson } from "./data";
import { featureLabel, prob, share } from "./format";
import HeatmapImage from "./Heatmap";
import type { LanguageFeatureCard, Modality, RankedFeature, VisionFeatureCard } from "./types";
import { ErrorText, Skeleton } from "./ui";

interface Props {
  modality: Modality;
  feature: RankedFeature;
  featuresPerLayer: number;
  /** What the deactivation value refers to, e.g. "tabby cat". */
  outcome: string;
  onClose: () => void;
}

/** Feature dashboard: the feature's place in the model, its score here, and its top dataset activations. */
const FeatureCard = forwardRef<HTMLElement, Props>(function FeatureCard({ modality, feature, featuresPerLayer, outcome, onClose }, ref) {
  const path = `${modality}/f/${feature.id}.json`;
  return (
    <section ref={ref} aria-labelledby="kpsa-card-title" className="kpsa-panel kpsa-card relative scroll-mt-24">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[#18161f]/[0.08] pb-4 sm:pr-10">
        <div className="min-w-0">
          <p className="kpsa-eyebrow mb-1">Feature</p>
          <h3 id="kpsa-card-title" className="text-[1.4rem] font-semibold tabular-nums tracking-tight text-[#3f21b6]">
            {featureLabel(feature.l, feature.f)}
          </h3>
          <p className="mt-1 text-[0.8rem] text-[#5c5966]">
            Block {feature.l + 1}, MLP feature {feature.f} of {featuresPerLayer.toLocaleString("en-US")}
          </p>
        </div>
        <div>
          <dl className="grid grid-flow-col gap-x-6 sm:text-right">
            <div>
              <dt className="text-[0.7rem] text-[#6b6875]">Rank</dt>
              <dd className="text-lg font-medium tabular-nums">{feature.rank}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] text-[#6b6875]">KPSA score</dt>
              <dd className="text-lg font-medium tabular-nums">{share(feature.s)}</dd>
            </div>
            {feature.deact !== undefined && (
              <div>
                <dt className="text-[0.7rem] text-[#6b6875]" title={`Probability of “${outcome}” after zeroing this feature alone`}>
                  p after zeroing
                </dt>
                <dd className="text-lg font-medium tabular-nums">{prob(feature.deact)}</dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feature card"
            className="absolute right-3 top-3 rounded-full p-1.5 sm:right-4 sm:top-4 text-[#6b6875] transition-colors hover:bg-[#18161f]/[0.06] hover:text-[#18161f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="pt-4">
        <p className="kpsa-eyebrow mb-3">{modality === "vision" ? "Top-activating dataset images" : "Top-activating text"}</p>
        {modality === "vision" ? <VisionTop path={path} /> : <LanguageTop path={path} />}
      </div>
    </section>
  );
});

export default FeatureCard;

function VisionTop({ path }: { path: string }) {
  const { data, error } = useJson<VisionFeatureCard>(path);
  if (error) return <ErrorText>Could not load this feature's examples ({error}).</ErrorText>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {data
        ? data.top.map((item, i) => (
            <li key={i} className="min-w-0">
              <HeatmapImage src={item.thumb} alt={item.label} map={item.map} className="rounded-md" />
              <div className="mt-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-[#18161f]" title={item.label}>
                  {item.label}
                </span>
                <span className="shrink-0 tabular-nums text-[#6b6875]">{item.act.toFixed(2)}</span>
              </div>
            </li>
          ))
        : Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </li>
          ))}
    </ul>
  );
}

/** Background for a token activation scaled to 0..255. */
const activationColor = (act: number) => `rgb(63 33 182 / ${((act / 255) * 0.82).toFixed(3)})`;

function LanguageTop({ path }: { path: string }) {
  const { data, error } = useJson<LanguageFeatureCard>(path);
  if (error) return <ErrorText>Could not load this feature's examples ({error}).</ErrorText>;
  if (!data)
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  return (
    <ol className="divide-y divide-[#18161f]/[0.06]">
      {data.top.map((snippet, i) => (
        <li key={i} className="grid gap-x-4 gap-y-1 py-2.5 first:pt-0 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <p className="kpsa-snippet min-w-0 text-[0.85rem] leading-[1.75] text-[#18161f]">
            {snippet.tokens.map((token, j) => {
              const act = snippet.acts[j] ?? 0;
              const lead = token.match(/^\s*/)?.[0] ?? "";
              const body = token.slice(lead.length);
              return (
                <span key={j}>
                  {lead.replace(/\n/g, " ")}
                  {body && (
                    <span
                      title={`activation ${((act / 255) * snippet.max).toFixed(2)}`}
                      className={`rounded-[2px] ${act > 150 ? "text-white" : ""}`}
                      style={act > 0 ? { backgroundColor: activationColor(act), boxShadow: `0 0 0 1.5px ${activationColor(act)}` } : undefined}
                    >
                      {body}
                    </span>
                  )}
                </span>
              );
            })}
          </p>
          <div className="flex items-baseline justify-between gap-3 text-xs sm:flex-col sm:items-end sm:justify-start sm:gap-0.5 sm:text-right">
            <a href={snippet.url} target="_blank" rel="noreferrer" className="kpsa-link truncate" title={snippet.title}>
              {snippet.title}
            </a>
            <span className="shrink-0 tabular-nums text-[#6b6875]">max {snippet.max.toFixed(2)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

