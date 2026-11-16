import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WorkList from "@/components/WorkList";
import UpdatesGrid from "@/components/UpdatesGrid";
import Footer from "@/components/Footer";
import SectionHeading from "@/components/SectionHeading";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { WorkItem } from "@/data/work-items";
import { getWorkItems, updateEntries, workEntries } from "@/data/work-items";
import { useEffect, useState } from "react";
import { setPageMetadata } from "@/lib/seo";

const Index = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    getWorkItems().then(setWorkItems);
    setPageMetadata({
      title: "Axym Labs",
      description: "Axym Labs is a small deep learning research group working on learning methods, neuron simulation, and interpretability.",
      path: "/",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <WorkList items={workEntries(workItems, { homepage: true })} title="Our work" moreHref="/work/" />

      <UpdatesGrid items={updateEntries(workItems, { homepage: true })} />

      <section id="about" className="scroll-mt-20 px-5 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-6xl">
          <SectionHeading>About</SectionHeading>
          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
            <p className="text-[1.3rem] font-medium leading-snug tracking-[-0.01em] text-foreground md:text-[1.5rem]">
              We combine theoretical analysis, empirical evaluation, and implementation to develop new deep-learning methods and improve existing ones.
            </p>
            <div className="max-w-[38rem] space-y-5 text-[1.02rem] leading-relaxed text-foreground/75">
              <p>
                We publish the resulting papers, project pages, evidence, and code so others can reproduce the results and extend the methods. The core team
                consists of Davide Wiest and Jonathan Schäfer, both based in Darmstadt, Germany, and we have a mild preference for unconventional ideas when
                they offer a credible alternative to established approaches. By default, we prioritize conceptual advances over model releases.
              </p>
              <p className="flex flex-wrap gap-x-6 gap-y-2">
                <Link to="/about/" className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-primary">
                  More about us <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/contact/" className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-primary">
                  Contact <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
