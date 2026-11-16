import type { ReactNode } from "react";

/** Small sans heading that orients within a page; the content carries the weight. */
const SectionHeading = ({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) => (
  <div className="flex items-baseline justify-between gap-6 border-b border-foreground/[0.12] pb-4">
    <h2 id={id} className="text-[1.05rem] font-semibold tracking-[-0.005em] text-foreground">{children}</h2>
    {aside}
  </div>
);

export default SectionHeading;
