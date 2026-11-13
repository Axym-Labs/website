import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface WorkItem {
  slug: string;
  title: string;
  summary: string;
  eyebrow?: string;
  external_url?: string;
}

const CardLink = ({ item, children }: { item: WorkItem; children: ReactNode }) =>
  item.external_url ? (
    <a href={item.external_url} className="group block">
      {children}
    </a>
  ) : (
    <Link to={`/work/${item.slug}/`} className="group block">
      {children}
    </Link>
  );

const WorkCard = ({ item }: { item: WorkItem }) => (
  <CardLink item={item}>
    <article className="grid gap-5 py-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:py-14">
      <div className="max-w-4xl">
        {item.eyebrow && (
          <span className="mb-4 inline-flex rounded-full border border-foreground/15 bg-foreground/10 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.16em] text-foreground/60">
            {item.eyebrow}
          </span>
        )}
        <h3 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
          {item.title}
        </h3>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
          {item.summary}
        </p>
      </div>
      <ArrowUpRight className="h-7 w-7 text-foreground/40 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent" />
    </article>
  </CardLink>
);

export default WorkCard;
