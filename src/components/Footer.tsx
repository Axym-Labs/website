import PlatformIcon from "@/components/PlatformIcon";
import type { PlatformIconName } from "@/lib/platform-icons";

// External and platform links. Add X or LinkedIn here once Axym Labs has
// accounts; their icons already exist in platform-icons.ts.
const PLATFORM_LINKS: { label: string; href: string; icon: PlatformIconName }[] = [
  { label: "GitHub", href: "https://github.com/Axym-Labs", icon: "github" },
  { label: "Hugging Face", href: "https://huggingface.co/Axym-Labs", icon: "huggingface" },
  { label: "Discord", href: "https://discord.gg/n3uqR4tnSv", icon: "discord" },
  { label: "contact@axym.org", href: "mailto:contact@axym.org", icon: "mail" },
];

const Footer = () => (
  <footer className="border-t border-foreground/10 bg-paper px-5 pb-12 pt-16 sm:px-6 md:pt-24 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-7 gap-y-3 text-[0.95rem]">
          {PLATFORM_LINKS.map(({ label, href, icon }) => (
            <li key={href}>
              <a
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex items-center gap-2 text-foreground/75 transition-colors hover:text-primary"
              >
                <PlatformIcon name={icon} className="h-[1.05rem] w-[1.05rem]" />
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex gap-7 text-sm">
          <a href="https://axo.axym.org" className="text-muted-foreground transition-colors hover:text-primary">
            AxoSim documentation
          </a>
          <a href="/disclosure" className="text-muted-foreground transition-colors hover:text-primary">
            Disclosure
          </a>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mt-16 select-none break-words font-serif text-[4.6rem] leading-[0.85] tracking-[-0.03em] text-foreground sm:text-[7rem] md:mt-24 md:text-center lg:text-[11.5rem]"
      >
        Axym Labs
      </div>
    </div>
  </footer>
);

export default Footer;
