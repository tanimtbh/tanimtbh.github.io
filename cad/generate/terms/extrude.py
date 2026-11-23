from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    with BuildSketch() as profile:
        RectangleRounded(40, 26, radius=6)
        Circle(6, mode=Mode.SUBTRACT)
    extrude(amount=12)
# [/snippet]

sketch = scene.state("Sketch")
sketch.solid(profile.sketch, role="accent", edges="accent")
sketch.label((-14, -13, 0), "flat 2D profile", "b")

solid = scene.state("Extruded")
solid.solid(part.part, accent_edges=lambda e: e.center().Z < 0.01)
solid.arrow((24, -13, 0), (24, -13, 12), width=0.7)
solid.label((24, -13, 6), "amount = 12", "r")
scene.save()
