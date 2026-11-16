"""Cover renderer for axym.org work items and research updates.

Two layouts share one palette and one 1600x900 canvas:

* ``blueprint``: papers and products. A drawing-sheet frame (columns 1-8, rows
  A-E) on warm paper, the title on the left, one figure on the right.
* ``card``: research updates. A full-bleed picture drawn from the update's own
  data (no text; the site prints title and date under it).

Text is converted to outlines, so the SVGs render identically in an <img> tag
without web fonts. PNGs are rasterized from the SVG with cairosvg.
"""

from __future__ import annotations

import base64
import io
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Union

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties, fontManager
from matplotlib.path import Path as MplPath
from matplotlib.textpath import TextPath

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
SITE = HERE.parent.parent
OUT = SITE / "public" / "work" / "covers"

W, H = 1600, 900

# Palette: warm paper, violet-black ink, the Axym violet and its tints.
PAPER = "#FAF8F4"
PAPER_EDGE = "#E4DFD5"
RULE = "#CBC4B6"
LABEL = "#9C9485"
INK = "#17132A"
MUTED = "#5E5868"
BRAND = "#3F21B6"
BRAND_MID = "#7560D0"
BRAND_LIGHT = "#B4A7E8"
BRAND_PALE = "#E3DDF7"
GREY = "#A3A6AE"
GREY_LIGHT = "#CDD0D5"

SERIF = FONTS / "NewsreaderDisplay-Regular.ttf"  # the site's heading serif
MONO = FONTS / "JetBrainsMono-Regular.ttf"
SANS = FONTS / "Inter-Regular.ttf"
for _f in (SERIF, MONO, SANS):
    fontManager.addfont(str(_f))
SANS_FAMILY = FontProperties(fname=str(SANS)).get_name()

plt.rcParams.update(
    {
        "svg.fonttype": "path",
        "svg.hashsalt": "axym-covers",
        "font.family": SANS_FAMILY,
        "mathtext.fontset": "cm",
        "axes.unicode_minus": False,
    }
)

# A figure is an image/SVG file or a function that draws into a matplotlib
# Figure of the given pixel size (width, height).
FigureSource = Union[str, Path, Callable[[plt.Figure], None]]


# --- text as outlines -------------------------------------------------------


def _path_d(tp: MplPath, x: float, y: float) -> str:
    out = []
    for verts, code in tp.iter_segments(curves=True, simplify=False):
        pts = [(x + verts[k], y - verts[k + 1]) for k in range(0, len(verts), 2)]
        if code == MplPath.MOVETO:
            out.append("M%.2f %.2f" % pts[0])
        elif code == MplPath.LINETO:
            out.append("L%.2f %.2f" % pts[0])
        elif code == MplPath.CURVE3:
            out.append("Q%.2f %.2f %.2f %.2f" % (*pts[0], *pts[1]))
        elif code == MplPath.CURVE4:
            out.append("C%.2f %.2f %.2f %.2f %.2f %.2f" % (*pts[0], *pts[1], *pts[2]))
        elif code == MplPath.CLOSEPOLY:
            out.append("Z")
    return "".join(out)


def text_width(text: str, size: float, font: Path = SERIF) -> float:
    if not text:
        return 0.0
    tp = TextPath((0, 0), text, size=size, prop=FontProperties(fname=str(font)))
    return float(tp.get_extents().x1) if len(tp.vertices) else 0.0


def text(s: str, x: float, y: float, size: float, fill: str, font: Path = SERIF,
         anchor: str = "start", spacing: float = 0.0) -> str:
    """SVG <path> for ``s`` with its baseline at y. ``spacing`` is extra
    tracking in em, applied per character."""
    prop = FontProperties(fname=str(font))
    if spacing:
        parts, cx = [], 0.0
        widths = [text_width(ch, size, font) if ch.strip() else size * 0.32 for ch in s]
        total = sum(widths) + spacing * size * (len(s) - 1)
        x0 = x - (total if anchor == "end" else total / 2 if anchor == "middle" else 0)
        for ch, w in zip(s, widths):
            if ch.strip():
                parts.append(_path_d(TextPath((0, 0), ch, size=size, prop=prop), x0 + cx, y))
            cx += w + spacing * size
        return f'<path fill="{fill}" d="{"".join(parts)}"/>'
    tp = TextPath((0, 0), s, size=size, prop=prop)
    w = float(tp.get_extents().x1)
    x0 = x - (w if anchor == "end" else w / 2 if anchor == "middle" else 0)
    return f'<path fill="{fill}" d="{_path_d(tp, x0, y)}"/>'


def wrap(title: str, size: float, max_width: float, font: Path = SERIF) -> list[str]:
    """Greedy wrap; an explicit newline in ``title`` forces a break."""
    lines = []
    for para in title.split("\n"):
        line = ""
        for word in para.split():
            cand = f"{line} {word}".strip()
            if line and text_width(cand, size, font) > max_width:
                lines.append(line)
                line = word
            else:
                line = cand
        lines.append(line)
    return lines


