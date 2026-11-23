from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
corner = (Align.MIN, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(40, 26, 4, align=corner)             # base
    Box(4, 26, 30, align=corner)             # wall
    with BuildSketch(Plane.XZ):              # a triangle in the inside corner
        Polygon((4, 4), (28, 4), (4, 24), align=None)
    extrude(amount=1.5, both=True)           # 3 mm thick rib
# [/snippet]

with BuildPart() as plain:
    Box(40, 26, 4, align=corner)
    Box(4, 26, 30, align=corner)


def rib(face):
    c = face.center()
    return abs(c.Y) < 1.6 and 4.5 < c.X < 27 and 4.5 < c.Z < 23


before = scene.state("Without rib")
before.solid(plain.part)
before.arrow((17, 0, 27), (5, 0, 27), width=0.8)
before.label((17, 0, 27), "push here: the wall bends", "r")

after = scene.state("With rib")
after.solid(part.part, accent=rib)
after.label((14, -1.5, 12), "rib (gusset)", "r")
scene.save()
