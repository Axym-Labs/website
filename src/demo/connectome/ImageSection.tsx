import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReferenceStats } from "./assets";
import { imageMeta, imageUrl, percentile, retrieve, type Database, type ImageMeta, type Retrieval } from "./database";
import StateSpace, { type CloudLayer, type Marker } from "./StateSpace";
import { ASSET_BASE, type SimulatorHandle } from "./useSimulator";

interface PresetImage {
  id: string;
  title: string;
  file: string;
  creator: string;
  license: string;
  page_url: string;
}

interface Stats {
  latentSpeed: number;
  pathDensityPercentile: number;
  descriptor: Float32Array;
  approachRatio: number;
  peakFrequencyDriftHz: number;
  minPeakPowerFraction: number;
  amplitudeRatio: number;
  orbitFrequencyHz: number;
  stableOrbit: boolean;
  orbitRadius: number;
  orbitSpeed: number;
  orbitDensityPercentile: number;
}

interface Stability {
  returnTime: number;
  returnRatio: number;
  returnedSeeds: number;
  returnTimes: number[];
}

interface Props {
  sim: SimulatorHandle;
  cloud: CloudLayer | null;
  db: Database | null;
  dbError: string | null;
  reference: ReferenceStats | null;
  lattice: { x: number[]; y: number[] } | null;
}

const PHASES: Record<string, string> = {
  hold: "Holding the image for 5 s",
  analysis: "Measuring the trajectory",
  perturbation: "Perturbing the orbit in 8 directions",
  done: "Done",
};

const CATEGORY_COLORS = [
  "#8f7cf0", "#e0a458", "#5fb49c", "#e07a8f", "#6aa9e9", "#c9c95a", "#b38de0", "#e88f5a",
  "#59c3c3", "#d16ba5", "#9bc53d", "#f2b5d4", "#7fa7ff", "#ffcf66", "#66d9a6", "#ff8f8f",
  "#a3a3ff", "#d4a373", "#8ecae6", "#c77dff", "#90be6d", "#f4978e",
];

function RetinaView({ samples, lattice }: { samples: Float32Array | null; lattice: Props["lattice"] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element || !lattice) return;
    const ctx = element.getContext("2d")!;
    const { width, height } = element;
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, width, height);
    if (!samples) return;
    // Columns sit on a hexagonal lattice; draw each ommatidium as a disc sized by the nearest-neighbour spacing.
    const scale = 0.47;
    const xs = lattice.x.map((x) => (0.5 + scale * x) * width);
    const ys = lattice.y.map((y) => (0.5 + scale * y) * height);
    let spacing = Infinity;
    for (let j = 1; j < xs.length; j++) spacing = Math.min(spacing, Math.hypot(xs[j] - xs[0], ys[j] - ys[0]));
    const radius = spacing * 0.5;
    for (let i = 0; i < xs.length; i++) {
      const value = Math.round(samples[i] * 255);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.beginPath();
      ctx.arc(xs[i], ys[i], radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [samples, lattice]);
  return <canvas ref={canvas} width={640} height={360} className="aspect-video w-full rounded-md" role="img" aria-label="The image as sampled by the 721 columns of the fly retina" />;
}

function PercentBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2" title={label}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-[#8f7cf0]" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
      <span className="w-12 text-right tabular-nums text-white/70">{Math.round(value)}%</span>
    </div>
  );
}

async function decode(source: Blob | string) {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const maxSide = 4096;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  return { data, width, height, url: typeof source === "string" ? source : URL.createObjectURL(source) };
}

