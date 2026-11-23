from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
corner = (Align.MIN, Align.MIN, Align.MIN)

with BuildPart() as bar_a:                   # runs along X, top half removed at the end
    Box(34, 10, 8, align=corner)
    with Locations((0, 0, 4)):
        Box(10, 10, 4, align=corner, mode=Mode.SUBTRACT)

with BuildPart() as bar_b:                   # runs along Y, bottom half removed at the end
    Box(10, 34, 8, align=corner)
    Box(10, 10, 4, align=corner, mode=Mode.SUBTRACT)
# [/snippet]


def notch(face):
    c = face.center()
    return c.X < 10.01 and c.Y < 10.01 and abs(c.Z - 4) < 2.1 and not (c.X < 0.01 or c.Y < 0.01)


apart = scene.state("Apart")
apart.solid(bar_a.part, accent=notch)
apart.solid(Pos(0, 0, 10) * bar_b.part, role="mate")
apart.label((10, 0, 6), "half the thickness removed", "r")
apart.arrow((5, 28, 26), (5, 28, 19.5), width=0.7)

joined = scene.state("Joined")
joined.solid(bar_a.part)
joined.solid(bar_b.part, role="mate")
joined.label((10, 0, 4), "the two halves overlap", "r")
scene.save(thumb=0)
