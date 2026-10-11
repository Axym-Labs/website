import { hashNormal, OUT, STATE, type Runtime, type Simulator } from "./runtime";

/** Reference CPU implementation; mirrors the WGSL kernels and the Python BatchedFlyVis. */
export class CpuSimulator implements Simulator {
  readonly kind = "cpu" as const;
  readonly maxBatch: number;
  private batch = 1;
  private hidden: Float32Array;
  private activity: Float32Array;
  private next: Float32Array;
  private sigmaShift: Float32Array;
  private sigmaSum: Float64Array;
  private sigmaSquare: Float64Array;
  private sigmaCount = 0;
  private readonly m: Float32Array; // packed folded parameters
  private readonly scratch = new Float64Array(STATE);

  constructor(private readonly rt: Runtime, maxBatch = 9) {
    this.maxBatch = maxBatch;
    const n = rt.nodes;
    this.hidden = new Float32Array(maxBatch * n * STATE);
    this.activity = new Float32Array(maxBatch * n * OUT);
    this.next = new Float32Array(maxBatch * n * OUT);
    const free = (n - rt.inputCells) * 12;
    this.sigmaShift = new Float32Array(free);
    this.sigmaSum = new Float64Array(free);
    this.sigmaSquare = new Float64Array(free);
    this.m = packModel(rt);
  }

  reset(batch: number) {
    this.batch = batch;
    this.hidden.fill(0);
    this.activity.fill(0);
  }

  async broadcast(batch: number) {
    const n = this.rt.nodes;
    for (let b = 1; b < batch; b++) {
      this.hidden.copyWithin(b * n * STATE, 0, n * STATE);
      this.activity.copyWithin(b * n * OUT, 0, n * OUT);
    }
    this.batch = batch;
  }

  resetSigma() {
    this.sigmaCount = 0;
    this.sigmaSum.fill(0);
    this.sigmaSquare.fill(0);
  }

  async run(stimulus: Float32Array, blocks: number, options?: { sigma?: { from: number; to: number; offset: number } }) {
    const { nodes: n, inputCells, columns, rowPtr, col, weight, recordIndex } = this.rt;
    const B = this.batch;
    const R = recordIndex.length;
    const perBlock = B * OUT * columns;
    const repeat = stimulus.length === perBlock;
    const recorded = new Float32Array(blocks * B * OUT * R);
    const m = this.m;
    for (let k = 0; k < blocks; k++) {
      const stimOffset = repeat ? 0 : k * perBlock;
      for (let b = 0; b < B; b++) {
        const act = b * n * OUT;
        for (let i = 0; i < inputCells; i++) {
          const column = i % columns;
          for (let t = 0; t < OUT; t++) {
            this.activity[act + i * OUT + t] = stimulus[stimOffset + (b * OUT + t) * columns + column];
          }
        }
      }
      for (let b = 0; b < B; b++) {
        const act = b * n * OUT;
        const hid = b * n * STATE;
        for (let node = 0; node < n; node++) {
          let c0 = 0, c1 = 0, c2 = 0, c3 = 0;
          for (let e = rowPtr[node]; e < rowPtr[node + 1]; e++) {
            const w = weight[e];
            const s = act + col[e] * OUT;
            c0 += w * this.activity[s];
            c1 += w * this.activity[s + 1];
            c2 += w * this.activity[s + 2];
            c3 += w * this.activity[s + 3];
          }
          c0 = Math.fround(c0); c1 = Math.fround(c1); c2 = Math.fround(c2); c3 = Math.fround(c3);
          const h = hid + node * STATE;
          const s = this.scratch;
          for (let j = 0; j < STATE; j++) s[j] = this.hidden[h + j];
          for (let j = 0; j < STATE; j++) {
            let pre = m[P1 + j * 4] * c0 + m[P1 + j * 4 + 1] * c1 + m[P1 + j * 4 + 2] * c2 + m[P1 + j * 4 + 3] * c3 + m[P0 + j];
            for (let q = 0; q < STATE; q++) pre += m[P2 + j * STATE + q] * s[q];
            const d = m[DECAY + j];
            this.hidden[h + j] = d * s[j] + (1 - d) * m[GAIN + j] * Math.tanh(pre);
          }
          const o = act + node * OUT;
          for (let t = 0; t < OUT; t++) {
            let value = m[G2 + t * 4] * c0 + m[G2 + t * 4 + 1] * c1 + m[G2 + t * 4 + 2] * c2 + m[G2 + t * 4 + 3] * c3 + m[G0 + t];
            for (let q = 0; q < STATE; q++) value += m[G1 + t * STATE + q] * this.hidden[h + q];
            this.next[o + t] = value;
          }
        }
      }
      const swap = this.activity;
      this.activity = this.next;
      this.next = swap;
      for (let b = 0; b < B; b++) {
        const act = b * n * OUT;
        const out = (k * B + b) * OUT * R;
        for (let t = 0; t < OUT; t++) {
          for (let r = 0; r < R; r++) recorded[out + t * R + r] = this.activity[act + recordIndex[r] * OUT + t];
        }
      }
      const sigma = options?.sigma;
      if (sigma) {
        const index = sigma.offset + k;
        if (index >= sigma.from && index < sigma.to) this.accumulateSigma();
      }
    }
    return recorded;
  }

