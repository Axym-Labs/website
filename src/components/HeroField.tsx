import { useEffect, useRef } from "react";

// Animated hero background for the white theme: level lines of a smooth,
// slowly drifting field, in the spirit of the earlier dark interference
// animation. Two levels are drawn in Axym purple, the rest in faint ink.
// Drawn on a canvas with marching squares; pauses off screen and in hidden
// tabs, and shows a single still frame under prefers-reduced-motion.

const CELL = 9; // CSS pixels per grid cell
const LEVELS = 15;
const ACCENT = new Set([4, 9]);

interface Bump {
  a: number;
  s: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  w: number;
  p: number;
}

const BUMPS: Bump[] = [
  { a: 1.0, s: 0.2, cx: 0.7, cy: 0.5, rx: 0.08, ry: 0.1, w: 0.05, p: 0.0 },
  { a: -0.8, s: 0.16, cx: 0.86, cy: 0.25, rx: 0.06, ry: 0.08, w: 0.07, p: 1.3 },
  { a: 0.7, s: 0.14, cx: 0.55, cy: 0.8, rx: 0.1, ry: 0.06, w: 0.04, p: 2.1 },
  { a: -0.6, s: 0.22, cx: 0.95, cy: 0.75, rx: 0.07, ry: 0.07, w: 0.06, p: 3.7 },
  { a: 0.5, s: 0.12, cx: 0.45, cy: 0.3, rx: 0.09, ry: 0.05, w: 0.05, p: 4.4 },
];

function field(u: number, v: number, t: number): number {
  let f = 0;
  for (const b of BUMPS) {
    const cx = b.cx + b.rx * Math.sin(b.w * t + b.p);
    const cy = b.cy + b.ry * Math.cos(0.8 * b.w * t + b.p);
    const dx = u - cx;
    const dy = v - cy;
    f += b.a * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s));
  }
  f += 0.12 * Math.sin(3.1 * u + 1.7 * v + 0.11 * t) + 0.08 * Math.sin(-2.3 * u + 4.1 * v - 0.07 * t);
  return f;
}

function draw(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const nx = Math.ceil(width / CELL) + 1;
  const ny = Math.ceil(height / CELL) + 1;
  const scale = Math.max(width, height);
  const values = new Float32Array(nx * ny);
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const value = field((i * CELL) / scale + (1 - width / scale), (j * CELL) / scale, t);
      values[j * nx + i] = value;
      if (value < lo) lo = value;
      if (value > hi) hi = value;
    }
  }

  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  for (let k = 1; k <= LEVELS; k++) {
    const level = lo + ((hi - lo) * k) / (LEVELS + 1);
    const accent = ACCENT.has(k);
    ctx.beginPath();
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = values[j * nx + i] - level;
        const b = values[j * nx + i + 1] - level;
        const c = values[(j + 1) * nx + i + 1] - level;
        const d = values[(j + 1) * nx + i] - level;
        const code = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
        if (code === 0 || code === 15) continue;
        const x = i * CELL;
        const y = j * CELL;
        // Edge crossings: top (a-b), right (b-c), bottom (d-c), left (a-d).
        const top: [number, number] = [x + (CELL * a) / (a - b), y];
        const right: [number, number] = [x + CELL, y + (CELL * b) / (b - c)];
        const bottom: [number, number] = [x + (CELL * d) / (d - c), y + CELL];
        const left: [number, number] = [x, y + (CELL * a) / (a - d)];
        const segment = (p: [number, number], q: [number, number]) => {
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
        };
        switch (code) {
          case 1: case 14: segment(left, bottom); break;
          case 2: case 13: segment(bottom, right); break;
          case 3: case 12: segment(left, right); break;
          case 4: case 11: segment(top, right); break;
          case 6: case 9: segment(top, bottom); break;
          case 7: case 8: segment(left, top); break;
          case 5: segment(left, top); segment(bottom, right); break;
          case 10: segment(top, right); segment(left, bottom); break;
        }
      }
    }
    ctx.strokeStyle = accent ? "rgba(63, 33, 182, 0.62)" : "rgba(29, 26, 43, 0.17)";
    ctx.lineWidth = accent ? 1.25 : 0.8;
    ctx.stroke();
  }
}

const HeroField = ({ className = "" }: { className?: string }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = 0;
    const start = performance.now() - 40_000; // start mid-drift rather than at the initial layout

    const resize = () => {
      const rect = element.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(ctx, width, height, (performance.now() - start) / 1000);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden || still.matches || now - last < 33) return;
      last = now;
      draw(ctx, width, height, (now - start) / 1000);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    resize();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
};

export default HeroField;
