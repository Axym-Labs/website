import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export type SiteTone = "dark" | "light";

const TONES: Record<SiteTone, { bar: string; brand: string; link: string; active: string }> = {
  dark: {
    bar: "border-foreground/10 bg-background/90",
    brand: "text-foreground hover:text-accent focus-visible:outline-accent",
    link: "text-foreground/70 hover:text-accent",
    active: "text-accent",
  },
  light: {
    bar: "border-gray-900/10 bg-white/90",
    brand: "text-gray-900 hover:text-primary focus-visible:outline-primary",
    link: "text-gray-600 hover:text-primary",
    active: "text-primary",
  },
};

// Pages and sections of this site, plus the AxoSim documentation site.
// Platform links (GitHub, Hugging Face, ...) live in the footer.
const Navbar = ({ tone = "dark" }: { tone?: SiteTone }) => {
  const location = useLocation();
  const colors = TONES[tone];
  const linkClass = "text-sm font-medium transition-colors";

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md ${colors.bar}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Axym Labs home" className={`inline-flex shrink-0 items-center text-base font-semibold transition-colors duration-150 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none sm:text-lg ${colors.brand}`}>
          <span>Axym<span className="hidden sm:inline"> Labs</span></span>
        </Link>
        <div className="flex items-center gap-5 sm:gap-8">
          <Link
            to="/work/"
            className={`${linkClass} ${location.pathname.startsWith("/work") ? colors.active : colors.link}`}
          >
            Work
          </Link>
          <a href="/#about" className={`${linkClass} ${colors.link}`}>
            About
          </a>
          <a
            href="https://axo.axym.org"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-0.5 ${linkClass} ${colors.link}`}
          >
            AxoSim
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
