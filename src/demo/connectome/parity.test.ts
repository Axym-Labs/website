// Parity of the browser CPU simulator and analysis with the Python reference.
// Requires fixtures from `axosim_demo.demo_database.write_test_vectors`; skipped otherwise.
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { imageStatistics } from "./analysis";
import { loadLatent } from "./assets";
import { CpuSimulator } from "./cpuSim";
import { BLOCK_SAMPLES, loadRuntime } from "./runtime";

const ASSETS = process.env.CONNECTOME_ASSETS ?? "";
const VECTORS = process.env.CONNECTOME_VECTORS ?? "";
const enabled = ASSETS !== "" && existsSync(`${VECTORS}/cases.json`);

const fileFetch = async (url: string) => {
  const path = url.replace(/^file:\/\//, "");
  const bytes = readFileSync(path);
  return new Response(bytes, { status: 200 });
};

describe.skipIf(!enabled)("connectome parity", () => {
  it("matches Python recordings and statistics", async () => {
    globalThis.fetch = fileFetch as typeof fetch;
    const rt = await loadRuntime(`file://${ASSETS}`);
    const latent = await loadLatent(`file://${ASSETS}`, 10);
    const cases = JSON.parse(readFileSync(`${VECTORS}/cases.json`, "utf8"));
    const R = rt.recordIndex.length;
    const warm = new Float32Array(readFileSync(`${VECTORS}/warm-record.bin`).buffer.slice(0));
    const sim = new CpuSimulator(rt, 1);
    sim.reset(1);
    const gray = new Float32Array(BLOCK_SAMPLES * rt.columns).fill(0.5);
    const warmBlocks = Math.ceil(rt.protocol.warmup_seconds / 0.016 - 1e-9);
    const warmJs = await sim.run(gray, warmBlocks);
    let warmDiff = 0;
    for (let i = 0; i < warm.length; i++) warmDiff = Math.max(warmDiff, Math.abs(warm[i] - warmJs[i]));
    console.log("warm max diff", warmDiff);
    expect(warmDiff).toBeLessThan(1e-3);
    const snapshot = await sim.snapshot();
    for (const c of cases) {
      await sim.restore(snapshot);
      const samples = Float32Array.from(c.samples);
      const stim = new Float32Array(4 * rt.columns);
      for (let t = 0; t < 4; t++) stim.set(samples, t * rt.columns);
      const early = await sim.run(stim, c.early_blocks);
      const sum = early.reduce((a, b) => a + b, 0);
      const recorded = new Float32Array(readFileSync(`${VECTORS}/${c.id}.recorded.bin`).buffer.slice(0));
      let diff = 0;
      for (let i = 0; i < early.length; i++) diff = Math.max(diff, Math.abs(recorded[i] - early[i]));
      console.log(c.id, "early sum", sum, c.early_recorded_sum, "max diff", diff);
      expect(diff).toBeLessThan(1e-3);
      const samplesCount = c.recorded_shape[0];
      const stats = imageStatistics(recorded, samplesCount, warm, warm.length / R, latent, rt.protocol);
      const py = c.stats;
      const pairs: [string, number, number][] = [
        ["latent_speed", stats.latentSpeed, py.latent_speed],
        ["path_density_percentile", stats.pathDensityPercentile, py.path_density_percentile],
        ["approach_ratio", stats.approachRatio, py.approach_ratio],
        ["peak_frequency_drift_hz", stats.peakFrequencyDriftHz, py.peak_frequency_drift_hz],
        ["min_peak_power_fraction", stats.minPeakPowerFraction, py.min_peak_power_fraction],
        ["amplitude_ratio", stats.amplitudeRatio, py.amplitude_ratio],
        ["orbit_frequency_hz", stats.orbitFrequencyHz, py.orbit_frequency_hz],
        ["stable_orbit", Number(stats.stableOrbit), py.stable_orbit],
        ["orbit_radius", stats.orbitRadius, py.orbit_radius],
        ["orbit_speed", stats.orbitSpeed, py.orbit_speed],
        ["orbit_density_percentile", stats.orbitDensityPercentile, py.orbit_density_percentile],
      ];
      for (const [name, js, ref] of pairs) {
        console.log(name.padEnd(28), js.toFixed(6), Number(ref).toFixed(6));
        expect(Math.abs(js - ref)).toBeLessThanOrEqual(1e-3 * Math.max(1, Math.abs(ref)));
      }
      let dd = 0;
      c.descriptor.forEach((v: number, i: number) => (dd = Math.max(dd, Math.abs(v - stats.descriptor[i]))));
      expect(dd).toBeLessThan(1e-3);
    }
  }, 600_000);
});
