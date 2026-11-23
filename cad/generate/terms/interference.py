from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    Box(44, 32, 12, align=low)
    offset(amount=-2, openings=case.faces().sort_by(Axis.Z)[-1])

board = Pos(3, 0, 4) * Box(38, 24, 1.6, align=low)      # placed 3 mm too far to the right

overlap = case.part & board                             # the volume both parts claim
print(f"{overlap.volume:.1f} mm³")                      # 76.8 mm³: the board is inside the wall

moved = Pos(0, 0, 4) * Box(38, 24, 1.6, align=low)
print(f"{(case.part & moved).volume:.1f} mm³")          # 0.0 mm³: the parts are clear
# [/snippet]

bad = scene.state("Overlap found")
bad.solid(case.part - overlap)
bad.solid(board - overlap, role="mate")
bad.solid(overlap, role="clash")
bad.label((22, 0, 4.8), "overlap: 76.8 mm³", "b")

good = scene.state("Clear")
good.solid(case.part)
good.solid(moved, role="mate")
good.label((19, -12, 5.6), "0 mm³ overlap: 1 mm gap", "b")
scene.save(thumb=0)
