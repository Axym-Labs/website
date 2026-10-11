import { dequantize, knnTransform, loadPacked, percentileOf, type ReferenceStats } from "./assets";

export const PRIMARY_DB = "https://data.axym.org/axosim-demo";
export const FALLBACK_DB = "/demo/connectome/fallback-db";
const TRANSFORM_NEIGHBORS = 15;

export interface ImageMeta {
  title?: string;
  category?: string;
  author?: string;
  license?: string;
  license_url?: string;
  page_url?: string;
  source?: string;
}

export interface Database {
  base: string;
  source: "primary" | "fallback";
  ids: string[];
  categories: string[];
  category: Uint8Array;
  stable: Uint8Array;
  dims: number;
  descriptors: Float32Array;
  umap10: Float32Array;
  umap3: Float32Array;
  imageRoot: string;
  sharded: boolean;
}

interface DbMeta {
  ids: string[];
  categories: string[];
  imageRoot: string;
  sharded?: boolean;
}

async function loadFrom(base: string, source: Database["source"]): Promise<Database> {
  const { arrays, meta } = await loadPacked(`${base}/db`, "db");
  const info = meta as DbMeta;
  const quant = arrays.descriptor_quant as Float32Array;
  const dims = quant.length;
  return {
    base,
    source,
    ids: info.ids,
    categories: info.categories,
    category: arrays.category as Uint8Array,
    stable: arrays.stable as Uint8Array,
    dims,
    descriptors: dequantize(arrays.descriptors_q as Int8Array, quant, dims),
    umap10: arrays.umap10 as Float32Array,
    umap3: arrays.umap3 as Float32Array,
    imageRoot: info.imageRoot,
    sharded: info.sharded ?? source === "primary",
  };
}

export async function loadDatabase(): Promise<Database> {
  try {
    return await loadFrom(PRIMARY_DB, "primary");
  } catch (error) {
    console.info("Primary image database unavailable, using bundled subset", error);
    return loadFrom(FALLBACK_DB, "fallback");
  }
}

export function imageUrl(db: Database, id: string, size: "thumb" | "full") {
  const path = db.sharded ? `${size}/${id.slice(0, 2)}/${id}.jpg` : `${size}/${id}.jpg`;
  return `${db.base}/${db.imageRoot}/${path}`;
}

const metaCache = new Map<string, Promise<Record<string, ImageMeta>>>();

export async function imageMeta(db: Database, id: string): Promise<ImageMeta> {
  const key = `${db.base}/${id.slice(0, 2)}`;
  if (!metaCache.has(key)) {
    metaCache.set(
      key,
      fetch(`${db.base}/db/meta/${id.slice(0, 2)}.json`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({})),
    );
  }
  return (await metaCache.get(key)!)[id] ?? {};
}

export interface Retrieval {
  umap10: Float32Array;
  umap3: Float32Array;
  neighbors: { index: number; id: string; distance: number; category: string }[];
}

/** Place a descriptor into the fitted UMAPs (k-NN) and return its 5 nearest images in 10D. */
export function retrieve(db: Database, descriptor: Float32Array, count = 5): Retrieval {
  const placed10 = knnTransform(descriptor, db.descriptors, db.umap10, db.dims, 10, TRANSFORM_NEIGHBORS);
  const placed3 = knnTransform(descriptor, db.descriptors, db.umap3, db.dims, 3, TRANSFORM_NEIGHBORS);
  const n = db.ids.length;
  const best: { index: number; distance: number }[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let d = 0; d < 10; d++) {
      const diff = placed10.coords[d] - db.umap10[i * 10 + d];
      sum += diff * diff;
    }
    if (best.length < count || sum < best[best.length - 1].distance) {
      best.push({ index: i, distance: sum });
      best.sort((a, b) => a.distance - b.distance);
      if (best.length > count) best.pop();
    }
  }
  return {
    umap10: placed10.coords,
    umap3: placed3.coords,
    neighbors: best.map(({ index, distance }) => ({
      index,
      id: db.ids[index],
      distance: Math.sqrt(distance),
      category: db.categories[db.category[index]],
    })),
  };
}

export async function loadReferenceStats(base: string): Promise<ReferenceStats> {
  const response = await fetch(`${base}/reference-stats.json`);
  if (!response.ok) throw new Error("Reference statistics unavailable");
  return response.json();
}

export const percentile = (stats: ReferenceStats, key: string, value: number) => percentileOf(stats.quantiles[key], value);
