from build123d import *
from common import Scene, cut_open, is_cut_face

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)
depth = 6

with BuildPart() as part:
    Box(50, 34, 10, align=low)
    with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):     # sketch on the top face
        RectangleRounded(30, 18, 3)
    extrude(amount=-depth, mode=Mode.SUBTRACT)              # cut down, but not through
# [/snippet]


def pocket(face):
    c = face.center()
    return abs(c.X) < 15.1 and abs(c.Y) < 9.1 and 3.9 < c.Z < 9.9


whole = scene.state("Pocket")
whole.solid(part.part, accent=pocket)
whole.label((0, -9, 10), "any outline you sketch", "b")

inside = scene.state("Cut open")
inside.solid(cut_open(part.part), section=is_cut_face, accent=pocket)
inside.line((-15, 0, 10), (-15, 0, 4), role="accent")
inside.label((-15, 0, 7), "6 mm deep", "l")
inside.label((8, 0, 2), "floor: 4 mm left", "b")

module = Pos(0, 0, 4) * Box(29.4, 17.4, 5, align=low)
filled = scene.state("In use")
filled.solid(cut_open(part.part), section=is_cut_face, accent=pocket)
filled.solid(module, role="mate")
filled.label((10, -8.7, 9), "a module sits in the pocket", "r")
scene.save(thumb=0)
