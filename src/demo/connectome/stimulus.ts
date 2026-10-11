import { SAMPLE_SECONDS, type Runtime } from "./runtime";

// Port of demo_reference.py stimulus functions (crop_box, area_weights,
// frame_from_rgb, lattice_sample, normalize_samples, video_samples).

export function cropBox(width: number, height: number) {
  const cropWidth = Math.min(width, Math.round((height * 16) / 9));
  const cropHeight = Math.min(height, Math.round((width * 9) / 16));
  return {
    x0: Math.floor((width - cropWidth) / 2),
    y0: Math.floor((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

/** Sparse box-filter weights: for each output, the [first, weights] of its inputs. */
function areaWeights(nIn: number, nOut: number) {
  const scale = nIn / nOut;
  const rows: { first: number; weights: number[] }[] = [];
  for (let out = 0; out < nOut; out++) {
    const start = out * scale;
    const stop = (out + 1) * scale;
    const first = Math.floor(start);
    const last = Math.ceil(stop);
    const weights: number[] = [];
    let total = 0;
    for (let source = first; source < Math.min(last, nIn); source++) {
      const overlap = Math.min(stop, source + 1) - Math.max(start, source);
      const w = overlap > 0 ? overlap : 0;
      weights.push(w);
      total += w;
    }
    rows.push({ first, weights: weights.map((w) => w / total) });
  }
  return rows;
}

/** Luminance frame (height x width, row-major Float64Array) from RGBA pixels. */
export function frameFromRgba(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  outWidth: number,
  outHeight: number,
) {
  const crop = cropBox(width, height);
  const wx = areaWeights(crop.width, outWidth);
  const wy = areaWeights(crop.height, outHeight);
  // Horizontal pass on every cropped row.
  const horizontal = new Float64Array(crop.height * outWidth);
  const row = new Float64Array(crop.width);
  for (let y = 0; y < crop.height; y++) {
    const offset = ((crop.y0 + y) * width + crop.x0) * 4;
    for (let x = 0; x < crop.width; x++) {
      const p = offset + x * 4;
      row[x] = 0.2126 * (data[p] / 255) + 0.7152 * (data[p + 1] / 255) + 0.0722 * (data[p + 2] / 255);
    }
    for (let ox = 0; ox < outWidth; ox++) {
      const { first, weights } = wx[ox];
      let value = 0;
      for (let i = 0; i < weights.length; i++) value += weights[i] * row[first + i];
      horizontal[y * outWidth + ox] = value;
    }
  }
  const frame = new Float64Array(outHeight * outWidth);
  for (let oy = 0; oy < outHeight; oy++) {
    const { first, weights } = wy[oy];
    for (let ox = 0; ox < outWidth; ox++) {
      let value = 0;
      for (let i = 0; i < weights.length; i++) value += weights[i] * horizontal[(first + i) * outWidth + ox];
      frame[oy * outWidth + ox] = value;
    }
  }
  return frame;
}

export function latticeSample(frame: Float64Array, width: number, height: number, rt: Runtime) {
  const scale = rt.stimulus.lattice_scale;
  const out = new Float64Array(rt.columns);
  for (let i = 0; i < rt.columns; i++) {
    const px = (0.5 + scale * rt.latticeX[i]) * (width - 1);
    const py = (0.5 + scale * rt.latticeY[i]) * (height - 1);
    const x0 = Math.min(Math.max(Math.floor(px), 0), width - 2);
    const y0 = Math.min(Math.max(Math.floor(py), 0), height - 2);
    const fx = px - x0;
    const fy = py - y0;
    const top = frame[y0 * width + x0] * (1 - fx) + frame[y0 * width + x0 + 1] * fx;
    const bottom = frame[(y0 + 1) * width + x0] * (1 - fx) + frame[(y0 + 1) * width + x0 + 1] * fx;
    out[i] = top * (1 - fy) + bottom * fy;
  }
  return out;
}

export function normalizeSamples(samples: ArrayLike<number>, rt: Runtime) {
  const { mean, standard_deviation: std, clip } = rt.stimulus.normalization;
  const n = samples.length;
  let centre = 0;
  for (let i = 0; i < n; i++) centre += samples[i];
  centre /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (samples[i] - centre) ** 2;
  const spread = Math.max(Math.sqrt(variance / n), 1e-6);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.min(Math.max(((samples[i] - centre) / spread) * std + mean, clip[0]), clip[1]);
  }
  return out;
}

/** Normalized retinal samples of a still image given its RGBA pixels. */
export function imageSamples(data: Uint8ClampedArray, width: number, height: number, rt: Runtime) {
  const { frame_width: fw, frame_height: fh } = rt.stimulus;
  const frame = frameFromRgba(data, width, height, fw, fh);
  return normalizeSamples(latticeSample(frame, fw, fh, rt), rt);
}

/** Block stimulus (blocks, 1, 4, 721) for a video given raw per-frame lattice samples. */
export function videoBlocks(frames: Float32Array, frameCount: number, fps: number, firstSample: number, samples: number, rt: Runtime) {
  const columns = rt.columns;
  const out = new Float32Array(samples * columns);
  const raw = new Float64Array(columns);
  for (let k = 0; k < samples; k++) {
    const position = (firstSample + k) * SAMPLE_SECONDS * fps;
    const floor = Math.floor(position);
    const lower = Math.min(floor, frameCount - 1);
    const upper = Math.min(lower + 1, frameCount - 1);
    const alpha = position - floor;
    for (let i = 0; i < columns; i++) {
      raw[i] = frames[lower * columns + i] * (1 - alpha) + frames[upper * columns + i] * alpha;
    }
    out.set(normalizeSamples(raw, rt), k * columns);
  }
  return out;
}
