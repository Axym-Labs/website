import { Link } from "react-router-dom";
import PlatformIcon from "@/components/PlatformIcon";
import type { PlatformIconName } from "@/lib/platform-icons";

// Wordmark with the platform links beside it, then one quiet row of site
// links. Add X or LinkedIn to CHANNELS once Axym Labs has accounts; their
// icons already exist in platform-icons.ts.
const CHANNELS: { label: string; href: string; icon: PlatformIconName }[] = [
  { label: "GitHub", href: "https://github.com/Axym-Labs", icon: "github" },
  { label: "Hugging Face", href: "https://huggingface.co/Axym-Labs", icon: "huggingface" },
  { label: "Discord", href: "https://discord.gg/n3uqR4tnSv", icon: "discord" },
  { label: "contact@axym.org", href: "mailto:contact@axym.org", icon: "mail" },
];

const SITE: { label: string; to: string; external?: boolean }[] = [
  { label: "About", to: "/about/" },
  { label: "Contact", to: "/contact/" },
  { label: "Legal notice and privacy", to: "/legal/" },
  { label: "AxoSim documentation", to: "https://axo.axym.org", external: true },
];

const Footer = () => (
  <footer className="border-t border-foreground/10 bg-paper px-5 pb-10 pt-[72px] sm:px-6 lg:px-8 lg:pt-[120px] min-[1800px]:pt-[143px]">
    <div className="mx-auto max-w-site">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <p aria-hidden="true" className="select-none text-[4.2rem] font-semibold leading-[0.85] tracking-[-0.055em] text-foreground sm:text-[6rem] lg:text-[8.5rem]">
          Axym Labs
        </p>
        <ul className="space-y-2.5 text-[0.95rem] md:pb-2">
          {CHANNELS.map(({ label, href, icon }) => (
            <li key={href}>
              <a
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex items-center gap-2.5 text-foreground/80 transition-colors hover:text-primary"
              >
                <PlatformIcon name={icon} className="h-[1rem] w-[1rem]" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-12 flex flex-col gap-4 border-t border-foreground/10 pt-6 text-[0.88rem] text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>A small deep learning research group in Darmstadt, Germany.</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {SITE.map(({ label, to, external }) => (
            <li key={to}>
              {external ? (
                <a href={to} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">{label}</a>
              ) : (
                <Link to={to} className="transition-colors hover:text-primary">{label}</Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
