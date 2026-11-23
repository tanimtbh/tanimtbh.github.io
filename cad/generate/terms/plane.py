from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
Plane.XY               # lies flat, faces up (+Z)
Plane.XZ               # stands up, faces the front (-Y)
Plane.YZ               # stands up, faces the right (+X)
raised = Plane.XY.offset(15)    # the XY plane moved 15 mm up

with BuildSketch(raised) as sketch:
    Circle(8)          # drawn 15 mm above the floor
# [/snippet]

SIZE = 36


def base(label):
    state = scene.state(label)
    state.triad(24)
    state.label((24, 0, 0), "X", "r").label((0, 24, 0), "Y", "t").label((0, 0, 24), "Z", "t")
    return state


base("XY").sheet(Plane.XY, SIZE, SIZE).label((-18, -18, 0), "Plane.XY", "b")
base("XZ").sheet(Plane.XZ, SIZE, SIZE).label((-18, 0, -18), "Plane.XZ", "b")
base("YZ").sheet(Plane.YZ, SIZE, SIZE).label((0, -18, -18), "Plane.YZ", "b")

moved = base("Offset")
moved.sheet(raised, SIZE, SIZE)
moved.solid(sketch.sketch, role="accent", edges="accent")
moved.line((-18, -18, 0), (18, -18, 0), (18, 18, 0), (-18, 18, 0), (-18, -18, 0), role="faint")
moved.line((-18, -18, 0), (-18, -18, 15), role="dash")
moved.label((-18, -18, 7.5), "15 mm", "l")
moved.label((-18, -18, 15), "Plane.XY.offset(15)", "t")
scene.save(thumb=0)
