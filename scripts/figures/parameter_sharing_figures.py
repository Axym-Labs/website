"""Figures for the research update "Parameter sharing works best across width".

Data: the hard block-sharing runs of Axym-Labs/irregular-parameter-sharing,
  $IPS_REPO/runs/hard_block_100m_d16_w1024_c16_b128_b8ga6_search12/live.jsonl
  $IPS_REPO/runs/hard_block_100m_d16_w1024_c16_b128_b8ga6_search12_seed2_resume/{live.jsonl,result.json}
  $IPS_REPO/runs/hard_block_100m_d16_w1024_c16_b128_axis_matched_baselines/{live.jsonl,result.json}
(default IPS_REPO: ~/main/workspace/irregular-parameter-sharing). Runs are deduplicated
as in docs/hard-block-sharing/artifacts/combine_hard_block_runs.py (the last completed
run per variant and seed wins). The balanced random layout of seed 0 is not stored in
the logs; it is rebuilt with the repository's generator (random.Random(20000).shuffle)
and checked against the logged schedule statistics.

Run from the repository root:  python3 scripts/figures/parameter_sharing_figures.py
"""
from __future__ import annotations

import json
import os
import random
from collections import defaultdict
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.path import Path as MPath
from matplotlib.patches import PathPatch
from matplotlib.lines import Line2D

import axym_style as st

SLUG = "irregular-parameter-sharing"
REPO = Path(os.environ.get("IPS_REPO", Path.home() / "main/workspace/irregular-parameter-sharing"))
RUNS = REPO / "runs"
LOGS = [
    RUNS / "hard_block_100m_d16_w1024_c16_b128_b8ga6_search12/live.jsonl",
    RUNS / "hard_block_100m_d16_w1024_c16_b128_b8ga6_search12_seed2_resume/live.jsonl",
    RUNS / "hard_block_100m_d16_w1024_c16_b128_axis_matched_baselines/live.jsonl",
]
DEPTH, CHUNKS, BLOCKS = 16, 16, 128

NAMES = {
    "unshared": "Unshared dense MLP",
    "sequence_tied": "Sequence depth",
    "cycle_tied": "Cycle depth",
    "width_sequence_tied": "Sequence width",
    "width_cycle_tied": "Cycle width",
    "diagonal_tied": "Diagonal depth-width",
    "random": "Balanced random",
    "max_distance": "Maximum depth distance",
    "best_random": "Best-of-12 random",
}
# The eval events carry the run name, which differs from variant_base for two variants.
RUN_NAME = {"random": "random_avg", "best_random": "best_of_random"}


# ---------------------------------------------------------------- data


def read_runs() -> dict[tuple[str, int], dict]:
    """Completed final runs with their eval curves, deduplicated by (variant, seed)."""
    runs: dict[tuple[str, int], dict] = {}
    for log in LOGS:
        pending: dict[str, list[tuple[int, float]]] = defaultdict(list)
        for line in log.read_text().splitlines():
            if not line.strip():
                continue
            e = json.loads(line)
            if e["event"] == "eval":
                if e["step"] == 500:  # a new run (or a restarted one) begins
                    pending[e["run"]] = []
                pending[e["run"]].append((e["step"], e["val_loss"]))
            elif e["event"] == "final_run_complete":
                curve = pending.pop(e["variant"])
                assert curve[-1][0] == 5000 and abs(curve[-1][1] - e["val_loss"]) < 1e-9
                runs[(e["variant_base"], int(e["seed"]))] = {"curve": np.array(curve), **e}
    return runs


def balanced_random_schedule(seed: int) -> np.ndarray:
    """Pure-Python copy of hard_block_lm.balanced_random_schedule."""
    ids = list(range(BLOCKS)) * 2
    random.Random(seed).shuffle(ids)
    return np.array(ids).reshape(DEPTH, CHUNKS)


def schedule_stats(schedule: np.ndarray) -> dict:
    pos = defaultdict(list)
    for l in range(DEPTH):
        for c in range(CHUNKS):
            pos[int(schedule[l, c])].append((l, c))
    shared = [p for p in pos.values() if len(p) > 1]
    return {
        "mean_depth_span": float(np.mean([max(l for l, _ in p) - min(l for l, _ in p) for p in pos.values()])),
        "mean_chunk_span": float(np.mean([max(c for _, c in p) - min(c for _, c in p) for p in pos.values()])),
        "shared": len(shared),
    }


