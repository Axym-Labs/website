"""Hero background: contour lines of a smooth loss landscape and one
momentum-SGD trajectory into a minimum. Writes public/backgrounds/hero-landscape.svg.

Run: python3 scripts/hero-landscape/make_hero_landscape.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.ndimage import gaussian_filter

W, H = 1200, 900
rng = np.random.default_rng(7)

# Smooth random field plus two basins.
n = 300
noise = gaussian_filter(rng.standard_normal((n, n)), 26, mode="wrap")
noise /= np.abs(noise).max()
ys, xs = np.mgrid[0:1:n * 1j, 0:1:n * 1j]
basins = (
    -1.25 * np.exp(-(((xs - 0.62) / 0.16) ** 2 + ((ys - 0.58) / 0.13) ** 2))
    - 0.7 * np.exp(-(((xs - 0.28) / 0.12) ** 2 + ((ys - 0.30) / 0.15) ** 2))
)
field = 0.55 * noise + basins

fig, ax = plt.subplots()
levels = np.linspace(field.min(), field.max(), 34)
cs = ax.contour(xs * W, ys * H, field, levels=levels)
plt.close(fig)

def path_d(vertices):
    pts = vertices[:: 2] if len(vertices) > 40 else vertices
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)

lines = []
for i, segs in enumerate(cs.allsegs):
    for seg in segs:
        if len(seg) < 8:
            continue
        accent = i in (4, 7)
        stroke = "#3F21B6" if accent else "#1d1a2b"
        opacity = 0.6 if accent else 0.2
        width = 1.1 if accent else 0.8
        lines.append(f'<path d="{path_d(seg)}" stroke="{stroke}" stroke-opacity="{opacity}" stroke-width="{width}"/>')

# Momentum gradient descent on the field (in grid coordinates).
gy, gx = np.gradient(field)
def grad(p):
    i = int(np.clip(p[1], 0, n - 1)); j = int(np.clip(p[0], 0, n - 1))
    return np.array([gx[i, j], gy[i, j]])

def descend(start):
    p = np.array(start) * (n - 1); v = np.zeros(2); out = [p.copy()]
    for _ in range(900):
        v = 0.75 * v - 260.0 * grad(p)
        p = np.clip(p + v, 0, n - 1)
        out.append(p.copy())
    return np.array(out)

# Pick the start in the upper right whose trajectory reaches the deep basin
# along the longest path, so the curve crosses many contour lines.
target = np.array([0.62, 0.58]) * (n - 1)
best = None
for sx in np.linspace(0.75, 0.98, 12):
    for sy in np.linspace(0.04, 0.4, 12):
        t = descend((sx, sy))
        if np.linalg.norm(t[-1] - target) > 0.05 * n:
            continue
        length = np.linalg.norm(np.diff(t, axis=0), axis=1).sum()
        if best is None or length > best[0]:
            best = (length, t)
traj = best[1]
# Stop once the iterate has settled.
steps = np.linalg.norm(np.diff(traj, axis=0), axis=1)
traj = traj[: int(np.argmax(np.cumsum(steps) > 0.995 * steps.sum())) + 2]
traj = np.array(traj) * np.array([W / (n - 1), H / (n - 1)])
d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in traj)
dots = "".join(
    f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.2" fill="#fff" stroke="#3F21B6" stroke-width="1.2"/>'
    for x, y in traj[1:][np.r_[0, np.cumsum(np.linalg.norm(np.diff(traj, axis=0), axis=1))][1:] // 38 != np.r_[0, np.cumsum(np.linalg.norm(np.diff(traj, axis=0), axis=1))][:-1] // 38]
)
end = traj[-1]

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke-linecap="round" stroke-linejoin="round">
<g>{"".join(lines)}</g>
<path d="{d}" stroke="#3F21B6" stroke-width="1.4" stroke-dasharray="2 5"/>
{dots}
<circle cx="{end[0]:.1f}" cy="{end[1]:.1f}" r="6" fill="#3F21B6"/>
<circle cx="{end[0]:.1f}" cy="{end[1]:.1f}" r="13" stroke="#3F21B6" stroke-opacity="0.35"/>
</svg>
'''
out = Path(__file__).resolve().parents[2] / "public" / "backgrounds" / "hero-landscape.svg"
out.write_text(svg)
print(out, len(svg) // 1024, "KiB", "end", end)
