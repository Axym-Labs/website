import { BLOCK_SAMPLES, BLOCK_SECONDS, SAMPLE_SECONDS, sampleIndex, type Protocol } from "./runtime";

// Port of demo_reference.py (Latent.project, knn_radius, density_percentile,
// image_statistics, perturbation return time). Medians follow torch.median:
// the lower of the two middle values for even counts.

export interface LatentModel {
  dims: number;
  features: number;
  mean: Float32Array;
  scale: Float32Array;
  components: Float32Array; // dims x features
  densityReference: Float32Array; // count x dims (dequantized)
  densityCount: number;
  densitySortedRadius: Float32Array;
  densityNeighbors: number;
}

export function lowerMedian(values: ArrayLike<number>) {
  const sorted = Float64Array.from(values as ArrayLike<number>).sort();
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Project (count x features) recorded states to (count x dims). */
export function project(latent: LatentModel, states: Float32Array, count: number) {
  const { dims, features, mean, scale, components } = latent;
  const out = new Float32Array(count * dims);
  const standardized = new Float32Array(features);
  for (let s = 0; s < count; s++) {
    const offset = s * features;
    for (let f = 0; f < features; f++) standardized[f] = (states[offset + f] - mean[f]) / scale[f];
    for (let d = 0; d < dims; d++) {
      let value = 0;
      const c = d * features;
      for (let f = 0; f < features; f++) value += standardized[f] * components[c + f];
      out[s * dims + d] = value;
    }
  }
  return out;
}

export function knnRadius(latent: LatentModel, point: Float32Array, offset: number) {
  const { dims, densityReference: ref, densityCount, densityNeighbors: k } = latent;
  const best = new Float64Array(k).fill(Infinity);
  for (let r = 0; r < densityCount; r++) {
    let sum = 0;
    const base = r * dims;
    for (let d = 0; d < dims; d++) {
      const diff = point[offset + d] - ref[base + d];
      sum += diff * diff;
      if (sum >= best[k - 1]) break;
    }
    if (sum < best[k - 1]) {
      let i = k - 1;
      while (i > 0 && best[i - 1] > sum) {
        best[i] = best[i - 1];
        i--;
      }
      best[i] = sum;
    }
  }
  return Math.sqrt(best[k - 1]);
}

/** Percent of reference states with a larger k-NN radius (that are less dense). */
export function densityPercentile(latent: LatentModel, radius: number) {
  const sorted = latent.densitySortedRadius;
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= radius) lo = mid + 1;
    else hi = mid;
  }
  return (100 * (sorted.length - lo)) / sorted.length;
}

function blockCadence(start: number, stop: number) {
  const first = start + ((((-(start + 1)) % BLOCK_SAMPLES) + BLOCK_SAMPLES) % BLOCK_SAMPLES);
  const index: number[] = [];
  for (let i = first; i < stop; i += BLOCK_SAMPLES) index.push(i);
  return index;
}

function meanSpeed(z: Float32Array, dims: number, start: number, stop: number) {
  const index = blockCadence(start, stop);
  let total = 0;
  for (let i = 1; i < index.length; i++) {
    let sum = 0;
    for (let d = 0; d < dims; d++) {
      const diff = z[index[i] * dims + d] - z[index[i - 1] * dims + d];
      sum += diff * diff;
    }
    total += Math.sqrt(sum);
  }
  return total / (index.length - 1) / BLOCK_SECONDS;
}

function minDistance(a: Float32Array, aIndex: number, b: Float32Array, bFrom: number, bTo: number, dims: number, use: number) {
  let best = Infinity;
  for (let j = bFrom; j < bTo; j++) {
    let sum = 0;
    for (let d = 0; d < use; d++) {
      const diff = a[aIndex * dims + d] - b[j * dims + d];
      sum += diff * diff;
    }
    if (sum < best) best = sum;
  }
  return Math.sqrt(best);
}

/** First principal-component scores via the same deterministic power iteration as Python. */
function leadingComponent(values: Float64Array, rows: number, cols: number, iterations = 100) {
  let vector = new Float64Array(cols).fill(1 / Math.sqrt(cols));
  const projected = new Float64Array(rows);
  for (let it = 0; it < iterations; it++) {
    for (let r = 0; r < rows; r++) {
      let sum = 0;
      const o = r * cols;
      for (let c = 0; c < cols; c++) sum += values[o + c] * vector[c];
      projected[r] = sum;
    }
    const next = new Float64Array(cols);
    for (let r = 0; r < rows; r++) {
      const o = r * cols;
      const p = projected[r];
      for (let c = 0; c < cols; c++) next[c] += values[o + c] * p;
    }
    let norm = 0;
    for (let c = 0; c < cols; c++) norm += next[c] * next[c];
    norm = Math.max(Math.sqrt(norm), 1e-30);
    for (let c = 0; c < cols; c++) next[c] /= norm;
    vector = next;
  }
  const scores = new Float64Array(rows);
  for (let r = 0; r < rows; r++) {
    let sum = 0;
    const o = r * cols;
    for (let c = 0; c < cols; c++) sum += values[o + c] * vector[c];
    scores[r] = sum;
  }
  return scores;
}

