from build123d import *
from common import Scene
from hardware import cap_screw

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as base:
    Box(44, 32, 14, align=low)
    offset(amount=-2, openings=base.faces().sort_by(Axis.Z)[-1])
    with Locations((0, 0, 2)), GridLocations(34, 22, 2, 2):
        Cylinder(radius=3, height=12, align=low)            # corner posts
    with Locations((0, 0, 14)), GridLocations(34, 22, 2, 2):
        Hole(radius=1.25, depth=8)

with BuildPart() as lid:
    Box(44, 32, 2, align=low)
    with Locations((0, 0, 2)), GridLocations(34, 22, 2, 2):
        Hole(radius=1.7)

gap = 14                                        # how far to pull the parts apart
lid_placed = Pos(0, 0, 14) * lid.part           # where the lid really sits
lid_exploded = Pos(0, 0, 14 + gap) * lid.part   # moved along Z, the way it goes on
# [/snippet]

corners = [(x, y) for x in (-17, 17) for y in (-11, 11)]

shut = scene.state("Assembled")
shut.solid(base.part, fine=False)
shut.solid(lid_placed, role="mate", fine=False)
for x, y in corners:
    shut.solid(Pos(x, y, 16) * cap_screw("M3", 8), role="steel")
shut.label((22, 0, 15), "the inside is hidden", "r")

apart = scene.state("Exploded")
apart.solid(base.part, fine=False)
apart.solid(lid_exploded, role="mate", fine=False)
for x, y in corners:
    apart.solid(Pos(x, y, 16 + 2 * gap + 8) * cap_screw("M3", 8), role="steel")
    apart.line((x, y, 14), (x, y, 16 + 2 * gap), role="dash")
apart.label((22, 0, 15 + gap), "lid", "r")
apart.label((17, -11, 20 + 2 * gap + 8), "4 screws", "r")
apart.label((22, 0, 7), "base", "r")
apart.label((-17, -11, 16 + gap * 1.5), "assembly path", "l")
scene.save(thumb=1)
