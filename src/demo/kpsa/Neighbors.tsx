import { assetUrl } from "./data";
import { share, tokenText } from "./format";
import { PanelHeading } from "./ui";

const weight = share;

/** How concentrated the atlas readout is for this query. */
function HalfNote({ half, atlasSources, kind }: { half: number; atlasSources: number; kind: string }) {
  return (
    <p className="mb-3 text-[0.8rem] leading-snug text-[#5c5966]">
      The atlas weights each source's profile by the overlap of its prototype responses with the query's.{" "}
      <span className="tabular-nums text-[#18161f]">{half.toLocaleString("en-US")}</span> of {atlasSources.toLocaleString("en-US")} {kind} hold half of the weight; the
      highest-weighted are shown.
    </p>
  );
}

/** Atlas source images with the highest readout weight for the query. */
export function ImageNeighbors({ neighbors, half, atlasSources }: { neighbors: { thumb: string; label: string; w: number }[]; half: number; atlasSources: number }) {
  return (
    <div>
      <PanelHeading>Source images the atlas drew on</PanelHeading>
      <HalfNote half={half} atlasSources={atlasSources} kind="source images" />
      <ul className="grid grid-cols-3 gap-3">
        {neighbors.map((n, i) => (
          <li key={i} className="min-w-0">
            <div className="aspect-square overflow-hidden rounded-md bg-[#ebe8e1]">
              <img src={assetUrl(n.thumb)} alt={n.label} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
            <p className="mt-1.5 truncate text-xs text-[#18161f]" title={n.label}>
              {n.label}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <div aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-[#18161f]/[0.07]">
                <div className="h-full rounded-full bg-[#9c8ee0]" style={{ width: `${Math.min(100, n.w * 100 / Math.max(...neighbors.map((m) => m.w)))}%` }} />
              </div>
              <span className="text-[0.68rem] tabular-nums text-[#6b6875]" title="Share of the atlas readout weight">
                {weight(n.w)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Atlas source contexts with the highest readout weight, the target token emphasized. */
export function TextNeighbors({ neighbors, half, atlasSources }: { neighbors: { text: string; target: string; w: number }[]; half: number; atlasSources: number }) {
  const max = Math.max(1e-9, ...neighbors.map((n) => n.w));
  return (
    <div>
      <PanelHeading>Source contexts the atlas drew on</PanelHeading>
      <HalfNote half={half} atlasSources={atlasSources} kind="source contexts" />
      <ul className="space-y-2.5">
        {neighbors.map((n, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,1fr)_3.25rem] items-start gap-3">
            <p className="text-[0.82rem] leading-snug text-[#4b4857]">
              <span>{n.text.replace(/^\s+/, "")}</span>
              {/^\s/.test(n.target) && " "}
              <mark className="rounded-[2px] bg-[#3f21b6] font-medium text-white shadow-[0_0_0_2px_#3f21b6]">{tokenText(n.target)}</mark>
            </p>
            <div className="pt-1.5">
              <div aria-hidden className="h-1 overflow-hidden rounded-full bg-[#18161f]/[0.07]">
                <div className="h-full rounded-full bg-[#9c8ee0]" style={{ width: `${(n.w / max) * 100}%` }} />
              </div>
              <p className="mt-0.5 text-right text-[0.68rem] tabular-nums text-[#6b6875]" title="Share of the atlas readout weight">
                {weight(n.w)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
