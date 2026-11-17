# Covers

Generates `public/work/covers/<slug>.svg` and `.png` (1600×900) for work items
and research updates. Front matter references them as
`cover_image: /work/covers/<slug>.svg`.

Two layouts, one palette (warm paper `#FAF8F4`, ink `#17132A`, Axym violet
`#3F21B6` and its tints), so the covers read as cards on the white site:

- **blueprint** (papers, products, libraries): one large figure centred on a
  transparent canvas, on a paper backdrop (`#F5F1E9`) shaped to the figure's
  own footprint (`covers.backdrop`: the drawn pixels closed with a 220 px reach,
  a 46 px margin, Gaussian-smoothed, with a soft 10 px feather, kept 28 px
  inside the canvas). No title and no frame: the site prints the title beside
  the cover and draws the drawing-sheet frame around it (next section). `frame=True`
  draws the frame into the image again; `show_title=True` restores the old
  title-left, figure-right layout.
- **card** (research updates): a full-bleed line drawing of the update's own
  data, no text. Every mark is a measured value or a value recomputed with the
  project's code; the docstring of each card function says what is drawn.

Text is converted to outlines, so the SVGs need no web fonts in an `<img>`.

## Frame for the site

The frame the covers used to carry, for the site to draw in HTML/SVG/CSS.
Numbers are in cover pixels on the 1600×900 canvas; the second value is the
fraction of the frame's width (use it to scale, or keep pixel values fixed if
the frame grows around a whole entry).

Colours: paper `#FAF8F4`; card edge `#E4DFD5`; rules `#CBC4B6`; tick labels
`#9C9485`; corner-box text `#5E5868`, "AXYM LABS" in `#3F21B6`.

- **Card:** fill `#FAF8F4`, 1.5 px border `#E4DFD5`, corner radius 14 px
  (0.875%).
- **Outer rule:** rectangle inset 38 px (2.375%) from the card edge, stroke
  1.1 px `#CBC4B6`, no fill, square corners.
- **Inner rule:** rectangle inset 60 px (3.75%): the outer rule plus a 22 px
  (1.375%) band. Same stroke.
- **Columns:** the inner width is split into 8 equal columns. At each of the 7
  boundaries a 1.1 px `#CBC4B6` tick crosses the top and bottom bands (outer
  rule to inner rule), not the drawing area. Labels `1`–`8` are centred in each
  column, in both the top and bottom bands.
- **Rows:** the inner height is split into 5 equal rows `A`–`E` (top to
  bottom). Ticks at the 4 boundaries cross the left and right bands only. Each
  letter is centred in its row, in both side bands.
- **Tick labels:** JetBrains Mono Regular, 12 px (0.75% of width; 54.5% of the
  band), `#9C9485`, centred horizontally and vertically in the band (baseline
  4.2 px below the band's centre line), no letter spacing.
- **Corner box:** flush with the inner rule's lower-right corner (right and
  bottom edges on the inner rule), 34 px high (2.1%), fill `#FAF8F4`, 1.1 px
  `#CBC4B6` border and 1.1 px dividers between cells. Cells left to right:
  `AXYM LABS` (`#3F21B6`), kind (`PAPER`, `PRODUCT`, `LIBRARY`, `UPDATE`),
  date (`2026-10`), both `#5E5868`. Text JetBrains Mono Regular 12.5 px,
  uppercase, letter spacing 0.12 em, centred; each cell is its text width plus
  16 px padding left and right (≈ 111, 75 and 93 px wide for
  `AXYM LABS | PAPER | 2026-10`).
- **Drawing area** inside the inner rule: 1480×780 px. When the frame wrapped
  the cover image, the figure sat in a 1120×700 box centred horizontally at
  y = 92.

## Build

```sh
pip install matplotlib numpy pillow cairosvg
python scripts/covers/build.py                      # all covers
python scripts/covers/build.py kpsa terel           # some covers
python scripts/covers/build.py --sheet /tmp/s.png   # plus a contact sheet
```

The renderer reads only `data/*.json`. To refresh those from the project
repositories (`$WORKSPACE`, default `~/main/workspace`):

```sh
~/main/workspace/TeReL/.venv/bin/python scripts/covers/extract_data.py [name ...]
```

## Adding a cover

1. Paper or product with an existing figure: add an entry to `COVERS` in
   `build.py` with `layout="blueprint"`, `title`, `figure=` a path to an
   SVG/PNG/JPG, and `kind`/`date`. A figure function in `figures.py`
   (`def f(fig): ...` drawing into a matplotlib Figure) gives a cleaner,
   label-light cover than a full paper figure.
2. Research update: copy the plotted numbers into `data/<slug>.json` with a new
   function in `extract_data.py`, write a card function in `figures.py` (draw
   the real series full-bleed, violet for the condition the update is about,
   grey for baselines, ink for references), and register it with
   `layout="card"`.
3. Run `build.py <slug>` and look at the PNG.

The two ported posts already have covers:
`prepretraining-not-ready-yet` (all 54 downstream training-loss curves of the
12k-context Pythia-410M run) and `irregular-parameter-sharing` (the block
assignments of balanced random vs cycle-width sharing). If a slug changes,
rename its key in `COVERS` and the data file.

Fonts are under the SIL Open Font License (`fonts/OFL-*.txt`). Covers use only
our own data or code: no third-party images or reconstructions (those would
need per-page credits, e.g. the Allen Institute's).
