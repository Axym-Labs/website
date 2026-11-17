import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { formatDate, getWorkItems, isUpdate } from "@/data/work-items";
import type { WorkItem } from "@/data/work-items";
import CitationBlock from "@/components/CitationBlock";
import Footer from "@/components/Footer";
import MarkdownContent from "@/components/MarkdownContent";
import LatexContent from "@/components/LatexContent";
import Navbar from "@/components/Navbar";
import TableOfContents from "@/components/TableOfContents";
import { updateBibtex } from "@/lib/citation";
import { publicationHeadings } from "@/lib/publication-html";
import { setPageMetadata } from "@/lib/seo";

const Content = ({ item }: { item: WorkItem }) =>
  item.content_format === "html" ? <LatexContent>{item.content}</LatexContent> : <MarkdownContent>{item.content}</MarkdownContent>;

const Breadcrumb = ({ item }: { item: WorkItem }) => (
  <p className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
    <Link to={isUpdate(item) ? "/#updates" : "/work/"} className="text-muted-foreground transition-colors hover:text-primary">
      {isUpdate(item) ? "Research update" : "Work"}
    </Link>
    {item.eyebrow && (
      <>
        <span aria-hidden="true" className="hidden h-px w-5 bg-foreground/20 sm:inline-block" />
        <span className="text-primary">{item.eyebrow}</span>
      </>
    )}
    {item.date && (
      <>
        <span aria-hidden="true" className="hidden h-px w-5 bg-foreground/20 sm:inline-block" />
        <time dateTime={item.date} className="font-medium normal-case tracking-normal text-muted-foreground">
          {formatDate(item.date)}
        </time>
      </>
    )}
  </p>
);

/** Project page: title block, primary figure, abstract in labeled parts, links line, citation. */
const ProjectLayout = ({ item }: { item: WorkItem }) => (
  <article className="publication-canvas project-page w-full px-5 pb-24 pt-14 sm:px-8 sm:pt-20 md:px-12">
    <div className="mx-auto w-full min-w-0 max-w-[60rem]">
      <div className="mx-auto max-w-[46rem]">
        <Breadcrumb item={item} />
      </div>
      <Content item={item} />
    </div>
  </article>
);

/** Research update: article with a side table of contents and a citation block at the end. */
const UpdateLayout = ({ item }: { item: WorkItem }) => {
  const hasCitation = item.content.includes("publication-citation");
  const headings = useMemo(() => {
    const found = publicationHeadings(item.content);
    return hasCitation ? found : [...found, { id: "citation", text: "Citation", level: 2 as const }];
  }, [item.content, hasCitation]);

  return (
    <article className="publication-canvas update-page w-full px-5 pb-24 pt-14 sm:px-8 sm:pt-20 md:px-12">
      <div className="mx-auto grid w-full max-w-[66rem] gap-12 lg:grid-cols-[12.5rem_minmax(0,44rem)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
            <TableOfContents headings={headings} />
          </div>
        </aside>
        <div className="min-w-0">
          <Breadcrumb item={item} />
          <Content item={item} />
          {!hasCitation && <CitationBlock bibtex={updateBibtex(item)} />}
        </div>
      </div>
    </article>
  );
};

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
      path: `/work/${item.slug}/`,
      type: "article",
    });
  }, [item]);

  if (!loaded) return <div className="min-h-screen bg-background" />;
  if (!item) return <Navigate to="/work/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar section={isUpdate(item) ? "updates" : "work"} />
      <main className="pt-[var(--nav-h)]">{isUpdate(item) ? <UpdateLayout item={item} /> : <ProjectLayout item={item} />}</main>
      <Footer />
    </div>
  );
};

export default WorkDetail;
