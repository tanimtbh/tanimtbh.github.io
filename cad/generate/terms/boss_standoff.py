from build123d import *
from common import Scene, is_flat
from hardware import cap_screw

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as base:
    Box(48, 36, 2, align=low)                        # the floor of the case
    with Locations((0, 0, 2)):
        with GridLocations(36, 24, 2, 2):            # where the board's holes are
            Cylinder(radius=3, height=5, align=low)  # four bosses, 5 mm tall
    with Locations((0, 0, 7)):
        with GridLocations(36, 24, 2, 2):
            Hole(radius=1.05, depth=5)               # M2.5 screw threads in
# [/snippet]


def boss(face):
    return face.center().Z > 2.01


board = Pos(0, 0, 7) * Box(42, 30, 1.6, align=low)
for x in (-18, 18):
    for y in (-12, 12):
        board -= Pos(x, y, 7) * Cylinder(1.45, 1.6, align=low)

bare = scene.state("Bosses")
bare.solid(base.part, accent=boss)
bare.label((-18, 12, 7), "boss with a screw hole", "t")
bare.line((21.5, -12, 2), (21.5, -12, 7), role="accent")
bare.label((21.5, -12, 4.5), "height 5 mm", "r")

fitted = scene.state("Board fitted")
fitted.solid(base.part, accent=boss)
fitted.solid(board, role="mate")
for x in (-18, 18):
    for y in (-12, 12):
        fitted.solid(Pos(x, y, 8.6) * cap_screw("M2.5", 5), role="steel")
fitted.label((0, -15, 7.8), "circuit board", "b")
scene.save(thumb=0)
