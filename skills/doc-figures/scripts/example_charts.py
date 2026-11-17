"""A trade-off scatter and a line chart. Run with: uv run --with matplotlib python example_charts.py /tmp/out"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from docfigs import BLUE, MUTED, TEAL, VIOLET, chart_axes, figure, legend, save, scatter

out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
out.mkdir(parents=True, exist_ok=True)

vendors = {"Vendor A": BLUE, "Vendor B": TEAL, "Vendor C": VIOLET}
models = [
    ("A Large", "Vendor A", 15.6, 58), ("A Medium", "Vendor A", 11.4, 56), ("A Small", "Vendor A", 3.1, 49),
    ("B Large", "Vendor B", 7.2, 55), ("B Medium", "Vendor B", 4.4, 52), ("B Small", "Vendor B", 0.4, 40),
    ("C Large", "Vendor C", 12.8, 46), ("C Medium", "Vendor C", 1.5, 52), ("C Small", "Vendor C", 1.3, 41),
]
fig = figure(6.2, "Vendor B and Vendor C give the most score per dollar",
             "Illustrative. Dotted line: the models that no other model beats on both cost and score.")
ax = fig.add_axes([0.07, 0.19, 0.9, 0.64])
scatter(ax, [dict(label=name, x=cost, y=score, color=vendors[vendor]) for name, vendor, cost, score in models],
        xlabel="Cost per task (USD)", ylabel="Benchmark score", xfmt="${:g}", best=(5, 50))
legend(fig, list(vendors.items()))
save(fig, out / "scatter.png")

days = range(1, 8)
series = {"p50": (TEAL, [120, 118, 125, 122, 119, 121, 117]), "p95": (VIOLET, [310, 305, 420, 330, 300, 298, 295])}
fig = figure(4.2, "p95 latency rose on day 3; p50 did not move", "Illustrative. Request latency per day.")
fig.set_size_inches(9, 4.2)
ax = fig.add_axes([0.1, 0.16, 0.8, 0.6])
for name, (color, values) in series.items():
    ax.plot(days, values, color=color, lw=2.2, marker="o", ms=5)
    ax.annotate(name, (days[-1], values[-1]), xytext=(8, 0), textcoords="offset points",
                va="center", fontsize=10.5, fontweight="bold", color=color)
ax.set_ylim(0, 460)
chart_axes(ax, xlabel="Day", ylabel="Latency", yfmt="{:g} ms")
ax.annotate("Deploy", (3, 420), xytext=(0, 10), textcoords="offset points", ha="center", fontsize=10, color=MUTED)
save(fig, out / "lines.png")