# --- figure embedding -------------------------------------------------------


def _strip_xml(svg: str) -> str:
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)
    svg = re.sub(r"<!DOCTYPE[^>]*>", "", svg, flags=re.S)
    svg = re.sub(r"<metadata>.*?</metadata>", "", svg, flags=re.S)
    return svg.strip()


def _place_svg(svg: str, x: float, y: float, w: float, h: float, prefix: str) -> str:
    """Nest an SVG document at (x, y, w, h), keeping its aspect ratio."""
    svg = _strip_xml(svg)
    m = re.match(r"<svg\b([^>]*)>", svg, re.S)
    attrs = m.group(1)
    vb = re.search(r'viewBox="([^"]+)"', attrs)
    if vb:
        viewbox = vb.group(1)
    else:
        def num(name):
            return float(re.search(rf'{name}="([\d.]+)', attrs).group(1))
        viewbox = f"0 0 {num('width')} {num('height')}"
    body = svg[m.end():]
    # Keep ids unique when several documents are nested in one file.
    ids = set(re.findall(r'id="([^"]+)"', body))
    for i in sorted(ids, key=len, reverse=True):
        body = re.sub(rf'(id="|#){re.escape(i)}(["\)])', rf"\g<1>{prefix}{i}\g<2>", body)
    return (
        f'<svg x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" viewBox="{viewbox}" '
        f'preserveAspectRatio="xMidYMid meet" overflow="visible">{body}'
    )


def figure_svg(draw: Callable[[plt.Figure], None], w: float, h: float, dpi: int = 100) -> str:
    """Render a drawing function into an SVG string of w x h pixels."""
    fig = plt.figure(figsize=(w / dpi, h / dpi), dpi=dpi)
    fig.patch.set_alpha(0)
    draw(fig)
    buf = io.StringIO()
    fig.savefig(buf, format="svg", transparent=True, metadata={"Date": None}, dpi=2 * dpi)  # dpi: rasterized layers
    plt.close(fig)
    return buf.getvalue()


