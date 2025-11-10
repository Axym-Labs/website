import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WorkList from "@/components/WorkList";
import Footer from "@/components/Footer";
import { workItems } from "@/data/work-items";

const Index = () => {
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
          title="Ideas"
          sectionId="ideas"
        />
      </div>

      {/* About Section */}
      <section id="about" className="py-32 px-6 lg:px-8 border-t border-foreground/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            About
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-foreground/80 leading-relaxed">
              Axym Labs is a student-run organization that shares code, prototypes, and ideas. 
              We prioritize proof-of-concept work and open-minded experiments, focusing on 
              reproducible demos and research in underexplored areas. We welcome collaborations 
              and follow-up projects. For inquiries:{" "}
              <a href="mailto:contact@axym.org" className="text-accent hover:underline">
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
