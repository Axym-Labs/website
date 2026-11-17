import { useCallback, useEffect, useRef } from "react";

/** After a user picks a feature, bring its card into view if it is entirely below the fold. */
export function useRevealCard() {
  const cardRef = useRef<HTMLElement>(null);
  const pending = useRef(false);

  useEffect(() => {
    if (!pending.current || !cardRef.current) return;
    pending.current = false;
    const { top } = cardRef.current.getBoundingClientRect();
    if (top > window.innerHeight - 48) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cardRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }
  });

  const reveal = useCallback(() => {
    pending.current = true;
  }, []);

  return { cardRef, reveal };
}
