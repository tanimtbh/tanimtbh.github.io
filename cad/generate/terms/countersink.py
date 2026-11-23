from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(18, 18, 8)
    with Locations((0, 0, 4)):    # centre of the top face
        CounterSinkHole(radius=1.7, counter_sink_radius=3.2, counter_sink_angle=90)
# [/snippet]


def hole(face):
    return not is_flat(face)


def flat_head_screw():
    """An M3 countersunk screw with the top of its head at z = 0."""
    hang = (Align.CENTER, Align.CENTER, Align.MAX)
    head = Cone(bottom_radius=1.5, top_radius=3.0, height=1.5, align=hang)
    shank = Pos(0, 0, -1.5) * Cylinder(1.5, 10, align=hang)
    socket = Pos(0, 0, -1.1) * extrude(RegularPolygon(1.15, 6), amount=1.1)
    return head + shank - socket


opened = cut_open(part.part)

scene.state("Hole").solid(part.part, accent=hole)

cut = scene.state("Cut open")
cut.solid(opened, section=is_cut_face, accent=hole)
cut.label((2.5, 0, 3.3), "countersink", "r")
cut.label((1.7, 0, -1), "through hole", "r")

screw = scene.state("With screw")
screw.solid(opened, section=is_cut_face, accent=hole)
screw.solid(Pos(0, 0, 4) * flat_head_screw(), role="steel")
scene.save(thumb=1)
