from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(38, 18, 12)
    with Locations((-9, 0, 6)):          # on the top face
        Hole(radius=3)                   # through hole: goes all the way
    with Locations((9, 0, 6)):
        Hole(radius=3, depth=7)          # blind hole: stops 7 mm down
# [/snippet]


def hole(face):
    floor = is_flat(face) and abs(face.normal_at().Z) > 0.99 and abs(face.center().Z) < 5.9
    return floor or not is_flat(face)


scene.state("Holes").solid(part.part, accent=hole)

cut = scene.state("Cut open")
cut.solid(cut_open(part.part), section=is_cut_face, accent=hole)
cut.label((-9, 0, -6), "through hole: open at both ends", "b")
cut.label((9, 0, -1), "blind hole: has a floor", "b")
cut.line((14.5, 0, 6), (14.5, 0, -1), role="accent")
cut.label((14.5, 0, 3), "depth 7 mm", "r")
scene.save()
