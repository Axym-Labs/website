"""Copy the numbers each cover plots from the project repositories into data/.

The renderer (build.py) reads only data/*.json, so covers rebuild without the
project repositories or their dependencies. Rerun this script when a project's
results change. It needs numpy, scikit-learn (TeReL embedding) and the project
repositories under $WORKSPACE (default ~/main/workspace); the TeReL venv has
everything:

    ~/main/workspace/TeReL/.venv/bin/python scripts/covers/extract_data.py [name ...]

Every function states the file it reads. Nothing here creates values: curves,
points and matrices are copied (rounded) or recomputed with the project's own
code and settings.
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
WS = Path(os.environ.get("WORKSPACE", Path.home() / "main" / "workspace"))


def _save(name: str, payload: dict) -> None:
    DATA.mkdir(exist_ok=True)
    path = DATA / f"{name}.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"wrote {path.relative_to(HERE.parent.parent)} ({path.stat().st_size / 1024:.0f} KB)")


def _r(values, digits=4):
    return [round(float(v), digits) for v in np.asarray(values).ravel()]


# --- research updates -------------------------------------------------------


def prepretraining() -> None:
    """Downstream training-loss curves of the 12k-context Pythia-410M proxy run
    behind "Prepretraining is not ready yet" (6 curricula x 3 seeds x 3 inits)."""
    run = WS / "pptrain/internal/runs/paper_proxy_pythia410m_12k_20260703_1552/replication_results.json"
    d = json.loads(run.read_text())
    curves = []
    for task, block in d["tasks"].items():
        for seed_run in block["seed_runs"]:
            for variant, v in seed_run["variants"].items():
                if variant not in ("scratch", "transferred", "nlp_prepretraining"):
                    continue  # the post's table compares exactly these three
                hist = [h for h in v["log_history"] if "loss" in h and "step" in h]
                curves.append(
                    {
                        "task": task,
                        "seed": seed_run["seed"],
                        "variant": variant,  # scratch | transferred | nlp_prepretraining
                        "step": [int(h["step"]) for h in hist],
                        "loss": _r([h["loss"] for h in hist], 4),
                        "eval_loss": round(float(v["metrics"]["eval_loss"]), 4),
                    }
                )
    _save("prepretraining-not-ready-yet", {"source": str(run.relative_to(WS)), "curves": curves})


def irregular_parameter_sharing() -> None:
    """Block assignments a(layer, chunk) of the final runs (16 layers x 16 chunks,
    128 blocks), recomputed with the project's schedule functions, plus the
    final validation CE per variant and seed from runs.csv."""
    # The module imports tokenizer/data packages the schedules do not need, so
    # execute only its schedule functions, verbatim, from the source file.
    import ast
    import math
    import random
    import types

    import torch

    src_path = WS / "irregular-parameter-sharing/src/irregular_parameter_sharing/hard_block_lm.py"
    tree = ast.parse(src_path.read_text())
    funcs = [n for n in tree.body if isinstance(n, ast.FunctionDef) and ("schedule" in n.name or n.name.endswith("_count") or n.name == "all_positions")]
    hb = types.SimpleNamespace()
    ns = {"torch": torch, "random": random, "math": math, "__builtins__": __builtins__}
    exec(compile(ast.Module(body=funcs, type_ignores=[]), str(src_path), "exec"), ns)
    for n in funcs:
        setattr(hb, n.name, ns[n.name])

    depth, chunks, blocks = 16, 16, 128
    schedules = {
        "width_cycle_tied": hb.cycle_width_tied_schedule(depth, chunks, blocks),
        "width_sequence_tied": hb.sequence_width_tied_schedule(depth, chunks, blocks),
        "cycle_tied": hb.cycle_depth_tied_schedule(depth, chunks, blocks),
        "sequence_tied": hb.sequence_depth_tied_schedule(depth, chunks, blocks),
        "diagonal_tied": hb.diagonal_depth_width_schedule(depth, chunks, blocks),
        "max_distance": hb.max_depth_distance_schedule(depth, chunks, blocks),
        # final runs used layout seeds 20000-20002 (runs.csv); seed 0's layout:
        "random_20000": hb.balanced_random_schedule(depth, chunks, blocks, 20000),
    }
    runs_csv = WS / "irregular-parameter-sharing/runs/hard_block_100m_d16_w1024_c16_b128_axis_matched_baselines/runs.csv"
    rows = list(csv.DictReader(runs_csv.open()))
    _save(
        "irregular-parameter-sharing",
        {
            "source": "src/irregular_parameter_sharing/hard_block_lm.py; " + str(runs_csv.relative_to(WS)),
            "schedules": {k: v.tolist() for k, v in schedules.items()},
            "val_ce": [
                {"variant": r["variant_base"], "seed": int(r["seed"]), "val_loss": round(float(r["val_loss"]), 4)}
                for r in rows
            ],
        },
    )


def axosim_fly_geometry() -> None:
    """Learned 10-d motion subspace of the simulated fly visual circuit
    (analysis.npz): 60 images x 12 motion directions. Stores the 3-d linear
    projection and the 2-d UMAP, grouped per image in direction order."""
    path = WS / "axosim-demo/data/natural_geometry/analysis.npz"
    d = np.load(path)
    img = d["analysis_image_index"]
    deg = d["analysis_direction_degrees"]
    out = []
    for i in np.unique(img):
        sel = np.where(img == i)[0]
        sel = sel[np.argsort(deg[sel])]
        out.append(
            {
                "image": int(i),
                "test": bool(d["test_mask"][sel].all()),
                "deg": _r(deg[sel], 1),
                "linear3d": [_r(p, 4) for p in d["learned_linear_3d"][sel]],
                "umap2d": [_r(p, 4) for p in d["learned_umap_2d"][sel]],
            }
        )
    _save("axosim-fly-geometry", {"source": str(path.relative_to(WS)), "images": out})


# --- papers and products ----------------------------------------------------


def axosim() -> None:
    """Normalized radar radii of the AxoSim central comparison figure."""
    path = WS / "AxoSim-paper/data/central-figure-values.csv"
    rows = list(csv.DictReader(path.open()))
    axes = ["inference", "voltage_fidelity", "subthreshold_fidelity", "mean_f1", "history"]
    _save(
        "axosim",
        {
            "source": str(path.relative_to(WS)),
            "axes": axes,
            "series": {r["series"]: [round(float(r[f"{a}_radius"]), 4) for a in axes] for r in rows},
        },
    )


def axobench() -> None:
    """Panel A of the AxoBench error-anatomy figure (AxoSim-GRU Medium): the
    spike-triggered soma voltage of teacher and model around hit, missed and
    false spikes. Read back from the published vector figure, whose polylines
    are the plotted values; tick labels give the data coordinates."""
    path = WS / "axo-website/public/figures/error-anatomy-gru-medium.svg"
    s = path.read_text()
    block = s[s.find('id="axes_1"') : s.find('id="axes_2"')]

    def ticks(kind):
        out = []
        for g in block.split(f'<g id="{kind}tick_')[1:]:
            pos = re.search(r'<use xlink:href="#[^"]+" x="([-\d.]+)" y="([-\d.]+)"', g)
            lab = re.search(r"<!-- ([^>]+?) -->", g)
            if pos and lab:
                try:
                    out.append((float(pos.group(1)), float(pos.group(2)), float(lab.group(1).replace("\u2212", "-"))))
                except ValueError:
                    pass
        return out

    xt, yt = ticks("x"), ticks("y")
    ax_ = np.polyfit([t[0] for t in xt], [t[2] for t in xt], 1)
    ay_ = np.polyfit([t[1] for t in yt], [t[2] for t in yt], 1)
    styles = {
        "fill: none; stroke: #111111; stroke-width: 1.2; stroke-linecap: square": "teacher_hit",
        "fill: none; stroke: #0072b2; stroke-width: 1.2; stroke-linecap: square": "model_hit",
        "fill: none; stroke-dasharray: 4.44,1.92; stroke-dashoffset: 0; stroke: #111111; stroke-width: 1.2": "teacher_missed",
        "fill: none; stroke-dasharray: 4.44,1.92; stroke-dashoffset: 0; stroke: #e69f00; stroke-width: 1.2": "model_missed",
        "fill: none; stroke-dasharray: 1.2,1.98; stroke-dashoffset: 0; stroke: #cc79a7; stroke-width: 1.2": "model_false",
    }
    series = {}
    for m in re.finditer(r'<path d="([^"]+)"[^>]*style="([^"]+)"', block):
        name = styles.get(m.group(2))
        if not name or name in series or len(m.group(1)) < 300:
            continue
        pts = np.array([[float(a), float(b)] for a, b in re.findall(r"([-\d.]+) ([-\d.]+)", m.group(1))])
        series[name] = {"t_ms": _r(np.polyval(ax_, pts[:, 0]), 3), "v_mv": _r(np.polyval(ay_, pts[:, 1]), 3)}
    assert set(series) == set(styles.values()), series.keys()
    _save("axobench", {"source": str(path.relative_to(WS)), "series": series})


def axo() -> None:
    """Population run of frozen pretrained AxoSim neurons substituted into the
    full FlyVis visual circuit (45,669 neurons; axosim-demo vision_axosim.py):
    central-cell response of each of the 65 cell types to a moving ON edge
    (angle 0, intensity 1), over the recorded 2.42 s."""
    path = WS / "axosim-demo/data/vision_axosim/selected-responses.npz"
    d = np.load(path)
    k = int(np.flatnonzero((d["angles"] == 0) & (d["intensities"] == 1))[0])
    _save(
        "axo",
        {
            "source": str(path.relative_to(WS)) + f" (axosim[{k}]: angle 0, intensity 1)",
            "time_s": _r(d["time"], 3),
            "cell_types": [str(c) for c in d["cell_types"]],
            "response": [_r(row, 4) for row in d["axosim"][k].T],  # one row per cell type
        },
    )


def hierarchical_data_hypothesis() -> None:
    """The nested-distribution landscape of the paper's original lead figure, computed
    with lead_hypotheses.py's own component definitions."""
    sys.path.insert(0, str(WS / "recursive-manifolds-paper/paper/figures"))
    import lead_hypotheses as lh

    xx, yy = np.meshgrid(np.linspace(-2.6, 2.6, 104), np.linspace(-2.05, 2.05, 84))
    comps = lh._recursive_components(xx, yy)
    dens = comps.sum(0)
    dens = dens / dens.max()
    resp = comps[4:].sum(0) / np.maximum(comps.sum(0), 1e-12)  # share of the AXYM-coloured half
    _save(
        "hierarchical-data-hypothesis",
        {
            "source": "recursive-manifolds-paper/paper/figures/lead_hypotheses.py",
            "x": _r(xx[0], 4),
            "y": _r(yy[:, 0], 4),
            "density": [_r(r, 4) for r in dens],
            "share_dark": [_r(r, 3) for r in resp],
        },
    )


