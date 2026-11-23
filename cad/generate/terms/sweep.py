from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    with BuildLine(Plane.XZ) as path:                  # the route to follow
        FilletPolyline((0, 0), (0, 26), (36, 26), radius=12)
    with BuildSketch() as profile:                     # the shape that travels along it
        Circle(5)
        Circle(3.5, mode=Mode.SUBTRACT)
    sweep()
# [/snippet]

parts = scene.state("Path and profile")
parts.solid(profile.sketch, role="accent", edges="accent")
parts.edges(path.line.edges(), role="accent")
parts.label((5, 0, 0), "profile: a ring", "r")
parts.label((18, 0, 26), "path", "t")

done = scene.state("Swept")
done.solid(part.part, accent=lambda f: not is_flat(f))
scene.save()
