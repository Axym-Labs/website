"""Shared Matplotlib style for Axym research-update figures.

Serif text rendered as paths (no font dependency in the SVG), white
background, light grid, no top/right spines, house colors.
"""
from __future__ import annotations

import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

METHOD = "#3F21B6"
SECONDARY = "#8C7AD3"
BASELINE = "#BDBDBD"
BASELINE_DARK = "#6E6E6E"
INK = "#1F1F1F"
MUTED = "#5F5F5F"
GRID = "#ECECEC"

REPO = Path(__file__).resolve().parents[2]


def apply() -> None:
    plt.rcParams.update(
        {
            "font.family": "serif",
            "font.serif": ["STIXGeneral", "Nimbus Roman", "DejaVu Serif"],
            "mathtext.fontset": "stix",
            "font.size": 9,
            "axes.labelsize": 9,
            "axes.titlesize": 9,
            "xtick.labelsize": 8,
            "ytick.labelsize": 8,
            "legend.fontsize": 8.5,
            "axes.edgecolor": "#9A9A9A",
            "axes.linewidth": 0.7,
            "axes.labelcolor": INK,
            "text.color": INK,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "xtick.major.size": 0,
            "ytick.major.size": 0,
            "xtick.major.pad": 4,
            "ytick.major.pad": 4,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.spines.left": False,
            "axes.grid": True,
            "grid.color": GRID,
            "grid.linewidth": 0.7,
            "axes.axisbelow": True,
            "legend.frameon": False,
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "savefig.facecolor": "white",
            "savefig.transparent": False,
            "svg.fonttype": "path",
            "svg.hashsalt": "axym",
            "lines.solid_capstyle": "round",
        }
    )


def save(fig, slug: str, name: str) -> None:
    """Write the SVG served by the site and a PNG preview next to the LaTeX source."""
    svg_dir = REPO / "public" / "work" / slug
    png_dir = REPO / "src" / "content" / "latex" / "work" / "figures"
    svg_dir.mkdir(parents=True, exist_ok=True)
    png_dir.mkdir(parents=True, exist_ok=True)
    svg_path = svg_dir / f"{name}.svg"
    fig.savefig(svg_path, bbox_inches="tight", pad_inches=0.04, metadata={"Date": None})
    _fill_width(svg_path)
    fig.savefig(png_dir / f"{slug}-{name}.png", dpi=200, bbox_inches="tight", pad_inches=0.04, metadata={"Software": None})
    plt.close(fig)


def _fill_width(svg_path: Path, px: int = 1200) -> None:
    """Give the SVG a large intrinsic width so the page's max-width: 100% fills the column."""
    text = svg_path.read_text()
    m = re.search(r'<svg([^>]*?)width="([\d.]+)pt" height="([\d.]+)pt"', text)
    assert m, svg_path
    w, h = float(m.group(2)), float(m.group(3))
    new = f'<svg{m.group(1)}width="{px}" height="{px * h / w:.1f}"'
    svg_path.write_text(text[: m.start()] + new + text[m.end():])
