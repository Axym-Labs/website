import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import WorkCard from "./WorkCard";
import type { WorkItem } from "@/data/work-items";

interface WorkListProps {
  items: WorkItem[];
  title: string;
  intro?: string;
  sectionId?: string;
  /** Link to the full list, shown next to the heading. */
  moreHref?: string;
}

/** Featured work entries; callers pass the items already filtered and ordered. */
const WorkList = ({ items, title, intro, sectionId = "work", moreHref }: WorkListProps) => (
  <section id={sectionId} className="scroll-mt-16 px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-6 border-b border-foreground/15 pb-6">
        <div>
          <h2 className="font-serif text-[2.6rem] font-normal leading-none tracking-[-0.015em] text-foreground md:text-[3.25rem]">{title}</h2>
          {intro && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p>}
        </div>
        {moreHref && (
          <Link to={moreHref} className="group/more inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            All work
            <ArrowRight className="h-4 w-4 transition-transform group-hover/more:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-foreground/10">
        {items.map((item) => <WorkCard key={item.slug} item={item} />)}
      </div>
    </div>
  </section>
);

export default WorkList;
