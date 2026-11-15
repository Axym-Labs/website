import PlatformIcon from "@/components/PlatformIcon";
import type { PlatformIconName } from "@/lib/platform-icons";
import type { SiteTone } from "@/components/Navbar";

// External and platform links. Add X, LinkedIn, or Discord here once
// Axym Labs has accounts; their icons already exist in platform-icons.ts.
const PLATFORM_LINKS: { label: string; href: string; icon: PlatformIconName }[] = [
  { label: "GitHub", href: "https://github.com/Axym-Labs", icon: "github" },
  { label: "Hugging Face", href: "https://huggingface.co/Axym-Labs", icon: "huggingface" },
  { label: "Discord", href: "https://discord.gg/n3uqR4tnSv", icon: "discord" },
  { label: "contact@axym.org", href: "mailto:contact@axym.org", icon: "mail" },
];

const TONES: Record<SiteTone, { footer: string; wordmark: string; link: string; muted: string }> = {
  dark: {
    footer: "mt-32 border-foreground/10",
    wordmark: "text-foreground",
    link: "text-foreground/70 hover:text-accent",
    muted: "text-foreground/45 hover:text-accent",
  },
  light: {
    footer: "border-gray-900/10 bg-white",
    wordmark: "text-gray-900",
    link: "text-gray-600 hover:text-primary",
    muted: "text-gray-500 hover:text-primary",
  },
};

const Footer = ({ tone = "dark" }: { tone?: SiteTone }) => {
  const colors = TONES[tone];

  return (
    <footer className={`border-t px-6 py-24 md:py-36 lg:px-8 ${colors.footer}`}>
      <div className="mx-auto max-w-7xl space-y-20">
        <div className={`break-words text-[4.5rem] font-bold leading-none sm:text-[6rem] md:text-center xl:text-[10rem] ${colors.wordmark}`}>
          Axym Labs
        </div>

        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-8 gap-y-4 text-base">
            {PLATFORM_LINKS.map(({ label, href, icon }) => (
              <li key={href}>
                <a
                  href={href}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`inline-flex items-center gap-2 transition-colors ${colors.link}`}
                >
                  <PlatformIcon name={icon} className="h-[1.1rem] w-[1.1rem]" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex gap-8 text-sm">
            <a href="https://axo.axym.org" className={`transition-colors ${colors.muted}`}>
              AxoSim documentation
            </a>
            <a href="/disclosure" className={`transition-colors ${colors.muted}`}>
              Disclosure
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
