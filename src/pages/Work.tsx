import Navbar from "@/components/Navbar";
import WorkList from "@/components/WorkList";
import UpdatesGrid from "@/components/UpdatesGrid";
import Footer from "@/components/Footer";
import type { WorkItem } from "@/data/work-items";
import { getWorkItems, updateEntries, workEntries } from "@/data/work-items";
import { useEffect, useState } from "react";
import { setPageMetadata } from "@/lib/seo";

const Work = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    getWorkItems().then(setWorkItems);
    setPageMetadata({
      title: "Work | Axym Labs",
      description: "Papers, project pages, articles, and code from Axym Labs.",
      path: "/work/",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-5 pt-32 sm:px-6 md:pt-40 lg:px-8">
        <header className="mx-auto max-w-6xl">
          <h1 className="text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground md:text-[2.75rem]">Work</h1>
          <p className="mt-5 max-w-[40rem] text-[1.15rem] leading-relaxed text-foreground/75">
            Papers and software, each with a project page that holds its main figure, summary, links, and citation.
          </p>
        </header>
      </div>
      <div>
        <WorkList items={workEntries(workItems)} title="Papers and software" />
        <UpdatesGrid items={updateEntries(workItems)} />
      </div>
      <Footer />
    </div>
  );
};

export default Work;
