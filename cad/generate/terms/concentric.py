from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(36, 36, 4, align=low)
    with Locations((0, 0, 4)):
        Cylinder(radius=11, height=9, align=low)     # boss
    with Locations((0, 0, 13)):
        Hole(radius=5)                               # same centre as the boss
# [/snippet]

with BuildPart() as off:
    Box(36, 36, 4, align=low)
    with Locations((0, 0, 4)):
        Cylinder(radius=11, height=9, align=low)
    with Locations((3.5, 0, 13)):
        Hole(radius=5)


def round_face(face):
    return not is_flat(face)


good = scene.state("Concentric")
good.solid(part.part, accent=round_face)
good.line((0, 0, -6), (0, 0, 24), role="accent")
good.label((0, 0, 24), "one shared axis", "r")
good.label((11, 0, 13), "even wall all round", "r")

bad = scene.state("Not concentric")
bad.solid(off.part, accent=round_face)
bad.line((0, 0, -6), (0, 0, 24), role="dash")
bad.line((3.5, 0, -6), (3.5, 0, 24), role="accent")
bad.label((0, 0, 24), "boss axis", "l")
bad.label((3.5, 0, 21), "hole axis, 3.5 mm off", "r")
bad.label((11, 0, 13), "thin wall on this side", "r")
scene.save(thumb=0)
