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

const hasTitledCover = (src?: string) => Boolean(src?.includes("/work/covers/"));

/**
 * A featured entry: the cover (which carries the title) and a text panel with
 * the summary and links. The panel's frame fades in on hover.
 */
const WorkCard = ({ item }: { item: WorkCardItem }) => {
  const own = resourceLinks({ content: item.content ?? "", links: item.links }).filter((link) => link.kind !== "email");
  const links = item.external_url ? own : [{ kind: "home", label: "Project page", url: itemHref(item) }, ...own];
  const year = item.date ? String(item.date).slice(0, 4) : undefined;
  const titled = hasTitledCover(item.cover_image);

  return (
    <article className="group grid gap-6 py-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-center md:gap-8 md:py-12 lg:gap-10">
      <ItemLink item={item} className="block focus-visible:outline-none" tabIndex={titled ? undefined : -1}>
        <CoverImage src={item.cover_image} fit={item.cover_fit} alt={titled ? item.title : ""} className="aspect-[16/9] w-full" />
      </ItemLink>
      <div className="min-w-0 rounded-[0.7rem] border border-transparent px-0 py-1 transition-colors duration-300 ease-out group-hover:border-foreground/[0.12] group-focus-within:border-foreground/[0.12] md:px-7 md:py-7 motion-reduce:transition-none">
        <h3 className={titled ? "sr-only" : "mb-4 text-[1.6rem] font-semibold leading-tight tracking-[-0.015em] text-foreground"}>
          <ItemLink item={item} className="transition-colors hover:text-primary">{item.title}</ItemLink>
        </h3>
        {(item.eyebrow || year) && (
          <p className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {item.eyebrow && <span>{item.eyebrow}</span>}
            {item.eyebrow && year && <span aria-hidden="true" className="h-px w-5 bg-primary/30" />}
            {year && <span className="font-medium text-muted-foreground">{year}</span>}
          </p>
        )}
        <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-relaxed text-foreground/75">{item.summary}</p>
        {links.length > 0 && <ResourceLinks links={links} className="mt-6" />}
      </div>
    </article>
  );
};

export default WorkCard;
