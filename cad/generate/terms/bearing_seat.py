from build123d import *
from common import Scene, cut_open, is_cut_face
from hardware import ball_bearing

scene = Scene(__file__)

# [snippet]
bore, outside, width = 8, 22, 7     # a 608 bearing: bore × outside diameter × width
fit = 0.1                           # added to the diameter: tune it with a test print
shoulder = 3                        # width of the ledge the outer ring rests on

with BuildPart() as housing:
    Cylinder(radius=16, height=11, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with Locations((0, 0, 11)):
        CounterBoreHole(
            radius=outside / 2 - shoulder,              # through hole: clears the inner ring
            counter_bore_radius=(outside + fit) / 2,    # the seat the bearing presses into
            counter_bore_depth=width,
        )
# [/snippet]

bearing = Pos(0, 0, 4) * ball_bearing(bore, outside, width)
axle = Pos(0, 0, -4) * Cylinder(bore / 2, 26, align=(Align.CENTER, Align.CENTER, Align.MIN))


def seat(face):
    c = face.center()
    return 3.9 < c.Z < 10.9 and 17 < face.bounding_box().size.X < 24


empty = scene.state("Seat")
empty.solid(cut_open(housing.part), section=is_cut_face, accent=seat)
empty.label((11, 0, 8), "seat: 22.1 × 7 mm", "r")
empty.label((9.5, 0, 4), "shoulder: a 3 mm ledge", "r")

filled = scene.state("Bearing pressed in")
filled.solid(cut_open(housing.part), section=is_cut_face, accent=seat)
filled.solid(cut_open(bearing), role="steel", section=is_cut_face)
filled.label((10, 0, 11), "outer ring: gripped by the seat", "r")
filled.label((5, 0, 4), "inner ring: touches nothing, free to turn", "b")

used = scene.state("With a shaft")
used.solid(cut_open(housing.part), section=is_cut_face, accent=seat)
used.solid(cut_open(bearing), role="steel", section=is_cut_face)
used.solid(axle, role="mate")
used.label((0, 0, 22), "8 mm shaft through the bore", "t")
scene.save(thumb=1)
