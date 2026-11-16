import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// Pages and sections of this site, plus the AxoSim documentation site.
// Platform links (GitHub, Hugging Face, ...) live in the footer.
const Navbar = ({ section }: { section?: "work" | "updates" }) => {
  const location = useLocation();
  const link = "text-[0.9rem] text-foreground/70 transition-colors hover:text-primary";
  const onWork = section ? section === "work" : location.pathname.startsWith("/work");
  const onUpdates = section === "updates";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-foreground/[0.08] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="Axym Labs home"
          className="inline-flex shrink-0 items-baseline font-serif text-[1.4rem] leading-none tracking-[-0.01em] text-foreground transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Axym<span className="hidden sm:inline">&nbsp;Labs</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-7">
          <Link to="/work/" className={`${link} ${onWork ? "!text-primary" : ""}`} aria-current={onWork ? "page" : undefined}>
            Work
          </Link>
          <a href="/#updates" className={`${link} hidden sm:inline ${onUpdates ? "!text-primary" : ""}`}>
            Updates
          </a>
          <a href="/#about" className={link}>
            About
          </a>
          <a href="https://axo.axym.org" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-0.5 ${link}`}>
            AxoSim
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="mailto:contact@axym.org"
            className="hidden rounded-full border border-foreground/15 px-3.5 py-1.5 text-[0.85rem] text-foreground transition-colors hover:border-primary hover:text-primary md:inline-flex"
          >
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
