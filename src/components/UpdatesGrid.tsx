import { Link } from "react-router-dom";
import CoverImage from "@/components/CoverImage";
import SectionHeading from "@/components/SectionHeading";
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
    <section id={sectionId} className="scroll-mt-20 px-5 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading>{title}</SectionHeading>
        <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.slug}>
              <Link to={itemHref(item)} className="group block">
                <CoverImage src={item.cover_image} fit={item.cover_fit} className="aspect-[16/9] w-full" />
                <p className="mt-4 text-[0.85rem] text-muted-foreground">
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </p>
                <h3 className="mt-1.5 text-[1.12rem] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
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
