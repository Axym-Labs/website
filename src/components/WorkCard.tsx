import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CoverImage from "@/components/CoverImage";
import ResourceLinks from "@/components/ResourceLinks";
import { itemHref, resourceLinks, type WorkItem } from "@/data/work-items";

type WorkCardItem = Pick<WorkItem, "slug" | "title" | "summary"> &
  Partial<Pick<WorkItem, "eyebrow" | "external_url" | "cover_image" | "cover_fit" | "date" | "content" | "links">>;

const ItemLink = ({ item, className, children, tabIndex }: { item: WorkCardItem; className?: string; children: ReactNode; tabIndex?: number }) =>
  item.external_url ? (
    <a href={item.external_url} className={className} tabIndex={tabIndex}>
      {children}
    </a>
  ) : (
    <Link to={itemHref(item)} className={className} tabIndex={tabIndex}>
      {children}
    </Link>
  );

/** A featured entry: visual, title, summary, and the item's links. */
const WorkCard = ({ item }: { item: WorkCardItem }) => {
  const links = resourceLinks({ content: item.content ?? "", links: item.links }).filter((link) => link.kind !== "email");
  const year = item.date ? String(item.date).slice(0, 4) : undefined;

  return (
    <article className="group grid gap-7 py-12 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-center md:gap-12 md:py-14 lg:gap-16">
      <ItemLink item={item} className="block" tabIndex={-1}>
        <CoverImage src={item.cover_image} fit={item.cover_fit} className="aspect-[16/9] w-full" />
      </ItemLink>
      <div className="min-w-0">
        {(item.eyebrow || year) && (
          <p className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {item.eyebrow && <span>{item.eyebrow}</span>}
            {item.eyebrow && year && <span aria-hidden="true" className="h-px w-5 bg-primary/30" />}
            {year && <span className="font-medium text-muted-foreground">{year}</span>}
          </p>
        )}
        <h3 className="mt-4 font-serif text-[1.85rem] font-normal leading-[1.1] tracking-[-0.01em] text-foreground md:text-[2.15rem]">
          <ItemLink item={item} className="decoration-primary/40 decoration-1 underline-offset-[0.12em] transition-colors hover:text-primary">
            {item.title}
          </ItemLink>
        </h3>
        <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-relaxed text-muted-foreground">{item.summary}</p>
        {links.length > 0 && <ResourceLinks links={links} className="mt-6" />}
      </div>
    </article>
  );
};

export default WorkCard;
