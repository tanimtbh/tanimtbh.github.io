from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(40, 30, 15)
    top_edges = part.edges().group_by(Axis.Z)[-1]
    chamfer(top_edges, length=4)
# [/snippet]


def slanted(face):
    return is_flat(face) and 0.01 < abs(face.normal_at().Z) < 0.99


scene.state("Before").solid(Box(40, 30, 15), accent_edges=lambda e: e.center().Z > 7.4)
scene.state("After").solid(part.part, accent=slanted)
scene.save()
