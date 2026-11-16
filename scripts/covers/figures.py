"""Figure functions for the covers. Each reads scripts/covers/data/<name>.json
(written by extract_data.py) and draws into a matplotlib Figure."""

from __future__ import annotations

import json
from functools import lru_cache

import numpy as np
from matplotlib.collections import LineCollection, PolyCollection
from matplotlib.colors import LinearSegmentedColormap, to_rgb
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Polygon

from covers import (BRAND, BRAND_LIGHT, BRAND_MID, BRAND_PALE, GREY, GREY_LIGHT, HERE, INK, LABEL, MUTED,
                    PAPER, RULE)

DATA = HERE / "data"
SMALL = 12.5  # px, figure annotation size


@lru_cache(None)
def load(name: str) -> dict:
    return json.loads((DATA / f"{name}.json").read_text())


def _mix(a: str, b: str, t: float):
    a, b = np.array(to_rgb(a)), np.array(to_rgb(b))
    return tuple(a + (b - a) * t)


def _bare(ax):
    ax.set_axis_off()
    ax.set_facecolor("none")


FONT_SCALE = 1.25  # annotation text grows with the full-width figure


def _pt(px: float) -> float:
    """Pixel size (at the old half-width layout) to points at the 100-dpi figure scale."""
    return px * 0.72 * FONT_SCALE


# --- papers and products (blueprint) ---------------------------------------


def axosim(fig):
    """Central comparison: normalized radar radii, AxoSim vs released baselines."""
    d = load("axosim")
    labels = ["Inference\nthroughput", "Voltage\nfidelity", "Subthreshold\nfidelity", "Mean F1\n0–5 ms", "History\nthroughput"]
    n = len(labels)
    ang = np.pi / 2 - 2 * np.pi * np.arange(n) / n
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0])
    _bare(ax)
    ax.set_aspect("equal")
    ax.set_xlim(-1.75, 2.75)
    ax.set_ylim(-1.12, 1.24)
    for r in (0.25, 0.5, 0.75, 1.0):
        p = np.c_[r * np.cos(ang), r * np.sin(ang)]
        ax.add_patch(Polygon(p, closed=True, fill=False, ec=RULE, lw=0.9 if r < 1 else 1.2))
    for a in ang:
        ax.plot([0, np.cos(a)], [0, np.sin(a)], color=RULE, lw=0.9)

    def poly(vals, **kw):
        v = np.r_[vals, vals[:1]]
        a = np.r_[ang, ang[:1]]
        ax.plot(v * np.cos(a), v * np.sin(a), **kw)
        return v * np.cos(a), v * np.sin(a)

    s = d["series"]
    for key, style in [("branch-elm-memory-100", dict(color=GREY, lw=1.6, ls=(0, (4, 2.5)))),
                       ("tcn-8_224_217", dict(color=INK, lw=1.3, ls=(0, (1, 2.2)), alpha=0.75))]:
        poly(s[key], **style)
    poly(s["axosim-mamba-medium"], color=BRAND_MID, lw=1.8)
    x, y = poly(s["axosim-gru-medium"], color=BRAND, lw=2.6, zorder=5)
    ax.fill(x, y, color=BRAND, alpha=0.12, lw=0, zorder=4)
    for lab, a in zip(labels, ang):
        r = 1.13
        ha = "center" if abs(np.cos(a)) < 0.2 else ("left" if np.cos(a) > 0 else "right")
        ax.text(r * np.cos(a), r * np.sin(a), lab, ha=ha, va="center", fontsize=_pt(15), color=MUTED, linespacing=1.15)
    # legend
    items = [("AxoSim-GRU Medium", dict(color=BRAND, lw=2.6)), ("AxoSim-Mamba Medium", dict(color=BRAND_MID, lw=1.8)),
             ("Branch-ELM M100", dict(color=GREY, lw=1.6, ls=(0, (4, 2.5)))), ("TCN 7.2M", dict(color=INK, lw=1.3, ls=(0, (1, 2.2)), alpha=0.75))]
    lx, ly = 1.55, 0.27
    for i, (lab, st) in enumerate(items):
        xx = lx
        yy = ly - i * 0.15
        ax.plot([xx, xx + 0.16], [yy, yy], **st)
        ax.text(xx + 0.22, yy, lab, va="center", fontsize=_pt(14), color=MUTED)


