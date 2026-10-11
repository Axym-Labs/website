import type { LatentModel } from "./analysis";
import { fetchBinary } from "./runtime";

interface Layout {
  [name: string]: { offset: number; dtype: string; shape: number[] };
}

function view(buffer: ArrayBuffer, entry: { offset: number; dtype: string; shape: number[] }) {
  const length = entry.shape.reduce((a, b) => a * b, 1);
  switch (entry.dtype) {
    case "float32":
      return new Float32Array(buffer.slice(entry.offset, entry.offset + length * 4));
    case "float16": {
      const raw = new Uint16Array(buffer.slice(entry.offset, entry.offset + length * 2));
      return Float32Array.from(raw, halfToFloat);
    }
    case "int8":
      return new Int8Array(buffer.slice(entry.offset, entry.offset + length));
    case "uint8":
      return new Uint8Array(buffer.slice(entry.offset, entry.offset + length));
    case "uint16":
      return new Uint16Array(buffer.slice(entry.offset, entry.offset + length * 2));
    case "int32":
      return new Int32Array(buffer.slice(entry.offset, entry.offset + length * 4));
    default:
      throw new Error(`Unsupported dtype ${entry.dtype}`);
  }
}

export function halfToFloat(h: number) {
  const sign = h & 0x8000 ? -1 : 1;
  const exponent = (h >> 10) & 0x1f;
  const fraction = h & 0x3ff;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

export async function loadPacked(base: string, name: string) {
  const [layout, buffer] = await Promise.all([
    fetch(`${base}/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${base}/${name}.json (${r.status})`);
      return r.json() as Promise<Layout & { meta?: unknown }>;
    }),
    fetchBinary(`${base}/${name}.bin`),
  ]);
  const arrays: Record<string, ArrayLike<number>> = {};
  for (const [key, entry] of Object.entries(layout)) {
    if (key === "meta") continue;
    arrays[key] = view(buffer, entry as Layout[string]);
  }
  return { arrays, meta: (layout as { meta?: unknown }).meta };
}

export function dequantize(q: Int8Array, quant: Float32Array, dims: number) {
  const out = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) out[i] = q[i] * quant[i % dims];
  return out;
}

export async function loadLatent(base: string, neighbors: number): Promise<LatentModel> {
  const { arrays } = await loadPacked(base, "latent");
  const components = arrays.components as Float32Array;
  const mean = arrays.mean as Float32Array;
  const dims = components.length / mean.length;
  const quant = arrays.density_quant as Float32Array;
  const reference = dequantize(arrays.density_reference_q as Int8Array, quant, dims);
  return {
    dims,
    features: mean.length,
    mean,
    scale: arrays.scale as Float32Array,
    components,
    densityReference: reference,
    densityCount: reference.length / dims,
    densitySortedRadius: arrays.density_sorted_radius as Float32Array,
    densityNeighbors: neighbors,
  };
}

/** Inverse-distance k-NN placement of `point` into a fitted embedding. */
export function knnTransform(
  point: ArrayLike<number>,
  reference: Float32Array,
  coords: Float32Array,
  dims: number,
  outDims: number,
  k: number,
) {
  const count = reference.length / dims;
  const bestD = new Float64Array(k).fill(Infinity);
  const bestI = new Int32Array(k).fill(-1);
  for (let r = 0; r < count; r++) {
    let sum = 0;
    const base = r * dims;
    for (let d = 0; d < dims; d++) {
      const diff = point[d] - reference[base + d];
      sum += diff * diff;
      if (sum >= bestD[k - 1]) break;
    }
    if (sum < bestD[k - 1]) {
      let i = k - 1;
      while (i > 0 && bestD[i - 1] > sum) {
        bestD[i] = bestD[i - 1];
        bestI[i] = bestI[i - 1];
        i--;
      }
      bestD[i] = sum;
      bestI[i] = r;
    }
  }
  const out = new Float32Array(outDims);
  let total = 0;
  for (let i = 0; i < k; i++) {
    const w = 1 / Math.max(Math.sqrt(bestD[i]), 1e-9);
    total += w;
    for (let d = 0; d < outDims; d++) out[d] += w * coords[bestI[i] * outDims + d];
  }
  for (let d = 0; d < outDims; d++) out[d] /= total;
  return { coords: out, neighbors: Array.from(bestI), distances: Array.from(bestD, Math.sqrt) };
}

export interface ReferenceStats {
  images: number;
  stableImages: number;
  stableFraction: number;
  reliability: Record<string, number>;
  quantiles: Record<string, number[]>; // 1001 quantiles per statistic
}

/** Percent of reference values strictly below `value` (interpolated over quantiles). */
export function percentileOf(quantiles: number[], value: number) {
  const n = quantiles.length - 1;
  if (value <= quantiles[0]) return 0;
  if (value >= quantiles[n]) return 100;
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (quantiles[mid] <= value) lo = mid;
    else hi = mid;
  }
  const span = quantiles[hi] - quantiles[lo];
  const fraction = span > 0 ? (value - quantiles[lo]) / span : 0.5;
  return (100 * (lo + fraction)) / n;
}
