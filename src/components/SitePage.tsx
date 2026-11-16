import { useEffect, type ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { setPageMetadata } from "@/lib/seo";

interface SitePageProps {
  title: string;
  /** Page title shown in the browser tab and search results. */
  metaTitle: string;
  description: string;
  path: string;
  lead?: ReactNode;
  children: ReactNode;
}

/** Shell of the site's own text pages (About, Contact, Legal). */
const SitePage = ({ title, metaTitle, description, path, lead, children }: SitePageProps) => {
  useEffect(() => {
    setPageMetadata({ title: metaTitle, description, path });
  }, [metaTitle, description, path]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-5 pb-24 pt-32 sm:px-6 md:pt-40 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-[46rem]">
            <h1 className="text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground md:text-[2.75rem]">{title}</h1>
            {lead && <div className="mt-6 text-[1.15rem] leading-relaxed text-foreground/75 md:text-[1.25rem]">{lead}</div>}
          </header>
          <div className="site-prose mt-14 max-w-[46rem]">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SitePage;