function spectralHalf(half: Float64Array) {
  const n = half.length;
  // Least-squares line fit.
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i; sy += half[i]; sxx += i * i; sxy += i * half[i];
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const residual = new Float64Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) {
    residual[i] = half[i] - (slope * i + intercept);
    mean += residual[i];
  }
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (residual[i] - mean) ** 2;
  const bins = Math.floor(n / 2) + 1;
  const power = new Float64Array(bins);
  for (let k = 1; k < bins; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) {
      const angle = (-2 * Math.PI * k * i) / n;
      re += residual[i] * Math.cos(angle);
      im += residual[i] * Math.sin(angle);
    }
    power[k] = re * re + im * im;
  }
  let peak = 0;
  let total = 0;
  for (let k = 0; k < bins; k++) {
    total += power[k];
    if (power[k] > power[peak]) peak = k;
  }
  return {
    peakHz: peak / (n * SAMPLE_SECONDS),
    peakPowerFraction: power[peak] / total,
    amplitude: Math.sqrt(variance / n),
  };
}

export interface ImageStatistics {
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
  /** Latent path (block cadence) for display. */
  path: Float32Array;
}

/**
 * `recorded` holds the hold recording (samples x R); `warmTail` the gray warmup
 * recording ending at onset (tailSamples x R).
 */
export function imageStatistics(
  recorded: Float32Array,
  samples: number,
  warmTail: Float32Array,
  tailSamples: number,
  latent: LatentModel,
  protocol: Protocol,
  onProgress?: (fraction: number) => void,
): ImageStatistics {
  const R = latent.features;
  const dims = latent.dims;
  const z = project(latent, recorded, samples);
  const tail = project(latent, warmTail, tailSamples);
  const [speedLo, speedHi] = protocol.speed_seconds.map(sampleIndex);
  const latentSpeed = meanSpeed(z, dims, speedLo, Math.min(speedHi, samples));
  const pathIndex = blockCadence(0, samples);
  const pathPercentile = pathIndex.map((s, i) => {
    if (onProgress && i % 16 === 0) onProgress(i / pathIndex.length);
    return densityPercentile(latent, knnRadius(latent, z, s * dims));
  });
  const pathDensityPercentile = pathPercentile.reduce((a, b) => a + b, 0) / pathPercentile.length;
  const [dLo, dHi] = protocol.descriptor_seconds.map(sampleIndex);
  const descriptor = new Float32Array(dims);
  for (let s = dLo; s < dHi; s++) for (let d = 0; d < dims; d++) descriptor[d] += z[s * dims + d];
  for (let d = 0; d < dims; d++) descriptor[d] /= dHi - dLo;

  const orbitCfg = protocol.orbit;
  const [refLo, refHi] = orbitCfg.reference_orbit_seconds.map(sampleIndex);
  const use = orbitCfg.approach_pca_components;
  const [tranLo, tranHi] = orbitCfg.transition_seconds.map(sampleIndex);
  const [postLo, postHi] = orbitCfg.post_transition_seconds.map(sampleIndex);
  const transition: number[] = [];
  for (let s = tailSamples + tranLo; s < tailSamples + tranHi; s++) transition.push(minDistance(tail, s, z, refLo, refHi, dims, use));
  const post: number[] = [];
  for (let s = postLo; s < postHi; s++) post.push(minDistance(z, s, z, refLo, refHi, dims, use));
  const approachRatio = lowerMedian(transition) / Math.max(lowerMedian(post), 1e-12);

  const [oscLo, oscHi] = orbitCfg.oscillation_seconds.map(sampleIndex);
  const rows = oscHi - oscLo;
  const standardized = new Float64Array(rows * R);
  for (let f = 0; f < R; f++) {
    let mean = 0;
    for (let s = oscLo; s < oscHi; s++) mean += recorded[s * R + f];
    mean /= rows;
    let variance = 0;
    for (let s = oscLo; s < oscHi; s++) variance += (recorded[s * R + f] - mean) ** 2;
    const spread = Math.sqrt(variance / rows);
    if (spread > 1e-8) {
      for (let s = oscLo; s < oscHi; s++) standardized[(s - oscLo) * R + f] = (recorded[s * R + f] - mean) / spread;
    }
  }
  const component = leadingComponent(standardized, rows, R);
  const split = Math.ceil(rows / 2);
  const first = spectralHalf(component.slice(0, split));
  const second = spectralHalf(component.slice(split));
  const peakFrequencyDriftHz = Math.abs(first.peakHz - second.peakHz);
  const minPeakPowerFraction = Math.min(first.peakPowerFraction, second.peakPowerFraction);
  const amplitudeRatio = second.amplitude / Math.max(first.amplitude, 1e-30);
  const [low, high] = orbitCfg.amplitude_ratio;
  const stableOrbit =
    approachRatio >= orbitCfg.minimum_orbit_approach_ratio &&
    peakFrequencyDriftHz <= orbitCfg.maximum_peak_frequency_drift_hz &&
    minPeakPowerFraction >= orbitCfg.minimum_peak_power_fraction &&
    amplitudeRatio >= low &&
    amplitudeRatio <= high;

  const centre = new Float64Array(dims);
  for (let s = refLo; s < refHi; s++) for (let d = 0; d < dims; d++) centre[d] += z[s * dims + d];
  for (let d = 0; d < dims; d++) centre[d] /= refHi - refLo;
  let radius = 0;
  for (let s = refLo; s < refHi; s++) for (let d = 0; d < dims; d++) radius += (z[s * dims + d] - centre[d]) ** 2;
  const orbitRadius = Math.sqrt(radius / (refHi - refLo));
  const orbitSpeed = meanSpeed(z, dims, refLo, refHi);
  const orbitPercentiles = pathIndex.map((s, i) => [s, pathPercentile[i]]).filter(([s]) => s >= refLo && s < refHi);
  const orbitDensityPercentile = orbitPercentiles.reduce((a, [, p]) => a + p, 0) / orbitPercentiles.length;
  const path = new Float32Array(pathIndex.length * dims);
  pathIndex.forEach((s, i) => path.set(z.subarray(s * dims, (s + 1) * dims), i * dims));
  return {
    latentSpeed,
    pathDensityPercentile,
    descriptor,
    approachRatio,
    peakFrequencyDriftHz,
    minPeakPowerFraction,
    amplitudeRatio,
    orbitFrequencyHz: second.peakHz,
    stableOrbit,
    orbitRadius,
    orbitSpeed,
    orbitDensityPercentile,
    path,
  };
}

