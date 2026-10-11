import { imageStatistics, ReturnTracker, type ImageStatistics, type LatentModel } from "./analysis";
import { BLOCK_SAMPLES, blocksFor, sampleIndex, type Runtime, type Simulator } from "./runtime";

// Port of demo_database.Runner (warmup, hold) and demo_reference.perturbation_stability.

export interface Warm {
  snapshot: { hidden: Float32Array; activity: Float32Array };
  record: Float32Array; // samples x R
  samples: number;
}

export async function warmup(sim: Simulator, rt: Runtime): Promise<Warm> {
  sim.reset(1);
  const gray = new Float32Array(BLOCK_SAMPLES * rt.columns).fill(rt.stimulus.gray_level);
  const blocks = blocksFor(rt.protocol.warmup_seconds);
  const record = await sim.run(gray, blocks);
  return { snapshot: await sim.snapshot(), record, samples: blocks * BLOCK_SAMPLES };
}

export function sigmaBlocks(rt: Runtime) {
  const [lo, hi] = rt.protocol.perturbation.sigma_window_seconds.map(sampleIndex);
  const blocks = blocksFor(rt.protocol.hold_seconds);
  let from = -1;
  let to = -1;
  for (let block = 0; block < blocks; block++) {
    if (lo <= block * 4 && block * 4 + 3 < hi) {
      if (from < 0) from = block;
      to = block + 1;
    }
  }
  return { from, to };
}

export type Phase = "hold" | "analysis" | "perturbation" | "done";

export interface ImageResult {
  stats: ImageStatistics;
  stability: ReturnType<ReturnTracker["result"]>;
  timings: Record<string, number>;
}

export async function runImage(
  sim: Simulator,
  rt: Runtime,
  latent: LatentModel,
  warm: Warm,
  samples: Float32Array,
  onProgress: (phase: Phase, fraction: number, extra?: { recorded?: Float32Array; firstBlock?: number }) => void,
): Promise<ImageResult> {
  const timings: Record<string, number> = {};
  const R = rt.recordIndex.length;
  const protocol = rt.protocol;
  const stimulus = new Float32Array(BLOCK_SAMPLES * rt.columns);
  for (let t = 0; t < BLOCK_SAMPLES; t++) stimulus.set(samples, t * rt.columns);
  await sim.restore(warm.snapshot);
  sim.resetSigma();
  const blocks = blocksFor(protocol.hold_seconds);
  const sigma = sigmaBlocks(rt);
  const recorded = new Float32Array(blocks * BLOCK_SAMPLES * R);
  let started = performance.now();
  const chunk = 16;
  for (let start = 0; start < blocks; start += chunk) {
    const count = Math.min(chunk, blocks - start);
    const part = await sim.run(stimulus, count, { sigma: { ...sigma, offset: start } });
    recorded.set(part, start * BLOCK_SAMPLES * R);
    onProgress("hold", (start + count) / blocks, { recorded: part, firstBlock: start });
  }
  timings.hold = performance.now() - started;

  started = performance.now();
  onProgress("analysis", 0);
  const stats = imageStatistics(recorded, blocks * BLOCK_SAMPLES, warm.record, warm.samples, latent, protocol, (f) =>
    onProgress("analysis", f),
  );
  timings.analysis = performance.now() - started;

  started = performance.now();
  const cfg = protocol.perturbation;
  const branches = cfg.seeds.length + 1;
  const [lo, hi] = cfg.distance_orbit_seconds.map(sampleIndex);
  const tracker = new ReturnTracker(recorded, lo, hi, R, cfg.sigma_floor, branches);
  await sim.broadcast(branches);
  await sim.perturb(cfg.amplitude_sigma, cfg.seeds, cfg.sigma_floor);
  const branchStimulus = new Float32Array(branches * stimulus.length);
  for (let b = 0; b < branches; b++) branchStimulus.set(stimulus, b * stimulus.length);
  const steps = blocksFor(cfg.continuation_seconds);
  const perBranch = BLOCK_SAMPLES * R;
  const last = new Float32Array(branches * R);
  for (let start = 0; start < steps; start += 8) {
    const count = Math.min(8, steps - start);
    const part = await sim.run(branchStimulus, count);
    for (let k = 0; k < count; k++) {
      for (let b = 0; b < branches; b++) {
        const offset = (k * branches + b) * perBranch + (BLOCK_SAMPLES - 1) * R;
        last.set(part.subarray(offset, offset + R), b * R);
      }
      tracker.measure(last);
    }
    onProgress("perturbation", (start + count) / steps);
  }
  timings.perturbation = performance.now() - started;
  const stability = tracker.result(cfg.late_seconds, cfg.return_threshold);
  onProgress("done", 1);
  return { stats, stability, timings };
}
