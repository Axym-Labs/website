import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import WorkCard from "./WorkCard";
import SectionHeading from "./SectionHeading";
import type { WorkItem } from "@/data/work-items";

interface WorkListProps {
  items: WorkItem[];
  title: string;
  intro?: string;
  sectionId?: string;
  /** Link to the full list, shown next to the heading. */
  moreHref?: string;
}

/**
 * Index of the entry nearest the viewport centre, among entries that cross
 * the middle band of the viewport; undefined when none does (for example
 * while the hero fills the screen).
 */
function useCenteredIndex(container: React.RefObject<HTMLElement>, count: number): number | undefined {
  const [index, setIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = container.current;
    if (!element || count === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let best: number | undefined;
      let bestDistance = Infinity;
      Array.from(element.querySelectorAll<HTMLElement>(":scope > article")).forEach((article, i) => {
        const rect = article.getBoundingClientRect();
        if (rect.bottom < window.innerHeight * 0.35 || rect.top > window.innerHeight * 0.65) return;
        const distance = Math.abs(rect.top + rect.height / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setIndex(best);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [container, count]);

  return index;
}

/** Featured work entries; callers pass the items already filtered and ordered. */
const WorkList = ({ items, title, intro, sectionId = "work", moreHref }: WorkListProps) => {
  const list = useRef<HTMLDivElement>(null);
  const centered = useCenteredIndex(list, items.length);

  return (
  <section id={sectionId} className="site-section px-5 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-site">
      <SectionHeading
        aside={
          moreHref && (
            <Link to={moreHref} className="group/more inline-flex shrink-0 items-center gap-1.5 text-sm text-foreground/70 transition-colors hover:text-primary">
              All work
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )
        }
      >
        {title}
      </SectionHeading>
      {intro && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p>}
      <div ref={list} className="section-body space-y-8 lg:space-y-10 min-[1800px]:space-y-12">
        {items.map((item, i) => <WorkCard key={item.slug} item={item} active={i === centered} />)}
      </div>
    </div>
  </section>
  );
};

export default WorkList;
