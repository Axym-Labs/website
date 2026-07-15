import WorkCard from "./WorkCard";
import type { WorkItem } from "@/data/work-items";

interface WorkListProps {
  items: WorkItem[];
  title: string;
  sectionId?: string;
}

const WorkList = ({ items, title, sectionId = "work" }: WorkListProps) => {
  const sortedItems = items
    .filter((item) => !item.draft)
    .sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
      if (a.rank !== undefined) return -1;
      if (b.rank !== undefined) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <section id={sectionId} className="px-6 py-28 lg:px-8 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-foreground md:text-5xl">
          {title}
        </h2>
        <div className="mt-14 divide-y divide-foreground/15">
          {sortedItems.map((item) => <WorkCard key={item.slug} item={item} />)}
        </div>
      </div>
    </section>
  );
};

export default WorkList;
