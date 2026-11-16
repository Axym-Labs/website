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

/** Featured work entries; callers pass the items already filtered and ordered. */
const WorkList = ({ items, title, intro, sectionId = "work", moreHref }: WorkListProps) => (
  <section id={sectionId} className="scroll-mt-20 px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
    <div className="mx-auto max-w-6xl">
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
      <div className="divide-y divide-foreground/10">
        {items.map((item) => <WorkCard key={item.slug} item={item} />)}
      </div>
    </div>
  </section>
);

export default WorkList;
