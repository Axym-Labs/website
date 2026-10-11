/// <reference types="@webgpu/types" />
import { MODEL_SIZE, packModel } from "./cpuSim";
import { OUT, STATE, type Runtime, type Simulator } from "./runtime";

const WORKGROUP = 128;
const MAX_CHUNK = 32;

const COMMON = /* wgsl */ `
struct Dims { batch: u32, nodes: u32, inputs: u32, columns: u32, records: u32, free: u32, count: u32, pad: u32 };
@group(0) @binding(0) var<uniform> dims: Dims;
`;

const CLAMP = COMMON + /* wgsl */ `
@group(0) @binding(1) var<storage, read> stim: array<f32>;
@group(0) @binding(2) var<storage, read_write> act: array<vec4<f32>>;
@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= dims.batch * dims.inputs) { return; }
  let b = id / dims.inputs;
  let i = id % dims.inputs;
  let column = i % dims.columns;
  let base = b * 4u * dims.columns + column;
  act[b * dims.nodes + i] = vec4<f32>(stim[base], stim[base + dims.columns], stim[base + 2u * dims.columns], stim[base + 3u * dims.columns]);
}`;

const STEP = COMMON + /* wgsl */ `
@group(0) @binding(1) var<storage, read> rowPtr: array<u32>;
@group(0) @binding(2) var<storage, read> col: array<u32>;
@group(0) @binding(3) var<storage, read> weight: array<f32>;
@group(0) @binding(4) var<storage, read> m: array<f32, ${MODEL_SIZE}>;
@group(0) @binding(5) var<storage, read> actIn: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> actOut: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> hidden: array<f32>;
@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= dims.batch * dims.nodes) { return; }
  let b = id / dims.nodes;
  let node = id % dims.nodes;
  let base = b * dims.nodes;
  var c = vec4<f32>(0.0);
  let end = rowPtr[node + 1u];
  for (var e = rowPtr[node]; e < end; e = e + 1u) {
    c = c + weight[e] * actIn[base + col[e]];
  }
  let h = (base + node) * 8u;
  var s: array<f32, 8>;
  for (var j = 0u; j < 8u; j = j + 1u) { s[j] = hidden[h + j]; }
  var ns: array<f32, 8>;
  for (var j = 0u; j < 8u; j = j + 1u) {
    var pre = m[j * 4u] * c.x + m[j * 4u + 1u] * c.y + m[j * 4u + 2u] * c.z + m[j * 4u + 3u] * c.w + m[96u + j];
    for (var q = 0u; q < 8u; q = q + 1u) { pre = pre + m[32u + j * 8u + q] * s[q]; }
    let d = m[104u + j];
    ns[j] = d * s[j] + (1.0 - d) * m[112u + j] * tanh(clamp(pre, -20.0, 20.0));
    hidden[h + j] = ns[j];
  }
  var o: array<f32, 4>;
  for (var t = 0u; t < 4u; t = t + 1u) {
    var v = m[152u + t * 4u] * c.x + m[152u + t * 4u + 1u] * c.y + m[152u + t * 4u + 2u] * c.z + m[152u + t * 4u + 3u] * c.w + m[168u + t];
    for (var q = 0u; q < 8u; q = q + 1u) { v = v + m[120u + t * 8u + q] * ns[q]; }
    o[t] = v;
  }
  actOut[base + node] = vec4<f32>(o[0], o[1], o[2], o[3]);
}`;

const RECORD = COMMON + /* wgsl */ `
@group(0) @binding(1) var<storage, read> recIndex: array<u32>;
@group(0) @binding(2) var<storage, read> act: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> rec: array<f32>;
@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= dims.batch * dims.records) { return; }
  let b = id / dims.records;
  let r = id % dims.records;
  let v = act[b * dims.nodes + recIndex[r]];
  let base = b * 4u * dims.records + r;
  rec[base] = v.x;
  rec[base + dims.records] = v.y;
  rec[base + 2u * dims.records] = v.z;
  rec[base + 3u * dims.records] = v.w;
}`;