def kpsa() -> None:
    """Circuit mass across transformer depth for 12 held-out inputs (Fig.
    application2_circuits, panels A Vision and B Forecasting), parsed from the
    generated pgfplots source (colour intensity in percent)."""
    path = WS / "kpsa-paper/figures/application2_circuits.tex"
    s = path.read_text()
    panels = {}
    parts = s.split("\\nextgroupplot")
    for name, part in zip(["vision", "forecasting"], parts[1:3]):
        m = np.zeros((12, 12))
        for pct, x0, y0 in re.findall(r"KPSASemantic!(\d+)!white\] \(axis cs:([\d.]+),([\d.]+)\)", part):
            m[int(float(y0) + 0.5) - 1, int(float(x0) + 0.5) - 1] = int(pct) / 100
        panels[name] = m.round(2).tolist()
    _save("kpsa", {"source": str(path.relative_to(WS)), "rows": "input", "cols": "block", "panels": panels})


def terel() -> None:
    """2-d Laplacian eigenmap of TeReL's MNIST representations, with the
    settings of terel-paper/figures/representation-geometry.py."""
    from sklearn.manifold import SpectralEmbedding
    from sklearn.preprocessing import normalize

    path = WS / "terel-paper/figures/mnist-visual-evidence.npz"
    v = np.load(path)
    x = normalize(v["geometry_representations"].astype(np.float64))
    y = v["geometry_labels"].astype(int)
    e = SpectralEmbedding(
        n_components=2, affinity="nearest_neighbors", n_neighbors=20,
        eigen_solver="arpack", random_state=1701, n_jobs=-1,
    ).fit_transform(x)
    _save("terel", {"source": str(path.relative_to(WS)), "xy": [_r(p, 5) for p in e], "label": y.tolist()})


