// Exported AxoSim FlyVis runtime: graph, folded neuron update and protocol.
// Produced by `python -m axosim_demo browser-demo export` (Axym-Labs/axosim-demo).

export interface FoldedModel {
  P1: number[][]; // 8 x 4
  P2: number[][]; // 8 x 8
  p0: number[];
  decay: number[];
  gain: number[];
  G1: number[][]; // 4 x 8
  G2: number[][]; // 4 x 4
  g0: number[];
}

export interface Protocol {
  warmup_seconds: number;
  hold_seconds: number;
  descriptor_seconds: [number, number];
  speed_seconds: [number, number];
  orbit: {
    transition_seconds: [number, number];
    post_transition_seconds: [number, number];
    reference_orbit_seconds: [number, number];
    oscillation_seconds: [number, number];
    approach_pca_components: number;
    minimum_orbit_approach_ratio: number;
    maximum_peak_frequency_drift_hz: number;
    minimum_peak_power_fraction: number;
    amplitude_ratio: [number, number];
  };
  perturbation: {
    sigma_window_seconds: [number, number];
    distance_orbit_seconds: [number, number];
    amplitude_sigma: number;
    seeds: number[];
    continuation_seconds: number;
    late_seconds: number;
    return_threshold: number;
    sigma_floor: number;
  };
}

export interface StimulusConfig {
  sample_seconds: number;
  block_samples: number;
  frame_width: number;
  frame_height: number;
  lattice_scale: number;
  luminance: [number, number, number];
  normalization: { mean: number; standard_deviation: number; clip: [number, number] };
  gray_level: number;
}

export interface Runtime {
  nodes: number;
  edges: number;
  inputCells: number;
  columns: number;
  recordIndex: Int32Array;
  latticeX: Float64Array;
  latticeY: Float64Array;
  stimulus: StimulusConfig;
  protocol: Protocol;
  model: FoldedModel;
  rowPtr: Int32Array;
  col: Int32Array;
  weight: Float32Array;
}

export const SAMPLE_SECONDS = 0.004;
export const BLOCK_SAMPLES = 4;
export const BLOCK_SECONDS = SAMPLE_SECONDS * BLOCK_SAMPLES;
export const STATE = 8;
export const OUT = 4;

export const blocksFor = (seconds: number) => Math.ceil(seconds / BLOCK_SECONDS - 1e-9);
export const sampleIndex = (seconds: number) => Math.round(seconds / SAMPLE_SECONDS);

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
  if (url.endsWith(".gz")) {
    const stream = response.body!.pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).arrayBuffer();
  }
  return response.arrayBuffer();
}

export async function loadRuntime(base: string): Promise<Runtime> {
  const response = await fetch(`${base}/runtime.json`);
  if (!response.ok) throw new Error(`Failed to load runtime (${response.status})`);
  const descriptor = await response.json();
  const file = (name: string) => `${base}/${descriptor.files[name].path}`;
  const [rowPtr, col, weightIndex, weightTable] = await Promise.all([
    fetchBinary(file("row_ptr")),
    fetchBinary(file("col")),
    fetchBinary(file("weight_index")),
    fetchBinary(file("weight_table")),
  ]);
  const index = new Uint16Array(weightIndex);
  const table = new Float32Array(weightTable);
  const weight = new Float32Array(index.length);
  for (let e = 0; e < index.length; e++) weight[e] = table[index[e]];
  return {
    nodes: descriptor.nodes,
    edges: descriptor.edges,
    inputCells: descriptor.input_cells,
    columns: descriptor.columns,
    recordIndex: Int32Array.from(descriptor.record_index),
    latticeX: Float64Array.from(descriptor.lattice_x),
    latticeY: Float64Array.from(descriptor.lattice_y),
    stimulus: descriptor.stimulus,
    protocol: descriptor.image_protocol,
    model: descriptor.model,
    rowPtr: new Int32Array(rowPtr),
    col: new Int32Array(col),
    weight,
  };
}

// Deterministic standard normal from (seed, index): PCG hash + Box-Muller.
// Identical in the WGSL kernel so CPU and GPU perturbations agree.
export function pcgHash(value: number): number {
  const state = (Math.imul(value >>> 0, 747796405) + 2891336453) >>> 0;
  const shift = ((state >>> 28) + 4) >>> 0;
  const word = Math.imul(((state >>> shift) ^ state) >>> 0, 277803737) >>> 0;
  return ((word >>> 22) ^ word) >>> 0;
}

export function hashNormal(seed: number, index: number): number {
  const a = pcgHash((index * 2) ^ pcgHash(seed));
  const b = pcgHash((index * 2 + 1) ^ pcgHash(seed + 0x9e3779b9));
  const u1 = (a + 1) / 4294967297;
  const u2 = b / 4294967296;
  return Math.fround(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
}

/** Simulator over B independent copies of the circuit, state layout [b][node]. */
export interface Simulator {
  readonly kind: "webgpu" | "cpu";
  readonly maxBatch: number;
  /** Zero all state for `batch` copies. */
  reset(batch: number): void;
  /** Copy copy 0's state into copies 1..batch-1 (and set the active batch). */
  broadcast(batch: number): Promise<void>;
  /**
   * Advance `blocks` blocks. `stimulus` holds blocks*B*4*721 values (block, b, sample, column)
   * or B*4*721 values reused for every block. Returns recorded (block, b, 4, R).
   * When `sigmaBlocks` is set, the free-cell state of copy 0 is accumulated for
   * blocks whose index (relative to `sigmaOffset`) lies in that range.
   */
  run(
    stimulus: Float32Array,
    blocks: number,
    options?: { sigma?: { from: number; to: number; offset: number } },
  ): Promise<Float32Array>;
  /** Reset sigma accumulators. */
  resetSigma(): void;
  /** Add amplitude*sigma*N(0,1) noise to free cells of copies 1..B-1 (seed per copy). */
  perturb(amplitude: number, seeds: number[], floor: number): Promise<void>;
  /** Current state of copy 0 (hidden, activity) for snapshots. */
  snapshot(): Promise<{ hidden: Float32Array; activity: Float32Array }>;
  restore(snapshot: { hidden: Float32Array; activity: Float32Array }): Promise<void>;
  destroy(): void;
}
