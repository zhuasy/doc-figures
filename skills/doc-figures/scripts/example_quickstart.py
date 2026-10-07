"""One readable timing figure. Run with: uv run --with matplotlib python example_quickstart.py /tmp/out"""

import sys
from pathlib import Path

from matplotlib.patches import Rectangle

sys.path.insert(0, str(Path(__file__).parent))
from docfigs import BODY, HILITE_TEXT, INK, TEAL, WAIT, figure, save, tint

out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
out.mkdir(parents=True, exist_ok=True)
example = {"ready": 0, "started": 2, "finished": 7}
wait = example["started"] - example["ready"]
work = example["finished"] - example["started"]
elapsed = example["finished"] - example["ready"]
assert wait >= 0 and work >= 0 and wait + work == elapsed

height = 3.1
fig = figure(
    height,
    f"From ready to finished: {wait} s waiting, {work} s working",
    "Illustrative example. Hatching marks the wait before work begins.",
)
fig.set_size_inches(9, height)
ax = fig.add_axes([0.06, 0.22, 0.88, 0.4])
ax.set(xlim=(example["ready"], example["finished"]), ylim=(0, 1))
ax.axis("off")

ax.add_patch(Rectangle((example["ready"], 0.25), wait, 0.48,
                       facecolor=WAIT["color"], edgecolor=WAIT["edge"], hatch=WAIT["hatch"]))
ax.add_patch(Rectangle((example["started"], 0.25), work, 0.48,
                       facecolor=tint(TEAL), edgecolor=TEAL))
ax.text(example["ready"] + wait / 2, 0.49, f"Wait · {wait} s",
        ha="center", va="center", fontsize=12, weight="bold", color=INK)
ax.text(example["started"] + work / 2, 0.49, f"Work · {work} s",
        ha="center", va="center", fontsize=12, weight="bold", color=INK)
for time, label, align in [
    (example["ready"], "Ready", "left"),
    (example["started"], "Started", "center"),
    (example["finished"], "Finished", "right"),
]:
    ax.text(time, 0.04, f"{label} · {time} s", ha=align, fontsize=11, color=BODY)
fig.text(0.06, 0.07, f"Elapsed time: {wait} + {work} = {elapsed} seconds",
         fontsize=12, color=HILITE_TEXT)
save(fig, out / "timeline.png")
