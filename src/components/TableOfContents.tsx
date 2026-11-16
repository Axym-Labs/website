import { useEffect, useState } from "react";
import type { Heading } from "@/lib/publication-html";

/** Side table of contents with the section in view highlighted. */
const TableOfContents = ({ headings }: { headings: Heading[] }) => {
  const [active, setActive] = useState<string | undefined>(headings[0]?.id);

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;
    const onScroll = () => {
      const line = window.innerHeight * 0.3;
      let current = elements[0].id;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) current = element.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return (
    <nav aria-label="Contents" className="text-[0.84rem] leading-snug">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contents</p>
      <ol className="space-y-0.5 border-l border-foreground/10">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={active === heading.id ? "location" : undefined}
              className={`-ml-px block border-l py-1 transition-colors ${heading.level === 3 ? "pl-6 text-[0.8rem]" : "pl-3"} ${
                active === heading.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default TableOfContents;
