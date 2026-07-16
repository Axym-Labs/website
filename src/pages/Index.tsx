import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WorkList from "@/components/WorkList";
import Footer from "@/components/Footer";
import type { WorkItem } from '@/data/work-items';
import { getWorkItems } from "@/data/work-items";
import { useEffect, useState } from 'react';
import { setPageMetadata } from "@/lib/seo";

const Index = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    getWorkItems().then(setWorkItems);
    setPageMetadata({
      title: "Axym Labs",
      description: "Axym Labs is a small organization conducting collaborative machine learning research across continual, local, and task-agnostic learning.",
      path: "/",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      
      <WorkList
        items={workItems}
        title="New Methods Across Various Settings"
      />

      {/* About Section */}
      <section id="about" className="py-48 border-t border-foreground/10">
        <div className="px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            About
          </h2>
          
          <div className="space-y-6 text-lg leading-relaxed text-gray-200">
            <p className="text-lg text-foreground leading-relaxed !text-gray-200">
              We combine theoretical analysis, empirical evaluation, and implementation to develop new machine-learning methods and improve existing ones.
              We publish the resulting papers, project pages, evidence, and code so others can reproduce the results and extend the methods.
            </p>
            <p>
              Our core team consists of{" "}
              <a href="https://davidewiest.com" className="text-accent underline">Davide Wiest</a>{" "}
              and{" "}
              <a href="https://github.com/Jonathan-Schaefer-git" className="text-accent underline">Jonathan Schäfer</a>{" "}
              and is based in Darmstadt, Germany. Our mission is to advance current methods in deep learning through careful research and engineering.
              We have a mild preference for unconventional ideas, especially when they provide a credible alternative to established approaches.
            </p>
            <p>
              For collaboration or questions, write to{" "}
              <a href="mailto:contact@axym.org" className="text-accent underline">
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
