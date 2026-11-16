# Covers

Generates `public/work/covers/<slug>.svg` and `.png` (1600×900) for work items
and research updates. Front matter references them as
`cover_image: /work/covers/<slug>.svg`.

Two layouts, one palette (warm paper `#FAF8F4`, ink `#17132A`, Axym violet
`#3F21B6` and its tints), so the covers read as cards on the white site:

- **blueprint** (papers, products, libraries): drawing-sheet frame with columns
  1–8 and rows A–E, title (Newsreader, the site's heading serif) and optional
  subtitle on the left, one figure on the right, title block
  `AXYM LABS | KIND | DATE`.
- **card** (research updates): a full-bleed line drawing of the update's own
  data, no text. Every mark is a measured value or a value recomputed with the
  project's code; the docstring of each card function says what is drawn.

Text is converted to outlines, so the SVGs need no web fonts in an `<img>`.

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