def load_schedules(runs: dict) -> dict[str, np.ndarray]:
    axis = json.loads((RUNS / "hard_block_100m_d16_w1024_c16_b128_axis_matched_baselines/result.json").read_text())
    resume = json.loads((RUNS / "hard_block_100m_d16_w1024_c16_b128_b8ga6_search12_seed2_resume/result.json").read_text())
    sched = {k: np.array(v) for k, v in axis["schedules"].items() if k in NAMES and k != "best_random"}
    sched["best_random"] = np.array(resume["schedules"]["best_random"])
    rnd = runs[("random", 0)]
    sched["random"] = balanced_random_schedule(int(rnd["layout_seed"]))
    got, want = schedule_stats(sched["random"]), rnd["schedule_stats"]
    assert abs(got["mean_depth_span"] - want["mean_depth_span"]) < 1e-9
    assert abs(got["mean_chunk_span"] - want["mean_chunk_span"]) < 1e-9
    best = runs[("best_random", 0)]["schedule_stats"]
    assert abs(schedule_stats(sched["best_random"])["mean_depth_span"] - best["mean_depth_span"]) < 1e-9
    return sched


def final_losses(runs: dict) -> dict[str, np.ndarray]:
    out = defaultdict(list)
    for (variant, seed), r in sorted(runs.items(), key=lambda kv: kv[0][1]):
        out[variant].append(r["val_loss"])
    return {k: np.array(v) for k, v in out.items()}


# ---------------------------------------------------------------- figures


def draw_links(ax, schedule: np.ndarray) -> tuple[int, int]:
    pos = defaultdict(list)
    for l in range(DEPTH):
        for c in range(CHUNKS):
            pos[int(schedule[l, c])].append((c, l))
    within = across = 0
    for uses in pos.values():
        for (x0, y0), (x1, y1) in zip(uses, uses[1:]):
            same_layer = y0 == y1
            within += same_layer
            across += not same_layer
            dx, dy = x1 - x0, y1 - y0
            length = np.hypot(dx, dy)
            bend = 0.22 if length > 1.5 else 0.0
            cx, cy = (x0 + x1) / 2 - dy * bend, (y0 + y1) / 2 + dx * bend
            color = st.METHOD if same_layer else "#9C9C9C"
            path = MPath([(x0, y0), (cx, cy), (x1, y1)], [MPath.MOVETO, MPath.CURVE3, MPath.CURVE3])
            ax.add_patch(PathPatch(path, fill=False, ec=color, lw=0.8, alpha=0.85 if same_layer else 0.55,
                                   capstyle="round", zorder=2, clip_on=False))
    gx, gy = np.meshgrid(np.arange(CHUNKS), np.arange(DEPTH))
    ax.scatter(gx.ravel(), gy.ravel(), s=2.6, color="#2A2A2A", lw=0, zorder=3)
    return within, across


def topology_gallery(sched: dict, finals: dict) -> None:
    order = sorted(NAMES, key=lambda k: finals[k].mean())
    fig, axes = plt.subplots(3, 3, figsize=(7.0, 7.9))
    for ax, key in zip(axes.flat, order):
        draw_links(ax, sched[key])
        ax.set_xlim(-1.2, CHUNKS + 0.2)
        ax.set_ylim(-1.2, DEPTH + 0.2)
        ax.set_aspect("equal")
        ax.axis("off")
        vals = finals[key]
        ax.set_title(NAMES[key], fontsize=10, fontweight="bold", loc="left", pad=14,
                     color=st.METHOD if key == order[0] else st.INK)
        ax.text(0.0, 1.0, f"Validation CE {vals.mean():.4f} ± {vals.std(ddof=1):.4f}", transform=ax.transAxes,
                fontsize=8.5, color=st.MUTED, va="bottom", ha="left")
    # axis hints on the first panel only
    a0 = axes.flat[0]
    a0.annotate("", xy=(CHUNKS - 0.5, -1.0), xytext=(-0.5, -1.0),
                arrowprops=dict(arrowstyle="-|>", lw=0.6, color=st.MUTED, mutation_scale=6))
    a0.text(CHUNKS / 2 - 0.5, -1.6, "MLP chunk", ha="center", va="top", fontsize=8, color=st.MUTED)
    a0.annotate("", xy=(-1.0, DEPTH - 0.5), xytext=(-1.0, -0.5),
                arrowprops=dict(arrowstyle="-|>", lw=0.6, color=st.MUTED, mutation_scale=6))
    a0.text(-1.6, DEPTH / 2 - 0.5, "Layer", ha="right", va="center", rotation=90, fontsize=8, color=st.MUTED)
    handles = [Line2D([], [], color=st.METHOD, lw=1.4), Line2D([], [], color="#9C9C9C", lw=1.4)]
    fig.legend(handles, ["Tie within one layer", "Tie across layers"], loc="upper left", ncol=2,
               bbox_to_anchor=(0.02, 1.0), handlelength=2.0, columnspacing=2.0)
    fig.tight_layout(rect=(0, 0, 1, 0.965), h_pad=2.2, w_pad=1.6)
    st.save(fig, SLUG, "sharing-topologies")


