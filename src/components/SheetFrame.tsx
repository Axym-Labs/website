// Drawing-sheet frame after the reference cover (Wenhao Chai's blog): a
// numbered border band with columns 1-8 and rows A-E between two thin rules,
// on paper, with a small title block in the lower-right corner. Styling
// follows scripts/covers/covers.py (rule #CBC4B6, labels #9C9485 in mono,
// paper #FAF8F4, edge #E4DFD5). The cells are flex items, so the ticks stay
// evenly spaced at any frame size. The sheet covers its positioned parent and
// fades in when shown.

const COLUMNS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const ROWS = ["A", "B", "C", "D", "E"];

const Band = ({ labels, vertical, className }: { labels: string[]; vertical?: boolean; className: string }) => (
  <div aria-hidden="true" className={`sheet-band absolute flex ${vertical ? "flex-col" : ""} ${className}`}>
    {labels.map((label) => (
      <span key={label} className={`sheet-cell flex flex-1 items-center justify-center ${vertical ? "sheet-cell-v" : "sheet-cell-h"}`}>
        {label}
      </span>
    ))}
  </div>
);

interface SheetFrameProps {
  /** Title-block cells after AXYM LABS, e.g. ["PAPER", "2026-07"]. */
  cells: string[];
  /** Whether this sheet is faded in. */
  shown: boolean;
}

const SheetFrame = ({ cells, shown }: SheetFrameProps) => (
  <div aria-hidden="true" data-shown={shown || undefined} className="sheet pointer-events-none absolute inset-0">
    <div className="sheet-frame relative h-full w-full">
      <Band labels={COLUMNS} className="sheet-top" />
      <Band labels={COLUMNS} className="sheet-bottom" />
      <Band labels={ROWS} vertical className="sheet-left" />
      <Band labels={ROWS} vertical className="sheet-right" />
      <div className="sheet-block absolute z-20 flex">
        <span className="sheet-block-cell sheet-block-brand">Axym Labs</span>
        {cells.map((cell) => (
          <span key={cell} className="sheet-block-cell">{cell}</span>
        ))}
      </div>
    </div>
  </div>
);

export default SheetFrame;
