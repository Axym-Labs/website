"""Build covers into public/work/covers/<slug>.svg and .png.

    python scripts/covers/build.py                 # every cover in COVERS
    python scripts/covers/build.py kpsa terel      # selected slugs
    python scripts/covers/build.py --sheet out.png # also write a contact sheet

Needs matplotlib, numpy, pillow and cairosvg (pip install cairosvg).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # keep __pycache__ out of the repo
sys.path.insert(0, str(Path(__file__).resolve().parent))

import figures as F  # noqa: E402
from covers import SITE, W, blueprint, card  # noqa: E402

PUBLIC = SITE / "public" / "work"

# slug -> layout ("blueprint" or "card"), figure, and for blueprints title,
# optional subtitle, kind and date (title block), optional figure_box. A
# blueprint figure is a function from figures.py or a path to an SVG/PNG/JPG.
COVERS = {
    # products and papers: drawing-sheet template
    "axo": dict(layout="blueprint", title="AxoSim and AxoBench", figure=F.axo, kind="product", date="2026-10",
                subtitle="Learned neuron models, and a benchmark for their fidelity"),
    "axosim": dict(layout="blueprint", title="AxoSim", figure=F.axosim, kind="product", date="2026-10",
                   subtitle="Learned neuron models for population simulation at scale"),
    "axobench": dict(layout="blueprint", title="AxoBench", figure=F.axobench, kind="product", date="2026-10",
                     subtitle="Datasets and metrics for single-neuron fidelity"),
    "hierarchical-data-hypothesis": dict(layout="blueprint", title="The Hierarchical Data Hypothesis",
                                         figure=F.hierarchical_data_hypothesis, kind="paper", date="2026-11"),
    "kpsa": dict(layout="blueprint", title="Kernelized Parameter Sensitivity Atlases", figure=F.kpsa, kind="paper", date="2026-10"),
    "iewc": dict(layout="blueprint", title="Improved Elastic Weight Consolidation", figure=F.iewc, kind="paper", date="2026-07"),
    "terel": dict(layout="blueprint", title="Temporal Regularized Learning", figure=F.terel, kind="paper", date="2026-09"),
    "pptrain": dict(layout="blueprint", title="pptrain", figure=F.pptrain, kind="library", date="2026-06",
                    subtitle="A library for prepretraining"),
    "marey": dict(layout="blueprint", title="Marey", figure="marey", kind="library", date="2026-08",
                  subtitle="A plotting library for F# where the compiler checks your units",
                  figure_box=(W / 2 - 640, 70, 1280, 760)),
    # research updates: data line-art cards
    "axosim-fly-geometry": dict(layout="card", figure=F.axosim_fly_geometry_card),
    "prepretraining-not-ready-yet": dict(layout="card", figure=F.prepretraining_card),
    "irregular-parameter-sharing": dict(layout="card", figure=F.irregular_parameter_sharing_card),
}


def marey_figure(tmp: Path) -> Path:
    """Marey's own damped-oscillator output, without its title and background
    (the cover carries the title); its text is turned into outlines."""
    import re

    from covers import PAPER, SANS, text

    svg = (PUBLIC / "marey-oscillator.svg").read_text()
    svg = re.sub(r'<g role="note" data-marey-role="annotation".*?</g>', "", svg, count=1, flags=re.S)
    svg = svg.replace('<path d="M0 500L800 500L800 0L0 0Z" fill="#ffffff"/>', "", 1)
    svg = svg.replace('fill="#ffffff"', f'fill="{PAPER}"')  # legend box on the cover's paper

    def outline(m):
        attrs, content = m.group(1), m.group(2)

        def a(name, default=None):
            r = re.search(rf'{name}="([^"]+)"', attrs)
            return r.group(1) if r else default

        x, y, size = float(a("x", 0)), float(a("y", 0)), float(a("font-size", 12))
        anchor = a("text-anchor", "start")
        fill = a("fill", "#000000")
        base = a("dominant-baseline")
        if base in ("middle", "central"):
            y += size * 0.36
        elif base == "hanging":
            y += size * 0.76
        tr = a("transform")
        content = re.sub(r"<[^>]+>", "", content).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        p = text(content, x, y, size, fill, SANS, anchor)
        return f'<g transform="{tr}">{p}</g>' if tr else p

    svg = re.sub(r"<text\b([^>]*)>(.*?)</text>", outline, svg, flags=re.S)
    path = tmp / "marey-oscillator-outlined.svg"
    path.write_text(svg)
    return path


def build(slugs, tmp: Path) -> list[Path]:
    written = []
    for slug in slugs:
        spec = dict(COVERS[slug])
        layout, fig = spec.pop("layout"), spec.pop("figure")
        if fig == "marey":
            fig = marey_figure(tmp)
        if layout == "blueprint":
            written.append(blueprint(slug, spec.pop("title"), fig, **spec))
        else:
            written.append(card(slug, fig))
        print("wrote", written[-1].relative_to(SITE))
    return written


def contact_sheet(paths: list[Path], out: Path, cols: int = 3, w: int = 640) -> None:
    from PIL import Image, ImageDraw

    h = w * 9 // 16
    pad, lab = 28, 26
    rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad + lab) + pad), "white")
    draw = ImageDraw.Draw(sheet)
    for i, p in enumerate(paths):
        im = Image.open(p.with_suffix(".png")).convert("RGBA")
        im.thumbnail((w, h), Image.LANCZOS)
        x = pad + (i % cols) * (w + pad)
        y = pad + (i // cols) * (h + pad + lab)
        sheet.paste(im, (x, y), im)
        draw.text((x, y + h + 6), p.stem, fill=(90, 90, 90))
    sheet.save(out)
    print("wrote", out)


if __name__ == "__main__":
    import tempfile

    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--sheet", type=Path, help="write a contact sheet PNG of the built covers")
    args = ap.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        paths = build(args.slugs or list(COVERS), Path(tmp))
    if args.sheet:
        contact_sheet(paths, args.sheet)
