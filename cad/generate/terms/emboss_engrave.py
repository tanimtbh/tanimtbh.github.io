from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
depth = 0.8
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as raised:
    Box(44, 20, 3, align=low)
    with BuildSketch(Plane.XY.offset(3)):               # on the top face
        Text("ON", font_size=14)
    extrude(amount=depth)                               # emboss: adds material

with BuildPart() as sunk:
    Box(44, 20, 3, align=low)
    with BuildSketch(Plane.XY.offset(3)):
        Text("ON", font_size=14)
    extrude(amount=-depth, mode=Mode.SUBTRACT)          # engrave: cuts material
# [/snippet]


def cut_in(face):
    c = face.center()
    return 0.01 < c.Z < 2.99 and abs(c.X) < 20 and abs(c.Y) < 9


up = scene.state("Embossed")
up.solid(raised.part, accent=lambda f: f.center().Z > 3.01, fine=False)
up.label((12.5, 0, 3.8), "raised 0.8 mm", "r")

down = scene.state("Engraved")
down.solid(sunk.part, accent=cut_in, fine=False)
down.label((12.5, 0, 3), "sunk 0.8 mm", "r")
scene.save(thumb=0)
