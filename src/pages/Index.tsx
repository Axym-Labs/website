import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WorkList from "@/components/WorkList";
import Footer from "@/components/Footer";
import type { WorkItem } from '@/data/work-items';
import { getWorkItems } from "@/data/work-items";
import { useEffect, useState } from 'react';

const Index = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    getWorkItems().then(setWorkItems);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      
      {/* Work Section with Three Subsections */}
      <div className="space-y-0">
        <WorkList
          items={workItems}
          category="product"
          title="Products"
          sectionId="products"
        />
        
        <WorkList
          items={workItems}
          category="research"
          title="Research"
          sectionId="research"
        />
        
        <WorkList
          items={workItems}
          category="idea"
          title="Ideas & Notes"
          sectionId="ideas"
        />
      </div>

      {/* About Section */}
      <section id="about" className="py-48 border-t border-foreground/10">
        <div className="px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            About
          </h2>
          
          <div className="prose prose-lg">
            <p className="text-lg text-foreground leading-relaxed !text-gray-200">
              Axym Labs works on research, proofs-of-concept and open-ended experiments in underexplored areas of machine learning and related fields. 
              We prioritize openness, sharing experimental results, ideas, notes and code for reproducibility.
              Interested in collaborating or building on our work? Reach out at:{" "}
              <a href="mailto:contact@axym.org" className="hover:text-accent underline">
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
