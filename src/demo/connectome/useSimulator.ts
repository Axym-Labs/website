import { useEffect, useRef, useState } from "react";

export const ASSET_BASE = "/demo/connectome";

export type WorkerMessage = { type: string; id?: number; [key: string]: unknown };
type Listener = (message: WorkerMessage) => void;

export interface SimulatorHandle {
  ready: boolean;
  kind: "webgpu" | "cpu" | null;
  status: string;
  error: string | null;
  post: (message: Record<string, unknown>, transfer?: Transferable[]) => void;
  subscribe: (listener: Listener) => () => void;
}

/** One shared simulation worker for the page. */
export function useSimulator(): SimulatorHandle {
  const worker = useRef<Worker | null>(null);
  const listeners = useRef(new Set<Listener>());
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<"webgpu" | "cpu" | null>(null);
  const [status, setStatus] = useState("Starting simulator…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const w = new Worker(new URL("./sim.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    const preferCpu = new URLSearchParams(window.location.search).has("cpu");
    w.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === "status") setStatus(String(message.text));
      if (message.type === "ready") {
        setKind(message.kind as "webgpu" | "cpu");
        setReady(true);
        setStatus(message.kind === "webgpu" ? "Running on your GPU (WebGPU)" : "Running on your CPU (WebGPU unavailable; slower)");
      }
      if (message.type === "error" && message.id === undefined) setError(String(message.message));
      listeners.current.forEach((listener) => listener(message));
    };
    w.onerror = (event) => setError(event.message || "Simulator failed to start");
    w.postMessage({ type: "init", base: new URL(ASSET_BASE, window.location.origin).href, preferCpu });
    return () => w.terminate();
  }, []);

  return {
    ready,
    kind,
    status,
    error,
    post: (message, transfer = []) => worker.current?.postMessage(message, transfer),
    subscribe: (listener) => {
      listeners.current.add(listener);
      return () => listeners.current.delete(listener);
    },
  };
}
