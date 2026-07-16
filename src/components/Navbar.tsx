import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold text-foreground transition-colors hover:text-accent">
          Axym Labs
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            to="/work"
            className={`text-sm font-medium transition-colors ${location.pathname.startsWith("/work") ? "text-accent" : "text-foreground/70 hover:text-accent"}`}
          >
            Work
          </Link>
          <a href="/#about" className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent">
            About
          </a>
          <a
            href="https://github.com/Axym-Labs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent"
          >
            GitHub
          </a>
          <a
            href="https://huggingface.co/Axym-Labs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Axym Labs on Hugging Face"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent"
          >
            <span className="sm:hidden">HF</span>
            <span className="hidden sm:inline">Hugging Face</span>
          </a>
          <a href="mailto:contact@axym.org" className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent">
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