def axobench(fig):
    """Error anatomy panel A: spike-triggered soma voltage, teacher vs model."""
    s = load("axobench")["series"]
    ax = fig.add_axes([0.14, 0.17, 0.8, 0.72])
    ax.set_facecolor("none")
    st = {
        "teacher_hit": ("Teacher, hit", dict(color=INK, lw=2.2)),
        "model_hit": ("Model, hit", dict(color=BRAND, lw=2.6)),
        "teacher_missed": ("Teacher, missed", dict(color=INK, lw=1.5, ls=(0, (4, 2.4)), alpha=0.7)),
        "model_missed": ("Model, missed", dict(color=BRAND_MID, lw=1.8, ls=(0, (4, 2.4)))),
        "model_false": ("Model, false", dict(color=GREY, lw=1.8, ls=(0, (1, 2.2)))),
    }
    for key in ["teacher_missed", "model_missed", "model_false", "teacher_hit", "model_hit"]:
        lab, kw = st[key]
        ax.plot(s[key]["t_ms"], s[key]["v_mv"], label=lab, solid_capstyle="round", **kw)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(LABEL)
        ax.spines[side].set_linewidth(1)
    ax.tick_params(colors=MUTED, labelsize=_pt(14), length=4, width=1)
    ax.set_xlabel("Time from spike event (ms)", fontsize=_pt(15), color=MUTED, labelpad=8)
    ax.set_ylabel("Soma voltage (mV)", fontsize=_pt(15), color=MUTED, labelpad=8)
    ax.set_xlim(-10, 40)
    ax.legend(frameon=False, fontsize=_pt(14), labelcolor=MUTED, loc="upper right", handlelength=2.4)


def axo(fig):
    """Trace stack of an AxoSim population run in the FlyVis visual circuit:
    central-cell responses to a moving ON edge of the AXO_ROWS cell types
    (of 65) with the largest peak-to-peak response, in circuit order, from
    0.2 s before stimulus onset (the model's settling phase at the start of
    the recording is left out). One shared amplitude scale; each trace is
    relative to its first shown value. T4/T5 motion detectors in violet."""
    d = load("axo")
    t = np.array(d["time_s"])
    keep = t >= -0.2
    t = t[keep]
    resp = np.array(d["response"])[:, keep]
    types = d["cell_types"]
    rows = np.sort(np.argsort(-np.ptp(resp, 1))[:AXO_ROWS])  # keep circuit order
    ax = fig.add_axes([0.11, 0.1, 0.87, 0.86])
    _bare(ax)
    n = len(rows)
    scale = 2.4  # response units per row spacing, shared by all rows
    for r, i in enumerate(rows):
        y0 = n - 1 - r
        y = y0 + scale * (resp[i] - resp[i, 0])
        motion = types[i].startswith(("T4", "T5"))
        # Paper fill under each trace hides the rows behind it (lower rows are in front).
        ax.fill_between(t[::2], y[::2] - 0.04, y0 - 1.2, color=PAPER, lw=0, zorder=2 * r)  # occluder only
        ax.plot(t, y, color=BRAND if motion else INK, lw=2.2 if motion else 1.15, alpha=1 if motion else 0.85, zorder=2 * r + 1,
                solid_joinstyle="round", solid_capstyle="round")
        ax.text(t[0] - 0.04, y0, types[i], ha="right", va="center", fontsize=_pt(12),
                color=BRAND if motion else MUTED, zorder=200)
    ax.set_xlim(t[0] - 0.02, t[-1])
    ax.set_ylim(-2.2, n + 1.2)
    xb = t[-1] - 0.5
    ax.plot([xb, t[-1]], [-1.4, -1.4], color=MUTED, lw=1.4, zorder=200)
    ax.text(xb + 0.25, -1.9, "0.5 s", ha="center", va="top", fontsize=_pt(13), color=MUTED)
    fig.text(0.545, 0.025, f"AxoSim neurons in the FlyVis visual circuit · moving-edge responses, {n} most responsive of 65 cell types",
             fontsize=_pt(SMALL - 0.5), color=LABEL, ha="center")


