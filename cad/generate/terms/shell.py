from build123d import *
from common import Scene, cut_open, is_cut_face

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(50, 36, 22)
    top = part.faces().sort_by(Axis.Z)[-1]
    offset(amount=-2, openings=top)    # 2 mm walls, top left open
# [/snippet]


def inside(face):
    c = face.center()
    return abs(c.X) < 24 and abs(c.Y) < 17 and -10 < c.Z < 10.5


scene.state("Solid").solid(Box(50, 36, 22), accent=lambda f: f.center().Z > 10.9)
scene.state("Shelled").solid(part.part, accent=inside)

cut = scene.state("Cut open")
cut.solid(cut_open(part.part), section=is_cut_face, accent=inside)
cut.label((24, 0, 2), "wall = 2 mm", "r")
scene.save(thumb=1)
