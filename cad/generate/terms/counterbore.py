from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(18, 18, 8)
    with Locations((0, 0, 4)):    # centre of the top face
        CounterBoreHole(radius=1.7, counter_bore_radius=3.25, counter_bore_depth=3.4)
# [/snippet]


def hole(face):
    level = is_flat(face) and abs(face.normal_at().Z) > 0.99 and abs(face.center().Z) < 3.9
    return level or not is_flat(face)


def cap_screw():
    """An M3 socket-head screw with the top of its head at z = 0."""
    hang = (Align.CENTER, Align.CENTER, Align.MAX)
    head = Cylinder(2.75, 3, align=hang)
    shank = Pos(0, 0, -3) * Cylinder(1.5, 9, align=hang)
    socket = Pos(0, 0, -1.7) * extrude(RegularPolygon(1.45, 6), amount=1.7)
    return head + shank - socket


opened = cut_open(part.part)

scene.state("Hole").solid(part.part, accent=hole)

cut = scene.state("Cut open")
cut.solid(opened, section=is_cut_face, accent=hole)
cut.label((3.25, 0, 2.3), "counterbore", "r")
cut.label((1.7, 0, -2), "through hole", "r")

screw = scene.state("With screw")
screw.solid(opened, section=is_cut_face, accent=hole)
screw.solid(Pos(0, 0, 3.6) * cap_screw(), role="steel")
scene.save(thumb=1)