/**
 * Distance tracker for the perturbation test. `orbit` is the hold recording
 * window (phases x R). Call `measure` with each branch's last recorded sample
 * per block; `result` returns the return time constant and late ratios.
 */
export class ReturnTracker {
  private readonly scale: Float64Array;
  private readonly weight: Float64Array;
  private readonly count: number;
  private readonly orbit: Float64Array;
  private readonly distances: number[][] = [];

  constructor(recorded: Float32Array, lo: number, hi: number, private readonly R: number, floor: number, private readonly branches: number) {
    const phases = hi - lo;
    this.scale = new Float64Array(R);
    this.weight = new Float64Array(R);
    let count = 0;
    for (let f = 0; f < R; f++) {
      let mean = 0;
      for (let s = lo; s < hi; s++) mean += recorded[s * R + f];
      mean /= phases;
      let variance = 0;
      for (let s = lo; s < hi; s++) variance += (recorded[s * R + f] - mean) ** 2;
      const spread = Math.sqrt(variance / phases);
      const masked = spread > floor;
      this.scale[f] = masked ? spread : 1;
      this.weight[f] = masked ? 1 : 0;
      count += masked ? 1 : 0;
    }
    this.count = Math.max(count, 1);
    this.orbit = new Float64Array(phases * R);
    for (let s = lo; s < hi; s++) {
      for (let f = 0; f < R; f++) this.orbit[(s - lo) * R + f] = (recorded[s * R + f] / this.scale[f]) * this.weight[f];
    }
    for (let b = 0; b < branches; b++) this.distances.push([]);
  }

  /** `state` holds branches x R values (the last sample of the block per branch). */
  measure(state: Float32Array) {
    const { R } = this;
    const phases = this.orbit.length / R;
    const scaled = new Float64Array(R);
    for (let b = 0; b < this.branches; b++) {
      for (let f = 0; f < R; f++) scaled[f] = (state[b * R + f] / this.scale[f]) * this.weight[f];
      let best = Infinity;
      for (let p = 0; p < phases; p++) {
        let sum = 0;
        const o = p * R;
        for (let f = 0; f < R; f++) {
          const diff = scaled[f] - this.orbit[o + f];
          sum += diff * diff;
          if (sum >= best) break;
        }
        if (sum < best) best = sum;
      }
      this.distances[b].push(Math.sqrt(best) / Math.sqrt(this.count));
    }
  }

  result(lateSeconds: number, threshold: number) {
    const control = this.distances[0];
    const late = Math.round(lateSeconds / BLOCK_SECONDS);
    const returnTimes: number[] = [];
    const lateRatios: number[] = [];
    for (let b = 1; b < this.branches; b++) {
      const d = this.distances[b];
      const initial = Math.max(d[0], 1e-12);
      const excess = d.map((value, i) => (value - control[i]) / initial);
      returnTimes.push(excess.reduce((a, e) => a + Math.max(e, 0), 0) * BLOCK_SECONDS);
      lateRatios.push(lowerMedian(excess.slice(-late)));
    }
    return {
      returnTime: lowerMedian(returnTimes),
      returnRatio: lowerMedian(lateRatios),
      returnedSeeds: lateRatios.filter((r) => r < threshold).length,
      returnTimes,
      excessCurves: this.distances.slice(1).map((d) => d.map((v, i) => (v - control[i]) / Math.max(d[0], 1e-12))),
    };
  }
}
