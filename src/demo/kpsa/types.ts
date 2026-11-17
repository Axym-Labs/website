// Static data contract of the KPSA demo (public/demo/kpsa/), see
// kpsa-paper-internal/05_adoption_demo/artifacts/demo_data_schema.md.

export interface Budget {
  pct: number;
  k: number;
}

export interface Credit {
  author: string;
  license: string;
  url: string;
}

export interface VisionImage {
  id: string;
  group: string;
  thumb: string;
  src: string;
  credit?: Credit;
}

export interface VisionIndex {
  model: string;
  queryModel: string;
  layers: number;
  featuresPerLayer: number;
  atlasSources: number;
  budgets: Budget[];
  /** Activation multipliers of the set interventions, e.g. [0.5, 0, 3, 10]. */
  factors: number[];
  groups: string[];
  images: VisionImage[];
}

export interface VisionFeature {
  id: string;
  l: number;
  f: number;
  s: number;
  map: number[];
  deact?: { p: number };
}

export interface VisionQuery {
  id: string;
  prediction: { label: string; p: number; top5: [string, number][] };
  features: VisionFeature[];
  /** Probability of the predicted class after scaling the top-k set, [budget][factor]. */
  sets: number[][];
  layerMass: number[];
  /** Atlas sources with the largest readout weight phi(z*) . phi(z_i), weights normalized over all sources. */
  neighbors: { thumb: string; label: string; w: number }[];
  /** Number of sources that together hold half of the readout weight. */
  neighborsHalf: number;
}

export interface VisionFeatureCard {
  id: string;
  top: { thumb: string; label: string; act: number; map: number[] }[];
}

export interface Passage {
  id: string;
  title: string;
  url: string;
  text: string;
}

export interface LanguageIndex {
  model: string;
  queryModel: string;
  layers: number;
  featuresPerLayer: number;
  atlasSources: number;
  budgets: Budget[];
  factors: number[];
  passages: Passage[];
  /** Features that hold a large share of every input's sensitivity and are left out of the ranking. */
  excluded?: { count: number; share: number };
}

export interface LanguageTarget {
  p: number;
  top: [string, number][];
  features: [number, number, number][];
  deact: number[];
  /** Probability of the target token after scaling the top-k set, [budget][factor]. */
  sets: number[][];
  layerMass: number[];
  neighbors: { text: string; target: string; w: number }[];
  neighborsHalf: number;
}

export interface PassageData {
  id: string;
  tokens: string[];
  targets: Record<string, LanguageTarget>;
}

export interface LanguageFeatureCard {
  id: string;
  top: { tokens: string[]; acts: number[]; max: number; title: string; url: string }[];
}

/** A ranked feature in the form both modalities share. */
export interface RankedFeature {
  id: string;
  l: number;
  f: number;
  s: number;
  rank: number;
  /** Predicted-token or predicted-class probability after zeroing this feature alone, where precomputed. */
  deact?: number;
  map?: number[];
}

export type App = "attribution" | "circuit";
export type Modality = "language" | "vision";
