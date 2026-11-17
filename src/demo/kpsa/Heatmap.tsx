import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./data";

const GRID = 14;
const SIZE = 224;

// Catmull-Rom weights for a sample at fractional offset t.
function cubicWeights(t: number): [number, number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [(-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2];
}

// For each output coordinate, the four source indices and weights along one axis.
const taps = Array.from({ length: SIZE }, (_, x) => {
  const u = ((x + 0.5) / SIZE) * GRID - 0.5;
  const base = Math.floor(u);
  const weights = cubicWeights(u - base);
  const index = [-1, 0, 1, 2].map((d) => Math.min(GRID - 1, Math.max(0, base + d)));
  return { index, weights };
});

/** Bicubic upscale of a 14x14 map (0..255) to SIZE x SIZE values in 0..1. */
function upscale(map: number[]): Float32Array {
  const rows = new Float32Array(GRID * SIZE);
  for (let r = 0; r < GRID; r++) {
    for (let x = 0; x < SIZE; x++) {
      const { index, weights } = taps[x];
      let value = 0;
      for (let k = 0; k < 4; k++) value += weights[k] * (map[r * GRID + index[k]] ?? 0);
      rows[r * SIZE + x] = value;
    }
  }
  const out = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    const { index, weights } = taps[y];
    for (let x = 0; x < SIZE; x++) {
      let value = 0;
      for (let k = 0; k < 4; k++) value += weights[k] * rows[index[k] * SIZE + x];
      out[y * SIZE + x] = Math.min(1, Math.max(0, value / 255));
    }
  }
  return out;
}

// Inactive area: a light paper veil that fades the photo; active area: Axym purple, opaque at the peak.
const PAPER = [247, 245, 240];
const LOW = [63, 33, 182];
const HIGH = [122, 92, 230];

function paint(canvas: HTMLCanvasElement, map: number[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Show where on this image the feature is most active: rescale the map to its own range.
  const lo = Math.min(...map);
  const hi = Math.max(...map);
  const span = hi - lo || 1;
  const values = upscale(map.map((v) => ((v - lo) / span) * 255));
  const image = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < values.length; i++) {
    const t = Math.min(1, Math.max(0, (values[i] - 0.35) / 0.65));
    const a = Math.pow(t, 0.8);
    for (let c = 0; c < 3; c++) {
      const purple = HIGH[c] + (LOW[c] - HIGH[c]) * t;
      image.data[i * 4 + c] = PAPER[c] + (purple - PAPER[c]) * Math.min(1, a * 1.6);
    }
    image.data[i * 4 + 3] = 255 * (0.38 * (1 - a) + 0.62 * a);
  }
  ctx.putImageData(image, 0, 0);
}

interface Props {
  src: string;
  alt: string;
  map?: number[] | null;
  className?: string;
  eager?: boolean;
}

/** An image in a square frame (the model's center crop) with an optional 14x14 activation overlay. */
export default function HeatmapImage({ src, alt, map, className = "", eager = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (canvas.current && map) paint(canvas.current, map);
  }, [map]);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={`relative aspect-square overflow-hidden bg-[#ebe8e1] ${className}`}>
      {!failed ? (
        <img
          src={assetUrl(src)}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs text-[#6b6875]">Image unavailable</span>
      )}
      <canvas
        ref={canvas}
        width={SIZE}
        height={SIZE}
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${map ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
