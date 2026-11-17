import type { ReactNode } from "react";

export const BRAND = "#3f21b6";

/** A light plate on the canvas, the demo's basic container. */
export function Panel({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={`kpsa-panel min-w-0 ${className}`}>
      {children}
    </section>
  );
}

/** Small uppercase heading inside a panel. */
export function PanelHeading({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex min-h-6 items-baseline justify-between gap-3">
      <h3 id={id} className="kpsa-eyebrow">
        {children}
      </h3>
      {aside && <div className="text-xs text-[#6b6875]">{aside}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`kpsa-skeleton rounded-md ${className}`} />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="py-3 text-sm text-[#8a3b3b]">
      {children}
    </p>
  );
}

/** Horizontal bar for a value in 0..1, relative to `max`. */
export function Bar({ value, max = 1, tone = "brand", className = "" }: { value: number; max?: number; tone?: "brand" | "muted" | "soft"; className?: string }) {
  const width = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  const color = tone === "brand" ? "bg-[#3f21b6]" : tone === "soft" ? "bg-[#9c8ee0]" : "bg-[#b9b5c4]";
  return (
    <div aria-hidden className={`h-1.5 overflow-hidden rounded-full bg-[#18161f]/[0.07] ${className}`}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-300`} style={{ width: `${width}%` }} />
    </div>
  );
}

/** Small pill buttons for a budget or similar short choice. */
export function PillChoice<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1.5">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6] focus-visible:ring-offset-1 ${
              checked ? "border-[#3f21b6] bg-[#3f21b6] text-white" : "border-[#18161f]/15 bg-white text-[#4b4857] hover:border-[#3f21b6]/50 hover:text-[#3f21b6]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