const SIGMA = COMMON + /* wgsl */ `
@group(0) @binding(1) var<storage, read> act: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> hidden: array<f32>;
@group(0) @binding(3) var<storage, read_write> shift: array<f32>;
@group(0) @binding(4) var<storage, read_write> total: array<f32>;
@group(0) @binding(5) var<storage, read_write> square: array<f32>;
fn value(cell: u32, j: u32) -> f32 {
  if (j < 8u) { return hidden[cell * 8u + j]; }
  let a = act[cell];
  let t = j - 8u;
  if (t == 0u) { return a.x; }
  if (t == 1u) { return a.y; }
  if (t == 2u) { return a.z; }
  return a.w;
}
@compute @workgroup_size(${WORKGROUP})
fn init(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= dims.free) { return; }
  let cell = dims.inputs + id;
  for (var j = 0u; j < 12u; j = j + 1u) {
    shift[id * 12u + j] = value(cell, j);
    total[id * 12u + j] = 0.0;
    square[id * 12u + j] = 0.0;
  }
}
@compute @workgroup_size(${WORKGROUP})
fn accumulate(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= dims.free) { return; }
  let cell = dims.inputs + id;
  for (var j = 0u; j < 12u; j = j + 1u) {
    let delta = value(cell, j) - shift[id * 12u + j];
    total[id * 12u + j] = total[id * 12u + j] + delta;
    square[id * 12u + j] = square[id * 12u + j] + delta * delta;
  }
}`;

const PERTURB = /* wgsl */ `
struct Perturb { batch: u32, nodes: u32, inputs: u32, free: u32, count: f32, amplitude: f32, pad0: u32, pad1: u32, seeds: array<vec4<u32>, 2> };
@group(0) @binding(0) var<uniform> p: Perturb;
@group(0) @binding(1) var<storage, read> total: array<f32>;
@group(0) @binding(2) var<storage, read> square: array<f32>;
@group(0) @binding(3) var<storage, read_write> act: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> hidden: array<f32>;
fn pcg(v: u32) -> u32 {
  let state = v * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
fn normal(seed: u32, index: u32) -> f32 {
  let a = pcg((index * 2u) ^ pcg(seed));
  let b = pcg((index * 2u + 1u) ^ pcg(seed + 0x9e3779b9u));
  let u1 = (f32(a) + 1.0) / 4294967297.0;
  let u2 = f32(b) / 4294967296.0;
  return sqrt(-2.0 * log(u1)) * cos(6.283185307179586 * u2);
}
@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= (p.batch - 1u) * p.free) { return; }
  let copy = 1u + id / p.free;
  let k = id % p.free;
  let cell = p.inputs + k;
  let seedIndex = copy - 1u;
  let seed = p.seeds[seedIndex / 4u][seedIndex % 4u];
  var delta = vec4<f32>(0.0);
  for (var j = 0u; j < 12u; j = j + 1u) {
    let mean = total[k * 12u + j] / p.count;
    let sigma = sqrt(max(square[k * 12u + j] / p.count - mean * mean, 0.0));
    let noise = p.amplitude * sigma * normal(seed, k * 12u + j);
    if (j < 8u) {
      hidden[(copy * p.nodes + cell) * 8u + j] = hidden[(copy * p.nodes + cell) * 8u + j] + noise;
    } else {
      delta[j - 8u] = noise;
    }
  }
  act[copy * p.nodes + cell] = act[copy * p.nodes + cell] + delta;
}`;

export async function requestDevice(): Promise<GPUDevice | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return null;
    return await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: Math.min(adapter.limits.maxStorageBufferBindingSize, 256 * 1024 * 1024),
        maxBufferSize: Math.min(adapter.limits.maxBufferSize, 256 * 1024 * 1024),
        maxStorageBuffersPerShaderStage: Math.min(adapter.limits.maxStorageBuffersPerShaderStage, 8),
      },
    });
  } catch {
    return null;
  }
}

