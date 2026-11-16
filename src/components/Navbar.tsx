import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

type Section = "work" | "updates" | "about" | "contact";

// Pages and sections of this site, plus the AxoSim documentation site.
// Platform links (GitHub, Hugging Face, ...) live in the footer.
const Navbar = ({ section }: { section?: Section }) => {
  const location = useLocation();
  const current: Section | undefined =
    section ??
    (location.pathname.startsWith("/work")
      ? "work"
      : location.pathname.startsWith("/about")
        ? "about"
        : location.pathname.startsWith("/contact")
          ? "contact"
          : undefined);
  const link = (name: Section) =>
    `text-[0.9rem] transition-colors hover:text-primary ${current === name ? "text-primary" : "text-foreground/70"}`;
  const aria = (name: Section): "page" | undefined => (current === name ? "page" : undefined);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-foreground/[0.08] bg-white/90 px-5 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link
          to="/"
          aria-label="Axym Labs home"
          className="inline-flex shrink-0 items-baseline text-[1.05rem] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Axym<span className="hidden sm:inline">&nbsp;Labs</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-7">
          <Link to="/work/" className={link("work")} aria-current={aria("work")}>
            Work
          </Link>
          <a href="/#updates" className={link("updates")} aria-current={aria("updates")}>
            Updates
          </a>
          <Link to="/about/" className={link("about")} aria-current={aria("about")}>
            About
          </Link>
          <Link to="/contact/" className={link("contact")} aria-current={aria("contact")}>
            Contact
          </Link>
          <a href="https://axo.axym.org" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-0.5 text-[0.9rem] text-foreground/70 transition-colors hover:text-primary md:inline-flex">
            AxoSim
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
