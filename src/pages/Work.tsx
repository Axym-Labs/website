import Navbar from "@/components/Navbar";
import WorkList from "@/components/WorkList";
import Footer from "@/components/Footer";
import type { WorkItem } from "@/data/work-items";
import { getWorkItems } from "@/data/work-items";
import { useEffect, useState } from "react";
import { setPageMetadata } from "@/lib/seo";

const Work = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    getWorkItems().then(setWorkItems);
    setPageMetadata({
      title: "Work | Axym Labs",
      description: "Papers, project pages, articles, and code from Axym Labs.",
      path: "/work",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <WorkList items={workItems} title="Work" />
      </div>
      <Footer />
    </div>
  );
};

export default Work;
