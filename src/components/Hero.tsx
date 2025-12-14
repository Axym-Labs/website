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
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 pt-16 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/work/real-time-inference.jpg" 
          alt="" 
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background"></div>
      </div>
      
      <div className="relative max-w-4xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
          Machine Learning Systems and Ideas
        </h1>
        
        <p className="text-foreground/70 max-w-3xl mx-auto leading-relaxed">
          Small-scale student organization conducting research, producing prototypes and sharing ideas.
        </p>
      </div>
    </section>
  );
};

export default Hero;
