import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Axym Labs home" className="inline-flex shrink-0 items-center gap-2 text-base font-semibold text-foreground transition-colors duration-150 hover:text-accent focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none sm:text-lg">
          <img src="/brand/axym-logo.svg?v=f6597f4d" alt="" width="32" height="32" className="h-8 w-8 shrink-0" />
          <span>Axym<span className="hidden sm:inline"> Labs</span></span>
        </Link>
        <div className="flex items-center gap-2 [&>a]:text-xs sm:gap-6 sm:[&>a]:text-sm">
          <Link
            to="/work/"
            className={`text-sm font-medium transition-colors ${location.pathname.startsWith("/work") ? "text-accent" : "text-foreground/70 hover:text-accent"}`}
          >
            Work
          </Link>
          <a href="/#about" className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent">
            About
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
          <a
            href="https://github.com/Axym-Labs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent"
          >
            GitHub
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
