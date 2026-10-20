import { useCallback, useEffect, useRef, useState } from "react";
import StateSpace, { type CloudLayer } from "./StateSpace";
import { ASSET_BASE, type SimulatorHandle } from "./useSimulator";

export interface Preset {
  id: string;
  title: string;
  theme: string;
  creator: string;
  license: string;
  page_url: string;
  frames: number;
  fps: number;
  path_blocks: number;
}

const BLOCK_SECONDS = 0.016;
const SMOOTHING = 1 - Math.exp(-BLOCK_SECONDS / 0.18);
const TRAIL_BLOCKS = Math.round(1.6 / BLOCK_SECONDS);

interface Props {
  sim: SimulatorHandle;
  cloud: CloudLayer | null;
}

/** Smoothed display path from the precomputed per-block state-space positions. */
function smoothPath(raw: Float32Array) {
  const out = new Float32Array(raw.length);
  const last = [raw[0], raw[1], raw[2]];
  for (let k = 0; k < raw.length / 3; k++) {
    for (let d = 0; d < 3; d++) {
      if (k > 0) last[d] += SMOOTHING * (raw[k * 3 + d] - last[d]);
      out[k * 3 + d] = last[d];
    }
  }
  return out;
}

// Preset videos replay trajectories precomputed with the same simulator, latent and
// placement as live runs (axosim-demo `export_video_paths`); users cannot supply videos.
export default function VideoSection({ sim, cloud }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [active, setActive] = useState<Preset | null>(null);
  const [path, setPath] = useState<Float32Array | null>(null);
  const [shown, setShown] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const runId = useRef(0);

  useEffect(() => {
    fetch(`${ASSET_BASE}/videos/presets.json`)
      .then((r) => r.json())
      .then((list: Preset[]) => setPresets(list))
      .catch(() => setPresets([]));
  }, []);

  const start = useCallback(async (preset: Preset) => {
    const id = ++runId.current;
    setActive(preset);
    setShown(0);
    setPath(null);
    const response = await fetch(`${ASSET_BASE}/videos/${preset.id}.path.bin`);
    const raw = new Float32Array(await response.arrayBuffer());
    if (id !== runId.current) return;
    setPath(smoothPath(raw));
    const element = video.current;
    if (element) {
      element.src = `${ASSET_BASE}/videos/${preset.id}.mp4`;
      element.currentTime = 0;
      element.play().catch(() => undefined);
    }
  }, []);

  // Advance the displayed path with the video's playback time.
  useEffect(() => {
    let frame = 0;
    const blocks = path ? path.length / 3 : 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const element = video.current;
      if (!element || !path) return;
      setShown(Math.min(Math.floor(element.currentTime / BLOCK_SECONDS) + 1, blocks));
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [path]);

  return (
    <div className="connectome-panel">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center">
          <div className="relative">
            <div className="relative aspect-video overflow-hidden rounded-md bg-black">
              <video ref={video} className="h-full w-full" controls muted playsInline preload="metadata" aria-label={active ? `${active.title} video` : "Selected video"} />
              {!active && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/60">
                  Choose a video below.
                </div>
              )}
            </div>
            <div className="mt-3 text-xs leading-relaxed text-white/55 lg:absolute lg:left-0 lg:right-0 lg:top-full" aria-live="polite">
              {active ? (
                <>
                  Footage:{" "}
                  <a className="connectome-link" href={active.page_url} target="_blank" rel="noreferrer">
                    {active.creator}
                  </a>
                </>
              ) : (
                sim.status
              )}
            </div>
          </div>
        </div>
        <StateSpace
          className="aspect-square w-full rounded-md bg-[#07080d] lg:aspect-auto lg:min-h-[24rem]"
          cloud={cloud}
          path={path}
          pathLength={shown}
          trail={TRAIL_BLOCKS}
          ariaLabel="Three-dimensional UMAP of population states with the trajectory of the current video"
        />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3" role="list" aria-label="Preset videos">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="listitem"
            disabled={!cloud}
            onClick={() => start(preset)}
            aria-pressed={active?.id === preset.id}
            className={`group overflow-hidden rounded-md border text-left transition-colors disabled:opacity-50 ${
              active?.id === preset.id ? "border-[#8f7cf0] bg-white/10" : "border-white/10 bg-white/[0.03] hover:border-white/30"
            }`}
          >
            <img src={`${ASSET_BASE}/videos/${preset.id}.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover opacity-90 group-hover:opacity-100" />
            <span className="block px-2.5 py-2">
              <span className="block text-sm font-medium text-white/90">{preset.title}</span>
              <span className="block text-xs text-white/50">
                {preset.theme} · {Math.round(preset.frames / preset.fps)} s
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
