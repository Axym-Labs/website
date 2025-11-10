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
    <section className="min-h-screen flex items-center justify-center px-6 lg:px-8 pt-16">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
          We build machine-learning systems and explore new ML paradigms.
        </h1>
        
        <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
          Student-run organization producing prototypes, reproducible demos, and experimental essays.
        </p>
        
        <div className="pt-8">
          <button
            onClick={() => scrollToSection("products")}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-md transition-colors"
          >
            Explore Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
