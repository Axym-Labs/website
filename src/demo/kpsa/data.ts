import { useEffect, useState } from "react";

export const KPSA_BASE = "/demo/kpsa";

/** URL of a file in the data directory; data files store paths relative to it. */
export const assetUrl = (path: string) => (/^(https?:)?\/\//.test(path) || path.startsWith("/") ? path : `${KPSA_BASE}/${path}`);

const cache = new Map<string, Promise<unknown>>();

/** Fetch a JSON file once per page view; failed requests are dropped from the cache so they can be retried. */
export function loadJson<T>(path: string): Promise<T> {
  const url = assetUrl(path);
  let pending = cache.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    });
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Load a JSON file for the current path; null skips loading. */
export function useJson<T>(path: string | null): Loaded<T> {
  const [state, setState] = useState<{ path: string | null; data: T | null; error: string | null }>({ path: null, data: null, error: null });

  useEffect(() => {
    if (!path) return;
    let live = true;
    loadJson<T>(path).then(
      (data) => live && setState({ path, data, error: null }),
      (error: Error) => live && setState({ path, data: null, error: error.message }),
    );
    return () => {
      live = false;
    };
  }, [path]);

  if (!path) return { data: null, error: null, loading: false };
  const current = state.path === path;
  return { data: current ? state.data : null, error: current ? state.error : null, loading: !current };
}
