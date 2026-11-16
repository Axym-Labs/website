"""Figures for the research update "Prepretraining is not ready yet".

Data: the three-seed Pythia-410M proxy run of pptrain,
  $PPTRAIN_RUN/replication_results.json
(default: ~/main/workspace/pptrain/internal/runs/paper_proxy_pythia410m_12k_20260703_1552).
Every plotted value is read from that file; nothing is smoothed or interpolated.

Run from the repository root:  python3 scripts/figures/prepretraining_figures.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

import axym_style as st

SLUG = "prepretraining-not-ready-yet"
RUN = Path(
    os.environ.get(
        "PPTRAIN_RUN",
        Path.home() / "main/workspace/pptrain/internal/runs/paper_proxy_pythia410m_12k_20260703_1552",
    )
)

TASKS = [
    ("nca", "NCA"),
    ("lime", "LIME"),
    ("simpler_tasks", "Simpler tasks"),
    ("procedural", "Procedural"),
    ("dyck", "Dyck"),
    ("summarization", "Summarization"),
]
# (key in replication_results.json, label, color, linestyle, z-order)
CONDITIONS = [
    ("scratch", "Random init", st.BASELINE, "-", 2),
    ("nlp_prepretraining", "Text warmup", st.BASELINE_DARK, (0, (4, 2)), 3),
    ("transferred", "Synthetic init", st.METHOD, "-", 4),
]


def load() -> dict:
    with open(RUN / "replication_results.json") as fh:
        return json.load(fh)["tasks"]


def train_curves(task: dict, variant: str) -> tuple[np.ndarray, np.ndarray]:
    """Logged downstream training loss (every 10 steps), one row per seed."""
    rows, steps = [], None
    for seed_run in task["seed_runs"]:
        log = [e for e in seed_run["variants"][variant]["log_history"] if "loss" in e]
        s = np.array([e["step"] for e in log])
        if steps is None:
            steps = s
        assert np.array_equal(steps, s), "seeds logged at different steps"
        rows.append([e["loss"] for e in log])
    return steps, np.array(rows)


def final_eval(task: dict, variant: str) -> np.ndarray:
    return np.array([s["variants"][variant]["metrics"]["eval_loss"] for s in task["seed_runs"]])


def loss_curves(tasks: dict) -> None:
    fig, axes = plt.subplots(2, 3, figsize=(7.2, 4.6), sharex=True)
    for ax, (key, label) in zip(axes.flat, TASKS):
        lows = []
        for variant, _name, color, ls, z in CONDITIONS:
            steps, rows = train_curves(tasks[key], variant)
            mean = rows.mean(axis=0)
            ax.fill_between(steps, rows.min(axis=0), rows.max(axis=0), color=color, alpha=0.18, lw=0, zorder=z)
            ax.plot(steps, mean, color=color, ls=ls, lw=1.5 if variant == "transferred" else 1.3, zorder=z + 1)
            lows.append(rows.min())
        lo = min(lows)
        bottom = np.floor((lo - 0.15) * 2) / 2
        ax.set_ylim(bottom, bottom + 3.0)  # same 3-nat span in every panel
        ax.set_xlim(0, 1764)
        ax.set_xticks([0, 500, 1000, 1500])
        ax.text(0.97, 0.95, label, transform=ax.transAxes, ha="right", va="top", fontsize=9.5, fontweight="bold")
    for ax in axes[:, 0]:
        ax.set_ylabel("Training loss (nats)")
    for ax in axes[1]:
        ax.set_xlabel("Downstream step")
    handles = [Line2D([], [], color=c, ls=ls, lw=1.6) for _k, _n, c, ls, _z in CONDITIONS]
    fig.legend(handles, [n for _k, n, *_ in CONDITIONS], loc="upper left", ncol=3, bbox_to_anchor=(0.06, 1.035),
               handlelength=2.2, columnspacing=1.8)
    fig.tight_layout(rect=(0, 0, 1, 0.965), h_pad=1.2, w_pad=1.0)
    st.save(fig, SLUG, "loss-curves")


def transfer_gaps(tasks: dict) -> None:
    """Percentage gaps in final evaluation loss as stored by the run (per seed, and their mean)."""
    fig, ax = plt.subplots(figsize=(6.4, 3.0))
    refs = [
        ("transfer_gap_percent", "vs. random init", st.METHOD, -0.16),
        ("compute_matched_gap_percent", "vs. text warmup", st.SECONDARY, 0.16),
    ]
    for i, (key, _label) in enumerate(TASKS):
        metrics = tasks[key]["metrics"]
        for metric, _name, color, dy in refs:
            per_seed = np.array(metrics[metric]["values"])
            y = i + dy
            ax.plot([per_seed.min(), per_seed.max()], [y, y], color=color, lw=1.0, alpha=0.45, zorder=2)
            ax.scatter(per_seed, [y] * len(per_seed), s=13, facecolor="white", edgecolor=color, lw=0.9, zorder=3)
            ax.scatter([metrics[metric]["mean"]], [y], s=44, color=color, zorder=4)
    ax.axvline(0, color=st.INK, lw=0.8, zorder=1)
    ax.set_yticks(range(len(TASKS)), [label for _k, label in TASKS])
    ax.set_ylim(len(TASKS) - 0.5, -0.5)
    ax.grid(axis="y", visible=False)
    ax.set_xlim(-34, 4)
    ax.set_xlabel("Lower final evaluation loss with synthetic init (%)")
    handles = [Line2D([], [], marker="o", ls="", color=c, ms=6) for _r, _n, c, _d in refs]
    ax.legend(handles, [n for _r, n, _c, _d in refs], loc="lower left", bbox_to_anchor=(0.0, 1.0), ncol=2,
              handletextpad=0.3, columnspacing=1.6)
    fig.tight_layout()
    st.save(fig, SLUG, "transfer-gaps")


def effective_rank(tasks: dict) -> None:
    fig, ax = plt.subplots(figsize=(6.4, 3.0))
    offsets = {"scratch": -0.2, "nlp_prepretraining": 0.0, "transferred": 0.2}
    for i, (key, _label) in enumerate(TASKS):
        runs = tasks[key]["seed_runs"]
        for variant, _name, color, _ls, z in CONDITIONS:
            vals = np.array([r["diagnostics"]["activation_effective_rank"][variant] for r in runs])
            y = i + offsets[variant]
            ax.scatter(vals, [y] * len(vals), s=12, facecolor="white", edgecolor=color, lw=0.9, zorder=z)
            ax.scatter([vals.mean()], [y], s=40, color=color, zorder=z + 1)
    ax.set_yticks(range(len(TASKS)), [label for _k, label in TASKS])
    ax.set_ylim(len(TASKS) - 0.5, -0.5)
    ax.grid(axis="y", visible=False)
    ax.set_xlim(0, None)
    ax.set_xlabel("Effective rank of middle-layer activations")
    handles = [Line2D([], [], marker="o", ls="", color=c, ms=6) for _k, _n, c, _ls, _z in CONDITIONS]
    ax.legend(handles, [n for _k, n, *_ in CONDITIONS], loc="lower left", bbox_to_anchor=(0.0, 1.0), ncol=3,
              handletextpad=0.3, columnspacing=1.6)
    fig.tight_layout()
    st.save(fig, SLUG, "effective-rank")


def main() -> None:
    st.apply()
    tasks = load()
    loss_curves(tasks)
    transfer_gaps(tasks)
    effective_rank(tasks)


if __name__ == "__main__":
    main()
