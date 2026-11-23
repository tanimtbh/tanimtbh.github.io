from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat
from hardware import cap_screw, heat_set_insert

scene = Scene(__file__)

# [snippet]
insert_hole = 4.0      # for a typical M3 insert: check your insert's datasheet
insert_length = 5.7
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(22, 22, 2, align=low)
    with Locations((0, 0, 2)):
        Cylinder(radius=4.2, height=8, align=low)                # boss around the insert
    with Locations((0, 0, 10)):
        Hole(radius=insert_hole / 2, depth=insert_length + 1)    # 1 mm spare at the bottom
# [/snippet]


def hole(face):
    c = face.center()
    return abs(c.X) < 0.1 and 3 < c.Z < 9.9 and face.bounding_box().size.X < 5


opened = cut_open(part.part)
cover = Pos(0, 0, 10) * (Box(22, 22, 2.5, align=low) - Cylinder(1.7, 2.5, align=low))

empty = scene.state("Hole")
empty.solid(opened, section=is_cut_face, accent=hole)
empty.label((2, 0, 6.5), "plain hole, 4.0 mm", "r")

fitted = scene.state("Insert melted in")
fitted.solid(opened, section=is_cut_face, accent=hole)
fitted.solid(cut_open(Pos(0, 0, 10) * heat_set_insert()), role="brass")
fitted.label((2, 0, 7), "brass insert with a metal thread", "r")

used = scene.state("With screw")
used.solid(opened, section=is_cut_face, accent=hole)
used.solid(cut_open(Pos(0, 0, 10) * heat_set_insert()), role="brass")
used.solid(cut_open(cover), role="mate")
used.solid(Pos(0, 0, 12.5) * cap_screw("M3", 7), role="steel")
used.label((11, 0, 11.2), "part being held down", "r")
scene.save(thumb=1)
