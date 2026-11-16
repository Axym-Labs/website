import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WorkList from "@/components/WorkList";
import UpdatesGrid from "@/components/UpdatesGrid";
import Footer from "@/components/Footer";
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
      description: "Axym Labs is a small organization conducting collaborative deep learning research across continual, local, and task-agnostic learning, interpretability, and neuron simulation.",
      path: "/",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <WorkList items={workEntries(workItems, { homepage: true })} title="Our work" moreHref="/work/" />

      <UpdatesGrid items={updateEntries(workItems, { homepage: true })} />

      <section id="about" className="scroll-mt-16 border-t border-foreground/10 px-5 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
          <h2 className="font-serif text-[2.6rem] font-normal leading-none tracking-[-0.015em] text-foreground md:text-[3.25rem]">About</h2>

          <div className="max-w-[40rem] space-y-6 text-[1.08rem] leading-relaxed text-foreground/80">
            <p className="font-serif text-[1.55rem] leading-snug text-foreground">
              We combine theoretical analysis, empirical evaluation, and implementation to develop new deep-learning methods and improve existing ones.
            </p>
            <p>
              We publish the resulting papers, project pages, evidence, and code so others can reproduce the results and extend the methods.
              Our core team consists of{" "}
              <a href="https://davidewiest.com" className="text-primary underline decoration-primary/30 underline-offset-[0.2em] hover:decoration-primary">Davide Wiest</a>{" "}
              and{" "}
              <a href="https://github.com/Jonathan-Schaefer-git" className="text-primary underline decoration-primary/30 underline-offset-[0.2em] hover:decoration-primary">Jonathan Schäfer</a>,
              both based in Darmstadt, Germany. We have a mild preference for unconventional ideas, especially when they provide a credible alternative to established approaches.
            </p>
            <p>
              For collaboration or questions, write to{" "}
              <a href="mailto:contact@axym.org" className="text-primary underline decoration-primary/30 underline-offset-[0.2em] hover:decoration-primary">
                contact@axym.org
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