AXO_ROWS = 24


def hierarchical_data_hypothesis(fig):
    """Density landscape of nested parent and child distributions (the third
    panel of the paper's original lead figure), as line art."""
    d = load("hierarchical-data-hypothesis")
    x, y = np.array(d["x"]), np.array(d["y"])
    z = np.array(d["density"])
    share = np.array(d["share_dark"])
    ax = fig.add_axes([-0.08, -0.13, 1.24, 1.26], projection="3d")
    ax.set_axis_off()
    ax.patch.set_alpha(0)
    from mpl_toolkits.mplot3d.art3d import Line3DCollection

    lo, hi = "#8C78D8", BRAND
    step = 6  # one colour per 6-sample stretch keeps the SVG small
    for j in range(0, len(y), 2):
        pts = np.c_[x, np.full_like(x, y[j]), z[j]]
        segs, cols, lws = [], [], []
        for k in range(0, len(x) - 1, step):
            seg = pts[k: k + step + 1]
            tt, hh = share[j, k: k + step + 1].mean(), z[j, k: k + step + 1].mean()
            segs.append(seg)
            cols.append((*_mix(GREY_LIGHT, _mix(lo, hi, tt), min(1, 0.25 + 1.6 * hh)), 0.95))
            lws.append(0.9 + 0.6 * hh)
        ax.add_collection3d(Line3DCollection(segs, colors=cols, linewidths=lws, capstyle="round", joinstyle="round"))
    # floor regions of the lead figure (two parents, one root)
    par = np.linspace(0, 2 * np.pi, 160)
    for (cx, cy), (rx, ry), col, lw in [((-1.22, 0.02), (1.22, 1.30), "#8C78D8", 1.1),
                                        ((1.25, 0.0), (1.25, 1.32), "#6C4FD0", 1.1),
                                        ((0, 0), (2.35, 1.72), BRAND, 1.4)]:
        ax.plot(cx + rx * np.cos(par), cy + ry * np.sin(par), np.full_like(par, -0.05), color=col, lw=lw, alpha=0.8)
    ax.set_xlim(-2.55, 2.55)
    ax.set_ylim(-2.0, 2.0)
    ax.set_zlim(-0.08, 1.05)
    ax.view_init(elev=27, azim=-58)
    ax.set_box_aspect((1.35, 1.0, 0.68), zoom=1.2)


def kpsa(fig):
    """Circuit mass across transformer depth for 12 held-out inputs (Vision, Forecasting)."""
    d = load("kpsa")["panels"]
    cmap = LinearSegmentedColormap.from_list("k", [BRAND_PALE, BRAND_LIGHT, BRAND_MID, BRAND])
    for k, (name, title) in enumerate([("vision", "Vision"), ("forecasting", "Forecasting")]):
        m = np.array(d[name])
        ax = fig.add_axes([0.1 + k * 0.43, 0.13, 0.38, 0.74])
        _bare(ax)
        ax.set_aspect("equal")
        for i in range(12):
            for j in range(12):
                v = m[i, j]
                r = 0.08 + 0.38 * np.sqrt(v)
                ax.add_patch(FancyBboxPatch(
                    (j - r, -i - r), 2 * r, 2 * r, boxstyle=f"round,pad=0,rounding_size={0.35 * r}",
                    fc=cmap(v), ec="none"))
        ax.set_xlim(-0.7, 11.7)
        ax.set_ylim(-11.7, 0.7)
        ax.text(-0.5, 1.4, title, fontsize=_pt(19), color=INK, va="bottom")
        ax.annotate("", xy=(11.5, -12.8), xytext=(-0.5, -12.8), arrowprops=dict(arrowstyle="-|>", color=LABEL, lw=1, mutation_scale=10), annotation_clip=False)
        ax.text(-0.5, -13.6, "Transformer block 1–12", fontsize=_pt(14), color=MUTED, va="top")
    fig.text(0.09, 0.5, "12 held-out inputs", rotation=90, fontsize=_pt(14), color=MUTED, va="center", ha="center")


