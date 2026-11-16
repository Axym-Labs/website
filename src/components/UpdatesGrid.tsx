import { Link } from "react-router-dom";
import CoverImage from "@/components/CoverImage";
import { formatDate, itemHref, type WorkItem } from "@/data/work-items";

interface UpdatesGridProps {
  items: WorkItem[];
  title?: string;
  sectionId?: string;
}

/** Research updates and articles as a grid of dated cards. */
const UpdatesGrid = ({ items, title = "Research updates", sectionId = "updates" }: UpdatesGridProps) => {
  if (items.length === 0) return null;
  return (
    <section id={sectionId} className="scroll-mt-16 px-5 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-foreground/15 pb-6">
          <h2 className="font-serif text-[2.6rem] font-normal leading-none tracking-[-0.015em] text-foreground md:text-[3.25rem]">{title}</h2>
        </div>
        <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.slug}>
              <Link to={itemHref(item)} className="group block">
                <CoverImage src={item.cover_image} fit={item.cover_fit} className="aspect-[16/9] w-full" />
                <p className="mt-5 text-sm text-muted-foreground">
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </p>
                <h3 className="mt-2 font-serif text-[1.55rem] font-normal leading-[1.15] text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default UpdatesGrid;
