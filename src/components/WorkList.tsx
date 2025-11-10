import WorkCard from "./WorkCard";

interface WorkItem {
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover_image?: string;
  cover_animated?: boolean;
  cover_poster?: string;
  use_cover_as_card_bg?: boolean;
  main_points?: [string, string][];
  date: string;
  rank?: number;
  draft?: boolean;
}

interface WorkListProps {
  items: WorkItem[];
  category: string;
  title: string;
  sectionId: string;
}

const WorkList = ({ items, category, title, sectionId }: WorkListProps) => {
  // Filter items by category and draft status
  const filteredItems = items.filter(
    (item) => item.category === category && !item.draft
  );

  // Sort: ranked items first (ascending rank), then by date (descending)
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank;
    }
    if (a.rank !== undefined) return -1;
    if (b.rank !== undefined) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (sortedItems.length === 0) return null;

  return (
    <section id={sectionId} className="py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-24">
          {title}
        </h2>
        
        <div className="space-y-12">
          {sortedItems.map((item) => (
            <WorkCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkList;
