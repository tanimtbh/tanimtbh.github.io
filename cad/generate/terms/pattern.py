import math

from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
# Grid pattern: rows and columns
with BuildPart() as plate:
    Box(54, 34, 4)
    with GridLocations(x_spacing=12, y_spacing=14, x_count=4, y_count=2):
        Hole(radius=2.5)

# Polar pattern: copies spread around a circle
with BuildPart() as flange:
    Cylinder(radius=22, height=4)
    with PolarLocations(radius=15, count=6):
        Hole(radius=2.5)
# [/snippet]


def off_centre_hole(face):
    centre = face.center()
    return not is_flat(face) and math.hypot(centre.X, centre.Y) > 1


grid = scene.state("Grid pattern")
grid.solid(plate.part, accent=lambda f: not is_flat(f))
grid.line((-18, -7, 2.05), (-6, -7, 2.05), role="accent")
grid.label((-12, -7, 2.05), "spacing 12 mm", "b")
grid.label((18, 7, 2), "4 × 2 holes", "r")

polar = scene.state("Polar pattern")
polar.solid(flange.part, accent=off_centre_hole)
polar.edges([Edge.make_circle(15, Plane.XY.offset(2.05))], role="dash")
polar.dots([(0, 0, 2)], 0.7)
polar.label((0, 0, 2), "centre", "l")
polar.label((15, 0, 2), "6 holes, 60° apart", "r")
scene.save(thumb=1)
