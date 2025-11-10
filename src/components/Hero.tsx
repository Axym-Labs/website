import { ChevronDown } from "lucide-react";

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({ top: elementPosition, behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 pt-16 overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>
      
      <div className="relative max-w-4xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
          We build machine-learning systems and explore new ML paradigms.
        </h1>
        
        <p className="text-base md:text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
          Student-run organization producing prototypes, reproducible demos, and experimental essays.
        </p>
        
        <div className="pt-8">
          <button
            onClick={() => scrollToSection("products")}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-md transition-colors"
          >
            See work
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