def _raster_svg(path: Path, max_width: int = 1100) -> str:
    from PIL import Image

    im = Image.open(path)
    im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
    if im.width > max_width:
        im = im.resize((max_width, round(im.height * max_width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    if im.mode == "RGB":
        im.save(buf, "JPEG", quality=88, optimize=True)
        mime = "image/jpeg"
    else:
        im.save(buf, "PNG", optimize=True)
        mime = "image/png"
    data = base64.b64encode(buf.getvalue()).decode()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'viewBox="0 0 {im.width} {im.height}"><image width="{im.width}" height="{im.height}" '
            f'xlink:href="data:{mime};base64,{data}"/></svg>')


def resolve_figure(fig: FigureSource, w: float, h: float) -> str:
    if callable(fig):
        return figure_svg(fig, w, h)
    path = Path(fig)
    if path.suffix.lower() == ".svg":
        return path.read_text()
    return _raster_svg(path)


# --- layouts ----------------------------------------------------------------


def _document(body: str, radius: float = 14) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'<defs><clipPath id="card"><rect width="{W}" height="{H}" rx="{radius}"/></clipPath></defs>'
        f'<g clip-path="url(#card)"><rect width="{W}" height="{H}" fill="{PAPER}"/>{body}</g>'
        f'<rect x="0.75" y="0.75" width="{W - 1.5}" height="{H - 1.5}" rx="{radius}" fill="none" '
        f'stroke="{PAPER_EDGE}" stroke-width="1.5"/></svg>'
    )


@dataclass
class Sheet:
    """Geometry of the drawing-sheet frame (after the reference image)."""

    outer: float = 38.0   # canvas edge to outer frame line
    band: float = 22.0    # width of the numbered border band
    cols: int = 8
    rows: str = "ABCDE"

    def frame(self) -> str:
        o, b = self.outer, self.band
        x0, y0, x1, y1 = o, o, W - o, H - o
        ix0, iy0, ix1, iy1 = o + b, o + b, W - o - b, H - o - b
        parts = [
            f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="none" stroke="{RULE}" stroke-width="1.1"/>',
            f'<rect x="{ix0}" y="{iy0}" width="{ix1 - ix0}" height="{iy1 - iy0}" fill="none" stroke="{RULE}" stroke-width="1.1"/>',
        ]
        cw = (ix1 - ix0) / self.cols
        for i in range(self.cols):
            cx = ix0 + (i + 0.5) * cw
            if i:
                xx = ix0 + i * cw
                parts.append(f'<path d="M{xx:.1f} {y0}V{iy0}M{xx:.1f} {iy1}V{y1}" stroke="{RULE}" stroke-width="1.1"/>')
            for yy in (y0 + b / 2 + 4.2, iy1 + b / 2 + 4.2):
                parts.append(text(str(i + 1), cx, yy, 12, LABEL, MONO, "middle"))
        rh = (iy1 - iy0) / len(self.rows)
        for j, letter in enumerate(self.rows):
            cy = iy0 + (j + 0.5) * rh
            if j:
                yy = iy0 + j * rh
                parts.append(f'<path d="M{x0} {yy:.1f}H{ix0}M{ix1} {yy:.1f}H{x1}" stroke="{RULE}" stroke-width="1.1"/>')
            for xx in (x0 + b / 2, ix1 + b / 2):
                parts.append(text(letter, xx, cy + 4.2, 12, LABEL, MONO, "middle"))
        return "".join(parts)

    def inner(self):
        o, b = self.outer, self.band
        return o + b, o + b, W - o - b, H - o - b


def blueprint(slug: str, title: str, figure: FigureSource, *, subtitle: str = "", kind: str = "", date: str = "",
              figure_box: tuple[float, float, float, float] | None = None, show_title: bool = False,
              frame: bool = False, title_size: float = 64, title_width: float = 650, out: Path = OUT) -> Path:
    """Write <out>/<slug>.svg and .png: one large figure centred on the paper.

    The site draws the drawing-sheet frame (README, "Frame for the site") and
    prints the title beside the cover, so by default the image has neither.
    ``frame=True`` draws the frame and corner title block into the image;
    ``show_title=True`` (implies the frame) restores the title-left,
    figure-right layout. figure_box is (x, y, w, h) in canvas pixels.
    """
    frame = frame or show_title
    sheet = Sheet()
    ix0, iy0, ix1, iy1 = sheet.inner()
    if show_title:
        fx, fy, fw, fh = figure_box or (815, 112, 680, 676)
    elif frame:
        fx, fy, fw, fh = figure_box or (W / 2 - 560, 92, 1120, 700)
    else:
        fx, fy, fw, fh = figure_box or (W / 2 - 660, 50, 1320, 800)

    title_svg = ""
    if show_title:
        lines = wrap(title, title_size, title_width)
        lh = title_size * 1.12
        sub_size, sub_lh = 25, 25 * 1.38
        sub = wrap(subtitle, sub_size, min(title_width - 60, 540), SANS) if subtitle else []
        gap = 30 if sub else 0
        block_h = lh * (len(lines) - 1) + title_size * 0.72 + gap + sub_lh * len(sub)
        tx = 128
        ty = H / 2 - block_h / 2 + title_size * 0.72
        title_svg = "".join(text(line, tx, ty + i * lh, title_size, INK) for i, line in enumerate(lines))
        sy = ty + lh * (len(lines) - 1) + gap + sub_size
        title_svg += "".join(text(line, tx, sy + i * sub_lh, sub_size, MUTED, SANS) for i, line in enumerate(sub))

    # Title block in the lower-right corner of the sheet, as on a drawing.
    cells = [("AXYM LABS", BRAND)] + [(c.upper(), MUTED) for c in (kind, date) if c]
    pad, size = 16, 12.5
    widths = [text_width(c, size, MONO) + 0.12 * size * (len(c) - 1) + 2 * pad for c, _ in cells]
    bh = 34
    bx = ix1 - sum(widths)
    by = iy1 - bh
    tb = [f'<rect x="{bx:.1f}" y="{by:.1f}" width="{sum(widths):.1f}" height="{bh}" fill="{PAPER}" stroke="{RULE}" stroke-width="1.1"/>']
    cx = bx
    for (c, col), w in zip(cells, widths):
        if cx > bx:
            tb.append(f'<path d="M{cx:.1f} {by:.1f}V{by + bh:.1f}" stroke="{RULE}" stroke-width="1.1"/>')
        tb.append(text(c, cx + w / 2, by + bh / 2 + 4.4, size, col, MONO, "middle", spacing=0.12))
        cx += w

    fig = _place_svg(resolve_figure(figure, fw, fh), fx, fy, fw, fh, prefix=f"{slug}-")
    body = (sheet.frame() + title_svg + fig + "".join(tb)) if frame else fig
    return _write(slug, _document(body), out)


def card(slug: str, draw: Callable[[plt.Figure], None], *, out: Path = OUT) -> Path:
    """Write a full-bleed research-update card drawn by ``draw``."""
    fig = _place_svg(figure_svg(draw, W, H), 0, 0, W, H, prefix=f"{slug}-")
    return _write(slug, _document(fig), out)


def _write(slug: str, svg: str, out: Path) -> Path:
    out.mkdir(parents=True, exist_ok=True)
    svg_path = out / f"{slug}.svg"
    svg_path.write_text(svg)
    png_path = out / f"{slug}.png"
    write_png(svg, png_path)
    return svg_path


def write_png(svg: str, path: Path, width: int = W, limit_kb: int = 300) -> None:
    import cairosvg
    from PIL import Image

    raw = cairosvg.svg2png(bytestring=svg.encode(), output_width=width)
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 0))
    im = Image.alpha_composite(bg, im)
    im.save(path, optimize=True)
    if path.stat().st_size > limit_kb * 1024:
        # Palette PNG keeps flat colours and lines crisp at a fraction of the size.
        im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)