  private accumulateSigma() {
    const { nodes: n, inputCells } = this.rt;
    const first = this.sigmaCount === 0;
    for (let cell = inputCells; cell < n; cell++) {
      const base = (cell - inputCells) * 12;
      for (let j = 0; j < 12; j++) {
        const value = j < STATE ? this.hidden[cell * STATE + j] : this.activity[cell * OUT + j - STATE];
        if (first) this.sigmaShift[base + j] = value;
        const delta = value - this.sigmaShift[base + j];
        this.sigmaSum[base + j] += delta;
        this.sigmaSquare[base + j] += delta * delta;
      }
    }
    this.sigmaCount++;
  }

  private sigmaAt(index: number, floor: number) {
    const mean = this.sigmaSum[index] / this.sigmaCount;
    const variance = Math.max(this.sigmaSquare[index] / this.sigmaCount - mean * mean, 0);
    return Math.sqrt(variance);
  }

  async perturb(amplitude: number, seeds: number[], floor: number) {
    const { nodes: n, inputCells } = this.rt;
    for (let copy = 1; copy < this.batch; copy++) {
      const seed = seeds[copy - 1];
      for (let cell = inputCells; cell < n; cell++) {
        const base = (cell - inputCells) * 12;
        for (let j = 0; j < 12; j++) {
          const noise = amplitude * this.sigmaAt(base + j, floor) * hashNormal(seed, base + j);
          if (j < STATE) this.hidden[(copy * n + cell) * STATE + j] += noise;
          else this.activity[(copy * n + cell) * OUT + j - STATE] += noise;
        }
      }
    }
  }

  async snapshot() {
    const n = this.rt.nodes;
    return { hidden: this.hidden.slice(0, n * STATE), activity: this.activity.slice(0, n * OUT) };
  }

  async restore(snapshot: { hidden: Float32Array; activity: Float32Array }) {
    this.hidden.set(snapshot.hidden, 0);
    this.activity.set(snapshot.activity, 0);
    this.batch = 1;
  }

  destroy() {}
}

// Packed parameter offsets (shared with the WGSL kernel).
export const P1 = 0, P2 = 32, P0 = 96, DECAY = 104, GAIN = 112, G1 = 120, G2 = 152, G0 = 168, MODEL_SIZE = 172;

export function packModel(rt: Runtime): Float32Array {
  const m = new Float32Array(MODEL_SIZE);
  const { P1: p1, P2: p2, p0, decay, gain, G1: g1, G2: g2, g0 } = rt.model;
  p1.forEach((row, j) => row.forEach((v, t) => (m[P1 + j * 4 + t] = v)));
  p2.forEach((row, j) => row.forEach((v, q) => (m[P2 + j * 8 + q] = v)));
  p0.forEach((v, j) => (m[P0 + j] = v));
  decay.forEach((v, j) => (m[DECAY + j] = v));
  gain.forEach((v, j) => (m[GAIN + j] = v));
  g1.forEach((row, t) => row.forEach((v, q) => (m[G1 + t * 8 + q] = v)));
  g2.forEach((row, t) => row.forEach((v, q) => (m[G2 + t * 4 + q] = v)));
  g0.forEach((v, t) => (m[G0 + t] = v));
  return m;
}
