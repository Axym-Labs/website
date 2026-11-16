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

/**
 * A featured entry: a large cover and a text panel with the title, summary,
 * and links. `active` draws one frame around both, for the entry nearest the
 * centre of the viewport (set by WorkList); the border space is always
 * reserved, so framing causes no layout shift.
 */
const WorkCard = ({ item, active = false }: { item: WorkCardItem; active?: boolean }) => {
  const own = resourceLinks({ content: item.content ?? "", links: item.links }).filter((link) => link.kind !== "email");
  const links = item.external_url ? own : [{ kind: "home", label: "Project page", url: itemHref(item) }, ...own];
  const year = item.date ? String(item.date).slice(0, 4) : undefined;

  return (
    <article
      data-active={active || undefined}
      className={`grid gap-6 rounded-[0.9rem] border p-3 transition-colors duration-500 ease-out motion-reduce:transition-none sm:p-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center md:gap-10 md:p-5 lg:gap-12 ${
        active ? "border-foreground/[0.14]" : "border-transparent"
      }`}
    >
      <ItemLink item={item} className="block" tabIndex={-1}>
        <CoverImage src={item.cover_image} fit={item.cover_fit} className="mx-auto aspect-[16/9] w-full" />
      </ItemLink>
      <div className="min-w-0 pb-2 md:pb-0 md:pr-4">
        {(item.eyebrow || year) && (
          <p className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {item.eyebrow && <span>{item.eyebrow}</span>}
            {item.eyebrow && year && <span aria-hidden="true" className="h-px w-5 bg-foreground/25" />}
            {year && <span className="font-medium text-muted-foreground">{year}</span>}
          </p>
        )}
        <h3 className="mt-3 font-serif text-[1.7rem] font-normal leading-[1.12] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
          <ItemLink item={item} className="transition-colors hover:text-primary">{item.title}</ItemLink>
        </h3>
        <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-relaxed text-foreground/75">{item.summary}</p>
        {links.length > 0 && <ResourceLinks links={links} className="mt-6" />}
      </div>
    </article>
  );
};

export default WorkCard;