export class GpuSimulator implements Simulator {
  readonly kind = "webgpu" as const;
  private batch = 1;
  private parity = 0; // index of the activity buffer holding the latest outputs
  private sigmaCount = 0;
  private readonly n: number;
  private readonly free: number;
  private readonly R: number;
  private readonly bufs: Record<string, GPUBuffer> = {};
  private readonly pipelines: Record<string, GPUComputePipeline> = {};
  private readonly groups: Record<string, GPUBindGroup> = {};

  private constructor(private readonly device: GPUDevice, private readonly rt: Runtime, readonly maxBatch: number) {
    this.n = rt.nodes;
    this.free = rt.nodes - rt.inputCells;
    this.R = rt.recordIndex.length;
  }

  private error: string | null = null;

  static async create(device: GPUDevice, rt: Runtime, maxBatch = 9) {
    const sim = new GpuSimulator(device, rt, maxBatch);
    device.addEventListener("uncapturederror", (event) => {
      sim.error = (event as GPUUncapturedErrorEvent).error.message;
    });
    sim.build();
    await device.queue.onSubmittedWorkDone();
    if (sim.error) throw new Error(`WebGPU setup failed: ${sim.error}`);
    return sim;
  }

  private check() {
    if (this.error) throw new Error(`WebGPU error: ${this.error}`);
  }

  private buffer(name: string, size: number, usage: number, data?: ArrayBufferView) {
    const buffer = this.device.createBuffer({ size: Math.ceil(size / 4) * 4, usage, mappedAtCreation: !!data });
    if (data) {
      new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      buffer.unmap();
    }
    this.bufs[name] = buffer;
    return buffer;
  }

