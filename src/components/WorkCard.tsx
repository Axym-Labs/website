import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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

type Box = { top: number; left: number; width: number; height: number };

/**
 * Frame boxes of an entry: around the cover (padded by the reserved sheet
 * space) and around the whole entry. Measured on layout and on resize.
 */
function useSheetBoxes(entry: React.RefObject<HTMLElement>, cover: React.RefObject<HTMLElement>) {
  const [boxes, setBoxes] = useState<{ cover: Box; entry: Box } | null>(null);
  useLayoutEffect(() => {
    const outer = entry.current;
    const inner = cover.current;
    if (!outer || !inner) return;
    const measure = () => {
      const reserve = parseFloat(getComputedStyle(outer).paddingLeft) || 0;
      const o = outer.getBoundingClientRect();
      const c = inner.getBoundingClientRect();
      setBoxes({
        cover: { top: c.top - o.top - reserve, left: c.left - o.left - reserve, width: c.width + 2 * reserve, height: c.height + 2 * reserve },
        entry: { top: 0, left: 0, width: o.width, height: o.height },
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [entry, cover]);
  return boxes;
}

/**
 * A featured entry: a large cover and a text panel with the title, summary,
 * and links, on a drawing sheet. The sheet wraps the cover and, for the entry
 * nearest the viewport centre (`active`, set by WorkList), grows to enclose
 * the text too. The sheet's space is always reserved as padding, so nothing
 * moves.
 */
const WorkCard = ({ item, active = false }: { item: WorkCardItem; active?: boolean }) => {
  const own = resourceLinks({ content: item.content ?? "", links: item.links }).filter((link) => link.kind !== "email");
  const links = item.external_url ? own : [{ kind: "home", label: "Project page", url: itemHref(item) }, ...own];
  const year = item.date ? String(item.date).slice(0, 4) : undefined;
  const entry = useRef<HTMLElement>(null);
  const cover = useRef<HTMLAnchorElement>(null);
  const boxes = useSheetBoxes(entry, cover);
  const cells = [sheetKind(item), item.date ? String(item.date).slice(0, 7) : ""].filter(Boolean);

  return (
    <article
      ref={entry}
      data-active={active || undefined}
      className="work-entry relative grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center md:gap-12 lg:gap-14"
    >
      {boxes && <SheetFrame box={active ? boxes.entry : boxes.cover} cells={cells} />}
      <ItemLink item={item} className="relative z-10 block" tabIndex={-1} ref={cover}>
        <div className="aspect-[16/9] w-full overflow-hidden rounded-[6px]">
          {/* The cover's own paper edge is cropped; the sheet supplies the edge. */}
          <img src={item.cover_image} alt="" width={1600} height={900} loading="lazy" decoding="async" className="block h-full w-full scale-[1.04] object-cover" />
        </div>
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
