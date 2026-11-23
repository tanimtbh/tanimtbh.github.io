from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat
from hardware import cap_screw, hex_nut

scene = Scene(__file__)

# [snippet]
nut_width = 5.5     # M3 nut, measured flat to flat
nut_height = 2.4
gap = 0.2           # extra room so the nut drops in

with BuildPart() as part:
    Box(18, 18, 8)
    Hole(radius=1.7)                                 # M3 clearance hole, right through
    with BuildSketch(Plane.XY.offset(4)):            # on the top face
        RegularPolygon(radius=(nut_width + gap) / 2, side_count=6, major_radius=False)
    extrude(amount=-(nut_height + 0.4), mode=Mode.SUBTRACT)
# [/snippet]


def pocket(face):
    c = face.center()
    return abs(c.X) < 3.5 and abs(c.Y) < 3.5 and 0.5 < c.Z < 3.99


low = (Align.CENTER, Align.CENTER, Align.MIN)
other = Pos(0, 0, -7) * (Box(18, 18, 3, align=low) - Cylinder(1.7, 3, align=low))
nut = Pos(0, 0, 1.2) * hex_nut("M3")
screw = Pos(0, 0, -7) * Rot(180, 0, 0) * cap_screw("M3", 10)

empty = scene.state("Pocket")
empty.solid(part.part, accent=pocket)
empty.label((2.85, 0, 4), "six-sided pocket", "r")

loaded = scene.state("Nut dropped in")
loaded.solid(part.part, accent=pocket)
loaded.solid(nut, role="steel")

used = scene.state("Cut open, with screw")
used.solid(cut_open(part.part), section=is_cut_face, accent=pocket)
used.solid(cut_open(other), role="mate")
used.solid(nut, role="steel")
used.solid(screw, role="steel")
used.label((2.75, 0, 2.4), "the nut cannot turn", "r")
used.label((9, 0, -5.5), "second part", "r")
scene.save(thumb=1)
