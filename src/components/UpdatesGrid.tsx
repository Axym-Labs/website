import { Link } from "react-router-dom";
import CoverImage from "@/components/CoverImage";
import SectionHeading from "@/components/SectionHeading";
import { formatDate, itemHref, type WorkItem } from "@/data/work-items";

interface UpdatesGridProps {
  items: WorkItem[];
  title?: string;
  sectionId?: string;
}

/** Research updates, experiments, and demos as a grid of dated cards. */
const UpdatesGrid = ({ items, title = "Research updates, experiments and demonstrations", sectionId = "updates" }: UpdatesGridProps) => {
  if (items.length === 0) return null;
  return (
    <section id={sectionId} className="site-section px-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-site">
        <SectionHeading>{title}</SectionHeading>
        <ul className="section-body grid gap-x-8 gap-y-8 sm:grid-cols-2 md:gap-y-12 lg:grid-cols-3 min-[1800px]:gap-x-10">
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
