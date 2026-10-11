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
  duration: number;
  frames: number;
  fps: number;
}

const BLOCK_SECONDS = 0.016;
const SMOOTHING = 1 - Math.exp(-BLOCK_SECONDS / 0.18);
const TRAIL_BLOCKS = Math.round(1.6 / BLOCK_SECONDS);

interface Props {
  sim: SimulatorHandle;
  cloud: CloudLayer | null;
}

export default function VideoSection({ sim, cloud }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [active, setActive] = useState<Preset | null>(null);
  const [path, setPath] = useState<Float32Array | null>(null);
  const [shown, setShown] = useState(0);
  const [simulated, setSimulated] = useState(0);
  const [speed, setSpeed] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const runId = useRef(0);
  const buffer = useRef({ coords: new Float32Array(0), blocks: 0, done: false, last: [NaN, NaN, NaN] });

  useEffect(() => {
    fetch(`${ASSET_BASE}/videos/presets.json`)
      .then((r) => r.json())
      .then((list: Preset[]) => setPresets(list))
      .catch(() => setPresets([]));
  }, []);

  useEffect(
    () =>
      sim.subscribe((message) => {
        if (message.id !== runId.current) return;
        const b = buffer.current;
        if (message.type === "videoChunk") {
          const coords = message.coords as Float32Array;
          const first = message.firstBlock as number;
          const count = coords.length / 3;
          for (let k = 0; k < count; k++) {
            const x = coords.subarray(k * 3, k * 3 + 3);
            const last = b.last;
            if (Number.isNaN(last[0])) b.last = [x[0], x[1], x[2]];
            else for (let d = 0; d < 3; d++) last[d] += SMOOTHING * (x[d] - last[d]);
            b.coords.set(b.last, (first + k) * 3);
          }
          b.blocks = first + count;
          setSimulated(b.blocks * BLOCK_SECONDS);
          setSpeed(message.speed as number);
        }
        if (message.type === "videoDone") b.done = true;
      }),
    [sim],
  );

  const start = useCallback(
    async (preset: Preset) => {
      sim.post({ type: "cancelVideo" });
      const id = ++runId.current;
      setActive(preset);
      setShown(0);
      setSimulated(0);
      setSpeed(null);
      const response = await fetch(`${ASSET_BASE}/videos/${preset.id}.lattice.bin`);
      const raw = new Uint16Array(await response.arrayBuffer());
      const frames = Float32Array.from(raw, (v) => v / 65535);
      const blocks = Math.ceil(preset.frames / preset.fps / BLOCK_SECONDS) + 1;
      buffer.current = { coords: new Float32Array(blocks * 3).fill(NaN), blocks: 0, done: false, last: [NaN, NaN, NaN] };
      setPath(buffer.current.coords);
      sim.post({ type: "video", id, frames, frameCount: preset.frames, fps: preset.fps, duration: preset.frames / preset.fps }, [frames.buffer]);
      const element = video.current;
      if (element) {
        element.src = `${ASSET_BASE}/videos/${preset.id}.mp4`;
        element.currentTime = 0;
      }
    },
    [sim],
  );

  // Keep playback behind the simulation and advance the displayed path with the video.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const element = video.current;
      const b = buffer.current;
      if (!element || !active) return;
      const t = element.currentTime;
      const available = b.blocks * BLOCK_SECONDS;
      if (!b.done && !element.paused && t > available - 0.1) {
        element.pause();
        setWaiting(true);
      } else if (waiting && (b.done || available > t + 1.0)) {
        setWaiting(false);
        element.play().catch(() => undefined);
      }
      setShown(Math.min(Math.floor(t / BLOCK_SECONDS) + 1, b.blocks));
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [active, waiting]);

  // Autoplay once one second is simulated.
  useEffect(() => {
    const element = video.current;
    if (element && active && element.paused && !waiting && simulated >= 1 && element.currentTime === 0) {
      element.play().catch(() => undefined);
    }
  }, [simulated, active, waiting]);

  return (
    <div className="connectome-panel">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video overflow-hidden rounded-md bg-black">
            <video ref={video} className="h-full w-full" controls muted playsInline preload="metadata" aria-label={active ? `${active.title} video` : "Selected video"} />
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/60">
                Choose a video below to simulate it.
              </div>
            )}
            {waiting && (
              <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs text-white/80" aria-live="polite">
                Simulating ahead…
              </div>
            )}
          </div>
          <div className="text-xs leading-relaxed text-white/55" aria-live="polite">
            {active ? (
              <>
                {simulated.toFixed(1)} s simulated
                {speed ? ` · ${speed.toFixed(1)}× real time` : ""} · Footage:{" "}
                <a className="connectome-link" href={active.page_url} target="_blank" rel="noreferrer">
                  {active.creator}
                </a>{" "}
                ({active.license})
              </>
            ) : (
              sim.status
            )}
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
            disabled={!sim.ready}
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