def iewc(fig):
    """Weighted IEWC penalty bowl, p = λ(h_r a_r² + h_n a_n²) with h_r ≪ h_n,
    with the projection and radii of iewc-paper/figures/build_overview.py."""
    ax = fig.add_axes([0, 0, 1, 1])
    _bare(ax)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    asp = fig.get_figheight() / fig.get_figwidth()
    S_U, S_VX, S_VY, S_Z = 0.12 * 0.85, 0.096 * asp * 1.6 * 0.85, 0.076 * 1.25, 0.5
    cx, by = 0.5, 0.33
    ru, rv = 1.75, 0.56

    def proj(u, v, z):
        return cx + S_U * np.asarray(u) - S_VX * np.asarray(v), by - S_VY * np.asarray(v) + S_Z * np.asarray(z)

    th = np.linspace(0, 2 * np.pi, 160)
    levels = np.linspace(0.045, 1.0, 13)
    for z0, z1 in zip(levels[:-1], levels[1:]):
        x1, y1 = proj(ru * np.sqrt(z1) * np.cos(th), rv * np.sqrt(z1) * np.sin(th), z1)
        x0, y0 = proj(ru * np.sqrt(z0) * np.cos(th[::-1]), rv * np.sqrt(z0) * np.sin(th[::-1]), z0)
        ax.add_patch(Polygon(np.c_[np.r_[x1, x0], np.r_[y1, y0]], fc=BRAND_LIGHT, ec="none", alpha=0.05 + 0.05 * z1, zorder=2))
    for z in levels:
        x, y = proj(ru * np.sqrt(z) * np.cos(th), rv * np.sqrt(z) * np.sin(th), z)
        ax.plot(x, y, color=_mix(BRAND_MID, BRAND, z), lw=1.3 + 0.9 * z, alpha=0.9, zorder=3 + z, solid_capstyle="round")
    o = proj(0, 0, 0)
    for end, lab, off in [((1.3 * 1.55, 0, 0), r"$a_{\mathrm{redundant}}$", (0.01, -0.045)),
                          ((0, 1.25 * 1.4, 0), r"$a_{\mathrm{novel}}$", (-0.03, 0.0)),
                          ((0, 0, 1.18), r"penalty $p$", (0.0, 0.03))]:
        e = proj(*end)
        ax.add_patch(FancyArrowPatch(o, e, arrowstyle="-|>", mutation_scale=14, lw=1.2, color=INK, zorder=20))
        ax.text(e[0] + off[0], e[1] + off[1], lab, fontsize=_pt(19), color=INK, ha="center", va="center")
    ax.text(0.5, 0.025, r"$p=\lambda\,(h_r\,a_{\mathrm{redundant}}^2+h_n\,a_{\mathrm{novel}}^2),\quad h_r\ll h_n$",
            fontsize=_pt(19), color=MUTED, ha="center")


def terel(fig):
    """Laplacian eigenmap of TeReL's MNIST representations, coloured by digit."""
    d = load("terel")
    xy = np.array(d["xy"])
    lab = np.array(d["label"])
    pal = ["#17132A", "#3F21B6", "#7560D0", "#B4A7E8", "#176B68", "#64A7A2", "#A85B35", "#D59765", "#8E3F67", "#D181A4"]
    ax = fig.add_axes([0.06, 0.06, 0.88, 0.88])
    _bare(ax)
    order = np.random.default_rng(0).permutation(len(xy))
    ax.scatter(xy[order, 0], xy[order, 1], s=15, c=[pal[i] for i in lab[order]], lw=0, alpha=0.8, rasterized=True)
    ax.set_aspect("auto")
    ax.margins(0.03)


