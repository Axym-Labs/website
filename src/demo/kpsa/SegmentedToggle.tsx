import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
  /** Shorter label below the sm breakpoint. */
  short?: string;
}

interface Props<T extends string> {
  label: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill-shaped segmented control: a radio group with roving focus and a sliding indicator. */
export default function SegmentedToggle<T extends string>({ label, options, value, onChange }: Props<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const active = Math.max(0, options.findIndex((option) => option.value === value));

  useLayoutEffect(() => {
    const measure = () => {
      const button = buttons.current[active];
      if (button) setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    buttons.current.forEach((button) => button && observer.observe(button));
    return () => observer.disconnect();
  }, [active, options.length]);

  // Slide only after the first placement, so the indicator does not fly in on load.
  useLayoutEffect(() => {
    if (indicator && !animate) {
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [indicator, animate]);

  const select = (index: number) => {
    const next = (index + options.length) % options.length;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: active + 1, ArrowDown: active + 1, ArrowLeft: active - 1, ArrowUp: active - 1, Home: 0, End: options.length - 1 };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key]);
    }
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="kpsa-toggle relative inline-flex shrink-0 items-center rounded-full p-1">
      {indicator && (
        <span
          aria-hidden
          className={`kpsa-toggle-indicator absolute inset-y-1 left-0 rounded-full ${animate ? "transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none" : ""}`}
          style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
        />
      )}
      {options.map((option, index) => {
        const checked = index === active;
        return (
          <button
            key={option.value}
            ref={(element) => (buttons.current[index] = element)}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.84rem] font-medium leading-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6] focus-visible:ring-offset-2 sm:px-4 sm:text-[0.9rem] ${
              checked ? "text-white" : "text-[#4b4857] hover:text-[#18161f]"
            }`}
          >
            {option.short ? (
              <>
                <span className="sm:hidden">{option.short}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </>
            ) : (
              option.label
            )}
          </button>
        );
      })}
    </div>
  );
}
