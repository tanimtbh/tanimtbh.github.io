from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(40, 30, 15)
    top_edges = part.edges().group_by(Axis.Z)[-1]
    fillet(top_edges, radius=4)
# [/snippet]

scene.state("Before").solid(Box(40, 30, 15), accent_edges=lambda e: e.center().Z > 7.4)
scene.state("After").solid(part.part, accent=lambda f: not is_flat(f))
scene.save()
