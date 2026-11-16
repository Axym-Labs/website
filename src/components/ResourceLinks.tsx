import { Link } from "react-router-dom";
import PlatformIcon from "@/components/PlatformIcon";
import { linkIcon } from "@/lib/link-icons";
import type { ResourceLink } from "@/data/work-items";

const Icon = ({ kind }: { kind: string }) => {
  const icon = linkIcon(kind);
  if (icon.type === "svg") return <PlatformIcon name={icon.value} className="h-[0.95em] w-[0.95em] shrink-0" />;
  if (icon.type === "glyph") return <span aria-hidden="true" className="w-[0.95em] text-center font-serif text-[1.15em] leading-none">{icon.value}</span>;
  return <span aria-hidden="true" className="text-[0.95em] leading-none">{icon.value}</span>;
};

/** One row of icon-and-label links, the site-side twin of the papers' links line. */
const ResourceLinks = ({ links, className = "" }: { links: ResourceLink[]; className?: string }) => (
  <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9rem] ${className}`}>
    {links.map((link) => {
      const content = (
        <>
          <Icon kind={link.kind} />
          <span>{link.label}</span>
        </>
      );
      const cls = "inline-flex items-center gap-1.5 text-foreground/80 underline decoration-foreground/20 underline-offset-[0.22em] transition-colors hover:text-primary hover:decoration-primary/50";
      return (
        <li key={`${link.kind}-${link.url}`}>
          {link.url.startsWith("/") ? (
            <Link to={link.url} className={cls}>{content}</Link>
          ) : (
            <a href={link.url} className={cls} {...(link.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {content}
            </a>
          )}
        </li>
      );
    })}
  </ul>
);

export default ResourceLinks;