def pptrain(fig):
    """pptrain NCA rollout (steps 0, 8, 16, 24) as stacked layers, step 0 at the bottom."""
    d = load("pptrain")
    pal = ["#17132A", "#3F21B6", "#7560D0", "#B4A7E8", "#176B68", "#64A7A2", "#A85B35", "#D59765", "#8E3F67", "#D181A4"]
    ax = fig.add_axes([0, 0, 1, 1])
    _bare(ax)
    asp = fig.get_figwidth() / fig.get_figheight()
    ax.set_xlim(0, asp)
    ax.set_ylim(0, 1)
    n = 24
    cell = 0.0146
    ex, ey = np.array([1.0, -0.5]) * cell, np.array([1.0, 0.5]) * cell  # isometric axes
    frames = d["frames"]
    width = n * (ex + ey)  # extent of one layer
    step = np.array([0.0, 0.17])  # upper layers rise
    origin = np.array([(asp - width[0]) / 2, (1 - (n * 2 * 0.5 * cell + step[1] * 3)) / 2 + n * 0.5 * cell])
    for k in range(len(frames)):  # bottom (step 0) first; upper layers occlude
        f = np.array(frames[k])
        ox = origin + step * k
        polys, cols = [], []
        for i in range(n):
            for j in range(n):
                p0 = ox + j * ex + (n - 1 - i) * ey
                polys.append([p0, p0 + ex, p0 + ex + ey, p0 + ey])
                cols.append(pal[f[i, j]])
        z = 10 + k
        ax.add_collection(PolyCollection(polys, facecolors=cols, edgecolors=cols, linewidths=0.25, zorder=z, rasterized=True))
        corner = np.array([ox, ox + n * ex, ox + n * ex + n * ey, ox + n * ey, ox])
        ax.plot(*corner.T, color=PAPER, lw=3, zorder=z + 0.1, solid_joinstyle="miter")
        tip = ox + n * ex + n * ey
        ax.text(tip[0] + 0.02, tip[1], f"step {d['steps'][k]}", fontsize=_pt(SMALL + 1), color=MUTED,
                va="center", ha="left", zorder=30)


# --- research updates (cards) ----------------------------------------------


def _card_axes(fig):
    ax = fig.add_axes([0, 0, 1, 1])
    _bare(ax)
    return ax


def _ema(y, a=0.6):
    out, m = [], y[0]
    for v in y:
        m = a * m + (1 - a) * v
        out.append(m)
    return np.array(out)


def prepretraining_card(fig):
    """All 54 downstream training-loss curves of the post's run (6 curricula x
    3 seeds): synthetic initialization (violet), random initialization (grey),
    natural-text warmup (ink). Log step axis, loss zoomed to 5.35-8.4,
    exponential moving average 0.6 as in TensorBoard's default smoothing."""
    d = load("prepretraining-not-ready-yet")["curves"]
    ax = _card_axes(fig)
    style = {"scratch": (GREY, 2.6, 0.9), "nlp_prepretraining": (INK, 1.8, 0.92), "transferred": (BRAND, 3.4, 0.95)}
    for variant in ("scratch", "nlp_prepretraining", "transferred"):
        for c in d:
            if c["variant"] != variant:
                continue
            col, lw, a = style[variant]
            ax.plot(np.log(c["step"]), _ema(np.array(c["loss"])), color=col, lw=lw, alpha=a,
                    solid_capstyle="round", solid_joinstyle="round")
    ax.set_xlim(np.log(60), np.log(1760))
    ax.set_ylim(5.35, 8.4)