def delta_curves(runs: dict) -> None:
    """Validation CE minus balanced random (same seed), mean over seeds, at each eval step."""
    seeds = [0, 1, 2]
    steps = runs[("random", 0)]["curve"][:, 0]
    deltas = {}
    for key in NAMES:
        if key == "random":
            continue
        rows = []
        for s in seeds:
            a, b = runs[(key, s)]["curve"], runs[("random", s)]["curve"]
            assert np.array_equal(a[:, 0], b[:, 0])
            rows.append(a[:, 1] - b[:, 1])
        deltas[key] = np.array(rows).mean(axis=0)

    style = {
        "width_cycle_tied": (st.METHOD, 2.0, 5),
        "max_distance": (st.SECONDARY, 1.6, 4),
    }
    fig, ax = plt.subplots(figsize=(6.6, 3.5))
    ax.axhline(0, color=st.INK, lw=0.8, zorder=1)
    ends = []
    for key, d in deltas.items():
        color, lw, z = style.get(key, (st.BASELINE, 1.2, 2))
        ax.plot(steps, d, color=color, lw=lw, zorder=z, marker="o", ms=2.6 if key in style else 2.0)
        ends.append([d[-1], key, color])
    # direct labels, nudged apart vertically
    ends.sort()
    min_gap = 0.0095
    ys = [e[0] for e in ends]
    for i in range(1, len(ys)):
        ys[i] = max(ys[i], ys[i - 1] + min_gap)
    shift = np.mean([e[0] for e in ends]) - np.mean(ys)
    ys = [y + shift for y in ys]
    for (yv, key, color), yl in zip(ends, ys):
        ax.text(5000 + 110, yl, NAMES[key], va="center", fontsize=8.5,
                color=color if color != st.BASELINE else st.MUTED)
    ax.set_xlim(500, 5000)
    ax.set_xticks([500, 1000, 2000, 3000, 4000, 5000])
    ax.set_xlabel("Training step")
    ax.set_ylabel("Val. CE minus balanced random (nats)")
    fig.tight_layout()
    st.save(fig, SLUG, "delta-vs-random-curves")


def final_dots(finals: dict) -> None:
    order = sorted(NAMES, key=lambda k: finals[k].mean())
    fig, ax = plt.subplots(figsize=(6.2, 3.2))
    for i, key in enumerate(order):
        vals = finals[key]
        color = {"width_cycle_tied": st.METHOD, "max_distance": st.SECONDARY, "random": st.INK}.get(key, "#A9A9A9")
        ax.plot([vals.min(), vals.max()], [i, i], color=color, lw=1.0, alpha=0.45, zorder=2)
        ax.scatter(vals, [i] * len(vals), s=14, facecolor="white", edgecolor=color, lw=0.9, zorder=3)
        ax.scatter([vals.mean()], [i], s=44, color=color, zorder=4)
    ax.axvline(finals["random"].mean(), color=st.INK, lw=0.7, ls=(0, (3, 2)), zorder=1)
    ax.set_yticks(range(len(order)), [NAMES[k] for k in order])
    ax.set_ylim(len(order) - 0.5, -0.5)
    ax.grid(axis="y", visible=False)
    ax.set_xlabel("Validation cross-entropy after 5,000 steps (nats)")
    fig.tight_layout()
    st.save(fig, SLUG, "final-validation-ce")


def main() -> None:
    st.apply()
    runs = read_runs()
    assert len(runs) == 27, len(runs)
    sched = load_schedules(runs)
    finals = final_losses(runs)
    for k, v in finals.items():
        print(f"{k:22s} {v.mean():.4f} ± {v.std(ddof=1):.4f}  n={len(v)}")
    topology_gallery(sched, finals)
    delta_curves(runs)
    final_dots(finals)


if __name__ == "__main__":
    main()
