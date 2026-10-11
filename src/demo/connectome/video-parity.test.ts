// Parity of the browser video path (lattice frames -> stimulus -> simulation -> latent) with Python run_videos.
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { project } from "./analysis";
import { loadLatent } from "./assets";
import { CpuSimulator } from "./cpuSim";
import { BLOCK_SAMPLES, loadRuntime } from "./runtime";
import { videoBlocks } from "./stimulus";
import { warmup } from "./protocol";

const DIR = process.env.CONNECTOME_VIDEO_VECTORS ?? "";
const enabled = DIR !== "" && existsSync(`${DIR}/coast.json`);

describe.skipIf(!enabled)("connectome video parity", () => {
  it("matches Python block-cadence latent states", async () => {
    globalThis.fetch = (async (url: string) => new Response(readFileSync(url.replace(/^file:\/\//, "")))) as typeof fetch;
    const rt = await loadRuntime(`file://${DIR}`);
    const latent = await loadLatent(`file://${DIR}`, 10);
    const meta = JSON.parse(readFileSync(`${DIR}/coast.json`, "utf8"));
    const raw = new Uint16Array(readFileSync(`${DIR}/coast.lattice.bin`).buffer.slice(0));
    const frames = Float32Array.from(raw, (v) => v / 65535);
    const expected = new Float32Array(readFileSync(`${DIR}/coast.latent.bin`).buffer.slice(0));
    const sim = new CpuSimulator(rt, 1);
    const warm = await warmup(sim, rt);
    await sim.restore(warm.snapshot);
    const blocks = 40;
    const stimulus = videoBlocks(frames, meta.frames, meta.fps, 0, blocks * BLOCK_SAMPLES, rt);
    const recorded = await sim.run(stimulus, blocks);
    const R = rt.recordIndex.length;
    const last = new Float32Array(blocks * R);
    for (let k = 0; k < blocks; k++) last.set(recorded.subarray((k * 4 + 3) * R, (k * 4 + 4) * R), k * R);
    const z = project(latent, last, blocks);
    let worst = 0;
    let scale = 0;
    for (let i = 0; i < blocks * latent.dims; i++) {
      worst = Math.max(worst, Math.abs(z[i] - expected[i]));
      scale = Math.max(scale, Math.abs(expected[i]));
    }
    console.log("video latent max diff", worst, "scale", scale);
    expect(worst / scale).toBeLessThan(1e-3);
  }, 600_000);
});