def irregular_parameter_sharing_card(fig):
    """Two string diagrams of the 256 MLP positions (16 layers x 16 width
    chunks, placed around a circle layer by layer). Each of the 128 shared
    blocks is a curve between the two positions it serves. Left: balanced
    random sharing (layout of seed 0, grey). Right: cycle-width sharing, the
    lowest validation CE in the post (violet, tint encodes the layer)."""
    d = load("irregular-parameter-sharing")["schedules"]
    ax = _card_axes(fig)
    asp = fig.get_figwidth() / fig.get_figheight()
    ax.set_xlim(0, asp)
    ax.set_ylim(0, 1)
    n = 16
    R = 0.375
    gap = 0.12  # radians between layers
    theta = np.array([[np.pi / 2 - (l * (2 * np.pi) / n + gap / 2 + c * (2 * np.pi / n - gap) / (n - 1))
                       for c in range(n)] for l in range(n)])
    t = np.linspace(0, 1, 36)[:, None]

    def curves(sch, center, pull):
        a = np.array(sch)
        groups = {}
        for l in range(n):
            for c in range(n):
                groups.setdefault(int(a[l, c]), []).append((l, c))
        out = []
        for (l0, c0), (l1, c1) in (v for v in groups.values() if len(v) == 2):
            P = center + R * np.array([np.cos(theta[l0, c0]), np.sin(theta[l0, c0])])
            Q = center + R * np.array([np.cos(theta[l1, c1]), np.sin(theta[l1, c1])])
            C = center + pull * ((P + Q) / 2 - center)  # control point pulled towards the centre
            out.append(((1 - t) ** 2 * P + 2 * (1 - t) * t * C + t ** 2 * Q, l0))
        return out

    left, right = np.array([asp * 0.265, 0.5]), np.array([asp * 0.735, 0.5])
    for centre, key in ((left, "random_20000"), (right, "width_cycle_tied")):
        cs = curves(d[key], centre, 0.15 if key.startswith("random") else 0.55)
        if key.startswith("random"):
            ax.add_collection(LineCollection([c for c, _ in cs], colors=[GREY], linewidths=1.5, alpha=0.85, capstyle="round"))
        else:
            ax.add_collection(LineCollection([c for c, _ in cs], colors=[_mix(BRAND_LIGHT, BRAND, l / (n - 1)) for _, l in cs],
                                             linewidths=2.4, alpha=0.95, capstyle="round"))
        pts = centre + R * np.stack([np.cos(theta), np.sin(theta)], -1).reshape(-1, 2)
        ax.scatter(pts[:, 0], pts[:, 1], s=9, c=INK, lw=0, zorder=5)


def _closed_spline(p, k=14, alpha=0.5):
    """Closed centripetal Catmull-Rom curve through every point of p (no
    overshoot loops between close points)."""
    n = len(p)
    out = []
    for i in range(n):
        P = [p[(i + j) % n] for j in (-1, 0, 1, 2)]
        t = [0.0]
        for a, b in zip(P[:-1], P[1:]):
            t.append(t[-1] + max(np.linalg.norm(b - a), 1e-9) ** alpha)
        u = np.linspace(t[1], t[2], k, endpoint=False)[:, None]
        A1 = (t[1] - u) / (t[1] - t[0]) * P[0] + (u - t[0]) / (t[1] - t[0]) * P[1]
        A2 = (t[2] - u) / (t[2] - t[1]) * P[1] + (u - t[1]) / (t[2] - t[1]) * P[2]
        A3 = (t[3] - u) / (t[3] - t[2]) * P[2] + (u - t[2]) / (t[3] - t[2]) * P[3]
        B1 = (t[2] - u) / (t[2] - t[0]) * A1 + (u - t[0]) / (t[2] - t[0]) * A2
        B2 = (t[3] - u) / (t[3] - t[1]) * A2 + (u - t[1]) / (t[3] - t[1]) * A3
        out.append((t[2] - u) / (t[2] - t[1]) * B1 + (u - t[1]) / (t[2] - t[1]) * B2)
    out = np.vstack(out)
    return np.vstack([out, out[:1]])


def axosim_fly_geometry_card(fig):
    """Learned motion subspace of the simulated fly visual circuit (2-d UMAP of
    the update's figure): for each of the 60 analysed images, one closed curve
    through its 12 motion responses in the order of motion direction. Tint
    follows image order; three random images are drawn in ink."""
    d = load("axosim-fly-geometry")["images"]
    ax = _card_axes(fig)
    rng = np.random.default_rng(3)
    ink = set(rng.choice(len(d), 3, replace=False).tolist())
    for i, im in enumerate(d):
        p = np.array(im[FLY_SPACE])
        q = _closed_spline(p)
        if i in ink:
            continue
        col = _mix(BRAND_LIGHT, BRAND, i / (len(d) - 1))
        ax.plot(q[:, 0], q[:, 1], color=col, lw=1.6, alpha=0.75, solid_joinstyle="round", solid_capstyle="round")
    for i in sorted(ink):
        q = _closed_spline(np.array(d[i][FLY_SPACE]))
        ax.plot(q[:, 0], q[:, 1], color=INK, lw=2.4, alpha=0.95, solid_joinstyle="round")
    ax.set_aspect("equal", adjustable="datalim")
    ax.margins(0.04)


FLY_SPACE = "umap2d"
