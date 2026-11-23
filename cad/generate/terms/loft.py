from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    with BuildSketch() as bottom:                      # a square at the bottom
        Rectangle(32, 32)
    with BuildSketch(Plane.XY.offset(30)) as top:      # a circle 30 mm above it
        Circle(9)
    loft()                                             # blend one into the other
# [/snippet]

shapes = scene.state("Profiles")
shapes.solid(bottom.sketch, role="accent", edges="accent")
shapes.solid(top.sketch, role="accent", edges="accent")
shapes.line((0, 0, 0), (0, 0, 30), role="dash")
shapes.label((16, -16, 0), "profile 1: square", "r")
shapes.label((9, 0, 30), "profile 2: circle", "r")

done = scene.state("Lofted")
done.solid(part.part, accent=lambda f: not is_flat(f))
scene.save()