export default function ImageSection({ sim, cloud, db, dbError, reference, lattice }: Props) {
  const [presets, setPresets] = useState<PresetImage[]>([]);
  const [image, setImage] = useState<{ url: string; title: string; credit?: PresetImage } | null>(null);
  const [retina, setRetina] = useState<Float32Array | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [fraction, setFraction] = useState(0);
  const [path, setPath] = useState<Float32Array | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stability, setStability] = useState<Stability | null>(null);
  const [retrieval, setRetrieval] = useState<Retrieval | null>(null);
  const [metas, setMetas] = useState<Record<string, ImageMeta>>({});
  const [view, setView] = useState<"state" | "map">("state");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const runId = useRef(1000);
  const pathBuffer = useRef<Float32Array>(new Float32Array(0));

  useEffect(() => {
    fetch(`${ASSET_BASE}/images/presets.json`)
      .then((r) => r.json())
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

  useEffect(
    () =>
      sim.subscribe((message) => {
        if (message.id !== runId.current) return;
        if (message.type === "retina") setRetina(message.samples as Float32Array);
        if (message.type === "imageProgress") {
          setPhase(message.phase as string);
          setFraction(message.fraction as number);
          if (message.coords) {
            const coords = message.coords as Float32Array;
            const first = message.firstBlock as number;
            pathBuffer.current.set(coords, first * 3);
            setPathLength(first + coords.length / 3);
            setPath(pathBuffer.current);
          }
        }
        if (message.type === "imageResult") {
          setStats(message.stats as Stats);
          setStability(message.stability as Stability);
          setSeconds(message.seconds as number);
          setPhase("done");
        }
        if (message.type === "error") {
          setError(String(message.message));
          setPhase(null);
        }
      }),
    [sim],
  );

  useEffect(() => {
    if (!stats || !db) return;
    const result = retrieve(db, Float32Array.from(stats.descriptor));
    setRetrieval(result);
    Promise.all(result.neighbors.map(async (n) => [n.id, await imageMeta(db, n.id)] as const)).then((entries) =>
      setMetas(Object.fromEntries(entries)),
    );
  }, [stats, db]);

  const run = useCallback(
    async (source: Blob | string, title: string, credit?: PresetImage) => {
      setError(null);
      try {
        const decoded = await decode(source);
        const id = ++runId.current;
        setImage({ url: decoded.url, title, credit });
        setRetina(null);
        setStats(null);
        setStability(null);
        setRetrieval(null);
        setMetas({});
        setSeconds(null);
        setPhase("hold");
        setFraction(0);
        pathBuffer.current = new Float32Array(400 * 3).fill(NaN);
        setPath(pathBuffer.current);
        setPathLength(0);
        setView("state");
        sim.post({ type: "image", id, rgba: decoded.data, width: decoded.width, height: decoded.height }, [decoded.data.buffer]);
      } catch (e) {
        setError(`Could not read this image (${(e as Error).message}).`);
      }
    },
    [sim],
  );

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) run(file, file.name);
  };

  const mapCloud = useMemo<CloudLayer | null>(() => {
    if (!db) return null;
    const n = db.ids.length;
    const coords = new Float32Array(n * 3);
    let max = 0;
    for (let i = 0; i < n * 3; i++) max = Math.max(max, Math.abs(db.umap3[i]));
    const centre = [0, 1, 2].map((d) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += db.umap3[i * 3 + d];
      return s / n;
    });
    let extent = 0;
    for (let i = 0; i < n; i++) for (let d = 0; d < 3; d++) extent = Math.max(extent, Math.abs(db.umap3[i * 3 + d] - centre[d]));
    for (let i = 0; i < n; i++) for (let d = 0; d < 3; d++) coords[i * 3 + d] = (db.umap3[i * 3 + d] - centre[d]) / extent;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const hex = CATEGORY_COLORS[db.category[i] % CATEGORY_COLORS.length];
      colors[i * 3] = parseInt(hex.slice(1, 3), 16) / 255;
      colors[i * 3 + 1] = parseInt(hex.slice(3, 5), 16) / 255;
      colors[i * 3 + 2] = parseInt(hex.slice(5, 7), 16) / 255;
    }
    (coords as Float32Array & { centre?: number[]; extent?: number }).centre = centre;
    (coords as Float32Array & { extent?: number }).extent = extent;
    return { coords, colors, size: n > 5000 ? 0.02 : 0.026, opacity: 0.75 };
  }, [db]);

  const mapMarkers = useMemo<Marker[]>(() => {
    if (!retrieval || !db || !mapCloud) return [];
    const { centre, extent } = mapCloud.coords as Float32Array & { centre: number[]; extent: number };
    const place = (p: ArrayLike<number>) => [0, 1, 2].map((d) => (p[d] - centre[d]) / extent);
    return [
      { position: place(retrieval.umap3), color: "#ffffff", size: 0.05 },
      ...retrieval.neighbors.map((n) => ({ position: place(db.umap3.subarray(n.index * 3, n.index * 3 + 3)), color: "#ffcf66", size: 0.032 })),
    ];
  }, [retrieval, db, mapCloud]);

  const busy = phase !== null && phase !== "done";
  const stable = stats?.stableOrbit;
  const rows: { label: string; value: string; pct?: number; pctLabel?: string; hint: string }[] = [];
  if (stats && reference) {
    rows.push({
      label: "Latent speed",
      value: `${stats.latentSpeed.toFixed(0)} /s`,
      pct: percentile(reference, "latent_speed", stats.latentSpeed),
      pctLabel: "faster than this share of database images",
      hint: "Mean distance per second in the 50-component latent space over the 5-second hold.",
    });
    rows.push({
      label: "Latent density along the path",
      value: `${stats.pathDensityPercentile.toFixed(0)}%`,
      pct: percentile(reference, "path_density_percentile", stats.pathDensityPercentile),
      pctLabel: "denser path than this share of database images",
      hint: "Average share of reference states that lie in sparser regions (10-nearest-neighbour radius).",
    });
  }
  const orbitRows: typeof rows = [];
  if (stats && stable && reference) {
    orbitRows.push({ label: "Orbit frequency", value: `${stats.orbitFrequencyHz.toFixed(2)} Hz`, hint: "Dominant frequency of the leading component in the last 1.5 s." });
    orbitRows.push({
      label: "Orbit radius",
      value: stats.orbitRadius.toFixed(1),
      pct: percentile(reference, "orbit_radius", stats.orbitRadius),
      pctLabel: "larger than this share of stable database orbits",
      hint: "Root-mean-square distance of the 3.5–5 s states from their centre.",
    });
    orbitRows.push({
      label: "Orbit speed",
      value: `${stats.orbitSpeed.toFixed(0)} /s`,
      pct: percentile(reference, "orbit_speed", stats.orbitSpeed),
      pctLabel: "faster than this share of stable database orbits",
      hint: "Mean latent speed between 3.5 and 5 s.",
    });
    if (stability) {
      orbitRows.push({
        label: "Stability to perturbations",
        value: `τ = ${(stability.returnTime * 1000).toFixed(0)} ms · ${stability.returnedSeeds}/8 returned`,
        pct: 100 - percentile(reference, "return_time", stability.returnTime),
        pctLabel: "more stable (faster return) than this share of stable database orbits",
        hint: "Median over 8 perturbations of the integrated normalized excess distance to the orbit; lower τ means a faster return.",
      });
    }
    orbitRows.push({
      label: "Latent density of the orbit",
      value: `${stats.orbitDensityPercentile.toFixed(0)}%`,
      pct: percentile(reference, "orbit_density_percentile", stats.orbitDensityPercentile),
      pctLabel: "denser than this share of stable database orbits",
      hint: "Average density percentile of the states between 3.5 and 5 s.",
    });
  }

  const credit = image?.credit ? (
    <>
      Image:{" "}
      <a className="connectome-link" href={image.credit.page_url} target="_blank" rel="noreferrer">
        {image.credit.creator}
      </a>{" "}
      ({image.credit.license}).
    </>
  ) : null;

  return (
    <div className="connectome-panel">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onFiles(e.dataTransfer.files);
            }}
            className={`relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-black text-center transition-colors ${
              dragging ? "border-[#8f7cf0]" : "border-white/20 hover:border-white/40"
            }`}
          >
            <input type="file" accept="image/*" className="sr-only" disabled={!sim.ready || busy} onChange={(e) => onFiles(e.target.files)} />
            {image ? (
              <img src={image.url} alt={image.title} className="h-full w-full object-cover" />
            ) : (
              <span className="px-6 text-sm text-white/60">Drop an image here, click to upload, or pick one below. It stays on your device.</span>
            )}
          </label>
          <div className="grid grid-cols-4 gap-2" role="list" aria-label="Preset images">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="listitem"
                disabled={!sim.ready || busy}
                onClick={() => run(`${ASSET_BASE}/images/${preset.file}`, preset.title, preset)}
                className="overflow-hidden rounded-md border border-white/10 bg-white/[0.03] transition-colors hover:border-white/30 disabled:opacity-50"
                title={preset.title}
              >
                <img src={`${ASSET_BASE}/images/${preset.file}`} alt={preset.title} loading="lazy" className="aspect-video w-full object-cover" />
              </button>
            ))}
          </div>
          {credit && <p className="text-xs text-white/50">{credit}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <RetinaView samples={retina} lattice={lattice} />
          <p className="text-xs text-white/50">What the fly sees: the image on the 721 columns of its retina, centre-cropped to 16:9 and contrast-normalized.</p>
          <div aria-live="polite">
            {error && <p className="text-sm text-[#ff8f8f]">{error}</p>}
            {busy && (
              <div className="flex items-center gap-3 text-sm text-white/70">
                <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-[#8f7cf0] transition-[width]" style={{ width: `${fraction * 100}%` }} />
                </div>
                {PHASES[phase!] ?? phase}
                {sim.kind === "cpu" && <span className="text-white/45">(CPU mode can take a few minutes)</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-white/85">{view === "state" ? "Population state during the hold" : "Database images by their settled state"}</h4>
          <div className="flex gap-1 rounded-md bg-white/5 p-0.5 text-xs" role="tablist" aria-label="3D view">
            {(["state", "map"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`rounded px-2.5 py-1 ${view === key ? "bg-white/15 text-white" : "text-white/55 hover:text-white"}`}
              >
                {key === "state" ? "State trajectory" : "Image map"}
              </button>
            ))}
          </div>
        </div>
        <StateSpace
          className="h-[24rem] w-full rounded-md bg-[#07080d] sm:h-[36rem]"
          distance={2.7}
          cloud={view === "state" ? cloud : mapCloud}
          path={view === "state" ? path : null}
          pathLength={view === "state" ? pathLength : 0}
          trail={100}
          markers={view === "state" ? [] : mapMarkers}
          ariaLabel={
            view === "state"
              ? "Three-dimensional UMAP of population states with the trajectory during the image hold"
              : "Three-dimensional UMAP of database images coloured by category, with the current image and its nearest neighbours"
          }
        />
        {view === "map" && db && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-white/55">
            <span className="text-white/80">● this image</span>
            <span className="text-[#ffcf66]">● nearest five</span>
            {db.categories.map((c, i) => (
              <span key={c} style={{ color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                ● {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {stats && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-label="Nearest images">
            <h4 className="mb-3 text-sm font-semibold text-white/85">
              Five nearest images {db ? `of ${db.ids.length.toLocaleString()}` : ""}
              {db?.source === "fallback" && <span className="font-normal text-white/45"> (bundled subset)</span>}
            </h4>
            {!db && <p className="text-sm text-white/50">{dbError ?? "Loading image database…"}</p>}
            <ol className="grid grid-cols-3 gap-3">
              {image && (
                <li className="min-w-0">
                  <div className="overflow-hidden rounded-md bg-black ring-1 ring-white/40">
                    <img src={image.url} alt={image.title} className="aspect-square w-full object-cover" />
                  </div>
                  <p className="mt-1 truncate text-[0.72rem] text-white/85">Your image</p>
                  <p className="truncate text-[0.66rem] text-white/45">{image.title}</p>
                </li>
              )}
              {retrieval?.neighbors.map((n, i) => {
                const meta = metas[n.id];
                return (
                  <li key={n.id} className="min-w-0">
                    <a href={meta?.page_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md bg-black">
                      <img src={imageUrl(db!, n.id, "thumb")} alt={meta?.title ?? n.category} className="aspect-square w-full object-cover" />
                    </a>
                    <p className="mt-1 truncate text-[0.72rem] text-white/75" title={meta?.title}>
                      {i + 1}. {meta?.title ?? n.category}
                    </p>
                    <p className="truncate text-[0.66rem] text-white/45" title={meta ? `${meta.author ?? ""} · ${meta.license ?? ""}` : undefined}>
                      {meta?.author ? `${meta.author} · ` : ""}
                      {meta?.license ?? ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
          <section aria-label="Trajectory statistics">
            <h4 className="mb-3 text-sm font-semibold text-white/85">Trajectory statistics</h4>
            <dl className="divide-y divide-white/10 text-sm">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-1.5" title={row.hint}>
                  <dt className="text-white/70">{row.label}</dt>
                  <dd className="flex items-center gap-3 tabular-nums text-white/90">
                    {row.value}
                    {row.pct !== undefined && <PercentBar value={row.pct} label={row.pctLabel!} />}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 py-1.5" title="Approach ≥ 1.25×, frequency drift ≤ 0.5 Hz, peak power ≥ 0.35 and amplitude ratio 0.75–1.35 across the last two 1.5-s windows.">
                <dt className="text-white/70">Converged to a stable orbit?</dt>
                <dd className={stable ? "text-[#9be3c1]" : "text-[#ffb38f]"}>
                  {stable ? "Yes" : "No"}
                  <span className="ml-2 text-xs text-white/45">
                    approach {stats.approachRatio.toFixed(2)}× · drift {stats.peakFrequencyDriftHz.toFixed(2)} Hz · amplitude {stats.amplitudeRatio.toFixed(2)}×
                  </span>
                </dd>
              </div>
              {orbitRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-1.5" title={row.hint}>
                  <dt className="text-white/70">{row.label}</dt>
                  <dd className="flex items-center gap-3 tabular-nums text-white/90">
                    {row.value}
                    {row.pct !== undefined && <PercentBar value={row.pct} label={row.pctLabel!} />}
                  </dd>
                </div>
              ))}
              {stable && !stability && <p className="py-1.5 text-xs text-white/50">Perturbation test running…</p>}
            </dl>
            {reference && (
              <p className="mt-3 text-xs leading-relaxed text-white/45">
                Bars give the percentile among {reference.images.toLocaleString()} database images
                {stable ? ` (orbit rows: among the ${reference.stableImages.toLocaleString()} that reached a stable orbit)` : ""}. Seed-to-seed reliability of
                τ: {reference.reliability.return_time_spearman_brown.toFixed(2)}.{seconds ? ` Computed in ${seconds.toFixed(1)} s on your ${sim.kind === "webgpu" ? "GPU" : "CPU"}.` : ""}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
