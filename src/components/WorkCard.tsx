import { forwardRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import SheetFrame from "@/components/SheetFrame";
import ResourceLinks from "@/components/ResourceLinks";
import { itemHref, resourceLinks, type WorkItem } from "@/data/work-items";

type WorkCardItem = Pick<WorkItem, "slug" | "title" | "summary"> &
  Partial<Pick<WorkItem, "eyebrow" | "external_url" | "cover_image" | "cover_fit" | "date" | "content" | "links" | "category" | "kind">>;

interface ItemLinkProps {
  item: WorkCardItem;
  className?: string;
  children: ReactNode;
  tabIndex?: number;
}

const ItemLink = forwardRef<HTMLAnchorElement, ItemLinkProps>(({ item, className, children, tabIndex }, ref) =>
  item.external_url ? (
    <a ref={ref} href={item.external_url} className={className} tabIndex={tabIndex}>
      {children}
    </a>
  ) : (
    <Link ref={ref} to={itemHref(item)} className={className} tabIndex={tabIndex}>
      {children}
    </Link>
  ),
);
ItemLink.displayName = "ItemLink";

const sheetKind = (item: WorkCardItem) =>
  (item.kind ?? (item.category === "research" ? "paper" : item.category ?? "")).toUpperCase();

/**
 * A featured entry: a large cover (with its paper backdrop) and a text panel
 * with the title, summary, and links. For the entry nearest the viewport
 * centre (`active`, set by WorkList) a drawing-sheet frame fades in around
 * the whole entry; otherwise there is no frame. Its space is always reserved
 * as padding, so nothing moves.
 */
const WorkCard = ({ item, active = false }: { item: WorkCardItem; active?: boolean }) => {
  const own = resourceLinks({ content: item.content ?? "", links: item.links }).filter((link) => link.kind !== "email");
  const links = item.external_url ? own : [{ kind: "home", label: "Project page", url: itemHref(item) }, ...own];
  const year = item.date ? String(item.date).slice(0, 4) : undefined;
  const cells = [sheetKind(item), item.date ? String(item.date).slice(0, 7) : ""].filter(Boolean);

  return (
    <article
      data-active={active || undefined}
      className="work-entry relative grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center"
    >
      <SheetFrame cells={cells} shown={active} />
      <ItemLink item={item} className="relative z-10 block" tabIndex={-1}>
        {/* Covers are transparent, with a paper backdrop shaped to the figure. */}
        <img src={item.cover_image} alt="" width={1600} height={900} loading="lazy" decoding="async" className="block aspect-[16/9] h-auto w-full" />
      </ItemLink>
      <div className="relative z-10 min-w-0 pb-8 md:pr-2">
        {(item.eyebrow || year) && (
          <p className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {item.eyebrow && <span>{item.eyebrow}</span>}
            {item.eyebrow && year && <span aria-hidden="true" className="h-px w-7 shrink-0 bg-foreground/50" />}
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
