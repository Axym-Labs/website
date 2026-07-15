import { Navigate, useParams } from "react-router-dom";
import { getWorkItems } from "@/data/work-items";
import type { WorkItem } from "@/data/work-items";
import Footer from "@/components/Footer";
import MarkdownContent from "@/components/MarkdownContent";
import LatexContent from "@/components/LatexContent";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { setPageMetadata } from "@/lib/seo";

const WorkDetail = () => {
  const { slug } = useParams();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getWorkItems().then((items) => {
      setWorkItems(items);
      setLoaded(true);
    });
  }, []);

  const item = workItems.find((work) => work.slug === slug);

  useEffect(() => {
    if (!item) return;
    setPageMetadata({
      title: `${item.title} | Axym Labs`,
      description: item.summary,
      path: `/work/${item.slug}`,
      type: "article",
    });
  }, [item]);

  if (!loaded) return <div className="min-h-screen bg-background" />;
  if (!item) return <Navigate to="/work" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <article className="publication-canvas w-full bg-canvas text-canvas-foreground px-5 py-16 sm:px-8 sm:py-20 md:px-12 lg:px-16">
          <div className="mx-auto w-full min-w-0 max-w-[46rem] text-[1.06rem] sm:text-[1.1rem]">
            {item.content_format === "html" ? (
              <LatexContent>{item.content}</LatexContent>
            ) : (
              <MarkdownContent>{item.content}</MarkdownContent>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default WorkDetail;