def pptrain() -> None:
    """The NCA rollout of the pptrain page (seed 7, docs/figures/plot_nca_rollout.py
    settings), produced by pptrain's own generator."""
    import importlib.util

    # Load the generator module alone; the package __init__ pulls in transformers.
    spec = importlib.util.spec_from_file_location("nca_generator", WS / "pptrain/src/pptrain/tasks/nca/generator.py")
    gen = importlib.util.module_from_spec(spec)
    sys.modules["nca_generator"] = gen
    spec.loader.exec_module(gen)
    rollout_rule, sample_rule = gen.rollout_rule, gen.sample_rule

    rng = np.random.default_rng(7)
    rule = sample_rule(rng, num_states=10, hidden_dim=16, perception_dim=4)
    frames = rollout_rule(
        rng=rng, rule=rule, grid_size=24, num_states=10, frame_count=4,
        rollout_stride=8, init_rollout_steps=0, identity_bias=0.0, temperature=1e-4,
    )
    _save("pptrain", {"source": "pptrain docs/figures/plot_nca_rollout.py (seed 7)", "steps": [0, 8, 16, 24],
                      "frames": [np.asarray(f).astype(int).tolist() for f in frames]})


def axosim_connectome_demo() -> None:
    """The interactive demo's own assets (public/demo/connectome): the reference
    state cloud in the demo's 3-d embedding (every 10th of 26,093 states) and the
    population trajectory of each preset video, smoothed with a 25-block moving
    average (the demo also smooths its displayed path) and kept every 5th block."""
    demo = HERE.parent.parent / "public" / "demo" / "connectome"
    layout = json.loads((demo / "state-cloud.json").read_text())
    raw = (demo / "state-cloud.bin").read_bytes()
    entry = layout["coords"]
    n = int(np.prod(entry["shape"]))
    coords = np.frombuffer(raw, dtype=np.float32, count=n, offset=entry["offset"]).reshape(entry["shape"])
    presets = json.loads((demo / "videos" / "presets.json").read_text())
    paths = {}
    for preset in presets:
        path = np.fromfile(demo / "videos" / f"{preset['id']}.path.bin", dtype=np.float32).reshape(-1, 3)
        kernel = np.ones(25) / 25
        smooth = np.stack([np.convolve(np.pad(path[:, k], 12, mode="edge"), kernel, mode="valid") for k in range(3)], 1)
        paths[preset["id"]] = _r(smooth[::5], 3)
    _save("axosim-connectome-demo", {"source": "public/demo/connectome state-cloud and videos/*.path.bin",
                                      "cloud": _r(coords[::10], 3), "paths": paths})


JOBS = {
    "prepretraining-not-ready-yet": prepretraining,
    "irregular-parameter-sharing": irregular_parameter_sharing,
    "axosim-fly-geometry": axosim_fly_geometry,
    "axosim": axosim,
    "axobench": axobench,
    "axo": axo,
    "hierarchical-data-hypothesis": hierarchical_data_hypothesis,
    "kpsa": kpsa,
    "terel": terel,
    "pptrain": pptrain,
    "axosim-connectome-demo": axosim_connectome_demo,
}

if __name__ == "__main__":
    for name in sys.argv[1:] or JOBS:
        JOBS[name]()
