from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    with BuildSketch() as profile:          # a sketch: flat shapes drawn on a plane
        RectangleRounded(40, 26, 5)
        Circle(6, mode=Mode.SUBTRACT)       # a hole in the profile
    extrude(amount=10)                      # the closed profile becomes a solid
# [/snippet]

flat = scene.state("Profile")
flat.solid(profile.sketch, role="accent", edges="accent")
flat.label((8, -13, 0), "closed outline", "b")
flat.label((0, 6, 0), "inner outline: a hole", "t")

solid = scene.state("Extruded")
solid.solid(part.part, accent=lambda f: f.center().Z > 9.99)
solid.label((0, 13, 10), "the same outline, now 10 mm tall", "t")

# an outline with a gap in it: it has no inside, so nothing can be filled
broken = scene.state("Not closed")
broken.line((6, 13, 0), (-20, 13, 0), (-20, -13, 0), (20, -13, 0), (20, 13, 0), (12, 13, 0), role="accent")
broken.dots([(6, 13, 0), (12, 13, 0)], 0.7)
broken.label((9, 13, 0), "gap: the outline is open", "t")
broken.label((0, -13, 0), "no inside, so it cannot become a solid", "b")
scene.save(thumb=0)
