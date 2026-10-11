/// <reference lib="webworker" />
import type { LatentModel } from "./analysis";
import { project } from "./analysis";
import { dequantize, knnTransform, loadLatent, loadPacked } from "./assets";
import { CpuSimulator } from "./cpuSim";
import { GpuSimulator, requestDevice } from "./gpuSim";
import { runImage, warmup, type Warm } from "./protocol";
import { BLOCK_SAMPLES, loadRuntime, type Runtime, type Simulator } from "./runtime";
import { imageSamples, videoBlocks } from "./stimulus";

export interface StateCloud {
  latent: Float32Array; // count x dims (dequantized)
  coords: Float32Array; // count x 3
  dims: number;
}

let rt: Runtime;
let latent: LatentModel;
let sim: Simulator;
let warm: Warm;
let cloud: StateCloud;
let busy = Promise.resolve();
let videoToken = 0;

const post = (message: unknown, transfer: Transferable[] = []) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(message, transfer);

const CLOUD_NEIGHBORS = 10;

function toCloud(z: Float32Array, index: number) {
  return knnTransform(z.subarray(index * cloud.dims, (index + 1) * cloud.dims), cloud.latent, cloud.coords, cloud.dims, 3, CLOUD_NEIGHBORS).coords;
}

/** 3D state-space positions for the last sample of each recorded block. */
function blockCoords(recorded: Float32Array, blocks: number, every = 2) {
  const R = rt.recordIndex.length;
  const states = new Float32Array(blocks * R);
  for (let k = 0; k < blocks; k++) {
    const offset = (k * BLOCK_SAMPLES + BLOCK_SAMPLES - 1) * R;
    states.set(recorded.subarray(offset, offset + R), k * R);
  }
  const z = project(latent, states, blocks);
  const coords = new Float32Array(blocks * 3).fill(NaN);
  for (let k = 0; k < blocks; k += every) coords.set(toCloud(z, k), k * 3);
  return coords;
}

async function init(base: string, preferCpu: boolean) {
  const started = performance.now();
  post({ type: "status", text: "Loading connectome (45,669 cells, 1.5M synapses)…" });
  rt = await loadRuntime(base);
  latent = await loadLatent(base, 10);
  const { arrays } = await loadPacked(base, "state-cloud");
  const dims = (arrays.latent_quant as Float32Array).length;
  cloud = {
    dims,
    latent: dequantize(arrays.latent_q as Int8Array, arrays.latent_quant as Float32Array, dims),
    coords: arrays.coords as Float32Array,
  };
  const device = preferCpu ? null : await requestDevice();
  if (device) {
    try {
      sim = await GpuSimulator.create(device, rt, 9);
    } catch (error) {
      console.warn("WebGPU unavailable, using CPU", error);
    }
  }
  if (!sim) sim = new CpuSimulator(rt, 9);
  post({ type: "status", text: "Settling the circuit under a gray field…" });
  warm = await warmup(sim, rt);
  post({ type: "ready", kind: sim.kind, seconds: (performance.now() - started) / 1000 });
}

async function image(id: number, rgba: Uint8ClampedArray, width: number, height: number) {
  const samples = imageSamples(rgba, width, height, rt);
  post({ type: "retina", id, samples });
  const started = performance.now();
  const result = await runImage(sim, rt, latent, warm, samples, (phase, fraction, extra) => {
    const message: Record<string, unknown> = { type: "imageProgress", id, phase, fraction };
    if (extra?.recorded) {
      message.coords = blockCoords(extra.recorded, extra.recorded.length / (BLOCK_SAMPLES * rt.recordIndex.length));
      message.firstBlock = extra.firstBlock;
    }
    post(message);
  });
  const { path, ...stats } = result.stats;
  post({ type: "imageResult", id, stats, stability: result.stability, timings: result.timings, seconds: (performance.now() - started) / 1000 });
}

async function video(id: number, frames: Float32Array, frameCount: number, fps: number, duration: number) {
  const token = ++videoToken;
  await sim.restore(warm.snapshot);
  const totalSamples = Math.floor(duration / 0.004);
  const chunkBlocks = 8;
  const started = performance.now();
  for (let block = 0; block * BLOCK_SAMPLES < totalSamples; block += chunkBlocks) {
    if (token !== videoToken) return;
    const count = Math.min(chunkBlocks, Math.ceil(totalSamples / BLOCK_SAMPLES) - block);
    const stimulus = videoBlocks(frames, frameCount, fps, block * BLOCK_SAMPLES, count * BLOCK_SAMPLES, rt);
    const recorded = await sim.run(stimulus, count);
    const coords = blockCoords(recorded, count, 1);
    const elapsed = (performance.now() - started) / 1000;
    post({ type: "videoChunk", id, firstBlock: block, coords, speed: ((block + count) * 0.016) / elapsed }, [coords.buffer]);
  }
  if (token === videoToken) post({ type: "videoDone", id });
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data;
  if (data.type === "cancelVideo") {
    videoToken++;
    return;
  }
  busy = busy
    .then(async () => {
      if (data.type === "init") await init(data.base, data.preferCpu);
      else if (data.type === "image") await image(data.id, data.rgba, data.width, data.height);
      else if (data.type === "video") await video(data.id, data.frames, data.frameCount, data.fps, data.duration);
    })
    .catch((error) => post({ type: "error", id: data.id, message: String(error?.message ?? error) }));
};