  private build() {
    const { device, rt, n, R, maxBatch } = this;
    const S = GPUBufferUsage.STORAGE;
    const C = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    this.buffer("dims", 32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    this.buffer("perturb", 64, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    this.buffer("rowPtr", rt.rowPtr.byteLength, S, new Uint32Array(rt.rowPtr.buffer));
    this.buffer("col", rt.col.byteLength, S, new Uint32Array(rt.col.buffer));
    this.buffer("weight", rt.weight.byteLength, S, rt.weight);
    this.buffer("model", MODEL_SIZE * 4, S, packModel(rt));
    this.buffer("recIndex", R * 4, S, new Uint32Array(rt.recordIndex.buffer));
    this.buffer("act0", maxBatch * n * OUT * 4, S | C);
    this.buffer("act1", maxBatch * n * OUT * 4, S | C);
    this.buffer("hidden", maxBatch * n * STATE * 4, S | C);
    this.buffer("stimCur", maxBatch * OUT * rt.columns * 4, S | C);
    this.buffer("stimAll", MAX_CHUNK * maxBatch * OUT * rt.columns * 4, S | C);
    this.buffer("recCur", maxBatch * OUT * R * 4, S | C);
    this.buffer("recAll", MAX_CHUNK * maxBatch * OUT * R * 4, S | C);
    this.buffer("staging", MAX_CHUNK * maxBatch * OUT * R * 4, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
    this.buffer("shift", this.free * 12 * 4, S);
    this.buffer("total", this.free * 12 * 4, S);
    this.buffer("square", this.free * 12 * 4, S);
    this.buffer("tmpHidden", n * STATE * 4, C);
    this.buffer("tmpAct", n * OUT * 4, C);
    this.buffer("snapHidden", n * STATE * 4, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
    this.buffer("snapAct", n * OUT * 4, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);

    const pipeline = (name: string, code: string, entryPoint = "main") => {
      this.pipelines[name] = device.createComputePipeline({
        layout: "auto",
        compute: { module: device.createShaderModule({ code }), entryPoint },
      });
    };
    pipeline("clamp", CLAMP);
    pipeline("step", STEP);
    pipeline("record", RECORD);
    pipeline("sigmaInit", SIGMA, "init");
    pipeline("sigmaAdd", SIGMA, "accumulate");
    pipeline("perturb", PERTURB);
    const group = (key: string, pipe: string, buffers: string[]) => {
      this.groups[key] = device.createBindGroup({
        layout: this.pipelines[pipe].getBindGroupLayout(0),
        entries: buffers.map((name, binding) => ({ binding, resource: { buffer: this.bufs[name] } })),
      });
    };
    for (const p of [0, 1]) {
      const input = `act${1 - p}`; // clamped buffer read by the step that writes act${p}
      const output = `act${p}`;
      group(`clamp${p}`, "clamp", ["dims", "stimCur", input]);
      group(`step${p}`, "step", ["dims", "rowPtr", "col", "weight", "model", input, output, "hidden"]);
      group(`record${p}`, "record", ["dims", "recIndex", output, "recCur"]);
      group(`sigmaInit${p}`, "sigmaInit", ["dims", output, "hidden", "shift", "total", "square"]);
      group(`sigmaAdd${p}`, "sigmaAdd", ["dims", output, "hidden", "shift", "total", "square"]);
      group(`perturb${p}`, "perturb", ["perturb", "total", "square", output, "hidden"]);
    }
  }

  private writeDims() {
    const { rt } = this;
    this.device.queue.writeBuffer(
      this.bufs.dims,
      0,
      new Uint32Array([this.batch, this.n, rt.inputCells, rt.columns, this.R, this.free, this.sigmaCount, 0]),
    );
  }

  reset(batch: number) {
    this.batch = batch;
    this.parity = 0;
    const encoder = this.device.createCommandEncoder();
    encoder.clearBuffer(this.bufs.act0);
    encoder.clearBuffer(this.bufs.act1);
    encoder.clearBuffer(this.bufs.hidden);
    this.device.queue.submit([encoder.finish()]);
  }

  async broadcast(batch: number) {
    const encoder = this.device.createCommandEncoder();
    // WebGPU forbids copies within one buffer, so stage copy 0 through scratch buffers.
    const act = this.bufs[`act${this.parity}`];
    encoder.copyBufferToBuffer(act, 0, this.bufs.tmpAct, 0, this.n * OUT * 4);
    encoder.copyBufferToBuffer(this.bufs.hidden, 0, this.bufs.tmpHidden, 0, this.n * STATE * 4);
    for (let b = 1; b < batch; b++) {
      encoder.copyBufferToBuffer(this.bufs.tmpAct, 0, act, b * this.n * OUT * 4, this.n * OUT * 4);
      encoder.copyBufferToBuffer(this.bufs.tmpHidden, 0, this.bufs.hidden, b * this.n * STATE * 4, this.n * STATE * 4);
    }
    this.device.queue.submit([encoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
    this.check();
    this.batch = batch;
  }

  resetSigma() {
    this.sigmaCount = 0;
  }

  private dispatch(encoder: GPUCommandEncoder, pipe: string, group: string, threads: number) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipelines[pipe]);
    pass.setBindGroup(0, this.groups[group]);
    pass.dispatchWorkgroups(Math.ceil(threads / WORKGROUP));
    pass.end();
  }

  async run(stimulus: Float32Array, blocks: number, options?: { sigma?: { from: number; to: number; offset: number } }) {
    const { rt, R } = this;
    const B = this.batch;
    const perBlock = B * OUT * rt.columns;
    const repeat = stimulus.length === perBlock;
    const recorded = new Float32Array(blocks * B * OUT * R);
    this.writeDims();
    if (repeat) this.device.queue.writeBuffer(this.bufs.stimCur, 0, stimulus);
    for (let start = 0; start < blocks; start += MAX_CHUNK) {
      const count = Math.min(MAX_CHUNK, blocks - start);
      if (!repeat) this.device.queue.writeBuffer(this.bufs.stimAll, 0, stimulus, start * perBlock, count * perBlock);
      const encoder = this.device.createCommandEncoder();
      for (let k = 0; k < count; k++) {
        if (!repeat) encoder.copyBufferToBuffer(this.bufs.stimAll, k * perBlock * 4, this.bufs.stimCur, 0, perBlock * 4);
        const p = 1 - this.parity; // write the other buffer
        this.dispatch(encoder, "clamp", `clamp${p}`, B * rt.inputCells);
        this.dispatch(encoder, "step", `step${p}`, B * this.n);
        this.dispatch(encoder, "record", `record${p}`, B * R);
        encoder.copyBufferToBuffer(this.bufs.recCur, 0, this.bufs.recAll, k * B * OUT * R * 4, B * OUT * R * 4);
        this.parity = p;
        const sigma = options?.sigma;
        if (sigma) {
          const index = sigma.offset + start + k;
          if (index >= sigma.from && index < sigma.to) {
            if (this.sigmaCount === 0) this.dispatch(encoder, "sigmaInit", `sigmaInit${p}`, this.free);
            this.dispatch(encoder, "sigmaAdd", `sigmaAdd${p}`, this.free);
            this.sigmaCount++;
          }
        }
      }
      const bytes = count * B * OUT * R * 4;
      encoder.copyBufferToBuffer(this.bufs.recAll, 0, this.bufs.staging, 0, bytes);
      this.device.queue.submit([encoder.finish()]);
      await this.bufs.staging.mapAsync(GPUMapMode.READ, 0, bytes);
      recorded.set(new Float32Array(this.bufs.staging.getMappedRange(0, bytes)), start * B * OUT * R);
      this.bufs.staging.unmap();
      this.check();
    }
    return recorded;
  }

  async perturb(amplitude: number, seeds: number[], _floor: number) {
    const data = new ArrayBuffer(64);
    const u = new Uint32Array(data);
    const f = new Float32Array(data);
    u[0] = this.batch;
    u[1] = this.n;
    u[2] = this.rt.inputCells;
    u[3] = this.free;
    f[4] = this.sigmaCount;
    f[5] = amplitude;
    seeds.forEach((seed, i) => (u[8 + i] = seed));
    this.device.queue.writeBuffer(this.bufs.perturb, 0, data);
    const encoder = this.device.createCommandEncoder();
    this.dispatch(encoder, "perturb", `perturb${this.parity}`, (this.batch - 1) * this.free);
    this.device.queue.submit([encoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  async snapshot() {
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.bufs.hidden, 0, this.bufs.snapHidden, 0, this.n * STATE * 4);
    encoder.copyBufferToBuffer(this.bufs[`act${this.parity}`], 0, this.bufs.snapAct, 0, this.n * OUT * 4);
    this.device.queue.submit([encoder.finish()]);
    await Promise.all([this.bufs.snapHidden.mapAsync(GPUMapMode.READ), this.bufs.snapAct.mapAsync(GPUMapMode.READ)]);
    const hidden = new Float32Array(this.bufs.snapHidden.getMappedRange()).slice();
    const activity = new Float32Array(this.bufs.snapAct.getMappedRange()).slice();
    this.bufs.snapHidden.unmap();
    this.bufs.snapAct.unmap();
    return { hidden, activity };
  }

  async restore(snapshot: { hidden: Float32Array; activity: Float32Array }) {
    this.device.queue.writeBuffer(this.bufs.hidden, 0, snapshot.hidden);
    this.device.queue.writeBuffer(this.bufs[`act${this.parity}`], 0, snapshot.activity);
    this.batch = 1;
  }

  destroy() {
    Object.values(this.bufs).forEach((buffer) => buffer.destroy());
  }
}
