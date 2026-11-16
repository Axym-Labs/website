import { useState } from "react";

/**
 * Copyable BibTeX block. Uses the markup of the LaTeX pages' citation block
 * (publicationcitation) so both share one style.
 */
const CitationBlock = ({ bibtex }: { bibtex: string }) => {
  const [label, setLabel] = useState("Copy");
  const copy = () =>
    navigator.clipboard
      .writeText(`${bibtex}\n`)
      .then(() => {
        setLabel("Copied");
        window.setTimeout(() => setLabel("Copy"), 1600);
      })
      .catch(() => setLabel("Select and copy"));

  return (
    <div className="latex-publication">
      <section className="publication-citation" id="citation">
        <h2 className="publication-citation-heading">Citation</h2>
        <div className="publication-code">
          <button type="button" className="publication-copy" onClick={copy} aria-label="Copy citation to clipboard">
            {label}
          </button>
          <pre className="verbatim">{bibtex}</pre>
        </div>
      </section>
    </div>
  );
};

export default CitationBlock;
