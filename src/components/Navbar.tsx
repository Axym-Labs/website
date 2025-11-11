import { useEffect, useState } from "react";

const Navbar = () => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["products", "research", "ideas", "about"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({ top: elementPosition, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-lg font-semibold text-foreground hover:text-accent transition-colors"
          >
            Axym Labs
          </button>
          
          <div className="flex items-center gap-8">
            <button
              onClick={() => scrollToSection("products")}
              className={`text-sm font-medium transition-colors ${
                ["products", "research", "ideas"].includes(activeSection)
                  ? "text-accent"
                  : "text-foreground/70 hover:text-accent"
              }`}
            >
              Work
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className={`text-sm font-medium transition-colors ${
                activeSection === "about"
                  ? "text-accent"
                  : "text-foreground/70 hover:text-accent"
              }`}
            >
              About
            </button>
            <a
              href="mailto:contact@axym.org"
              className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
