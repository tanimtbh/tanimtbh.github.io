from build123d import *
from common import Scene, cut_open, is_cut_face

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)
gap = 0.2      # clearance so the lid goes on without force

with BuildPart() as base:
    Box(40, 30, 14, align=low)
    offset(amount=-2, openings=base.faces().sort_by(Axis.Z)[-1])   # hollow, 2 mm walls
    with BuildSketch(Plane.XY.offset(14)):       # lip: a thin wall on the inner half of the rim
        Rectangle(38, 28)
        Rectangle(36, 26, mode=Mode.SUBTRACT)
    extrude(amount=2)

with BuildPart() as lid:
    with Locations((0, 0, 14)):
        Box(40, 30, 4, align=low)
    with BuildSketch(Plane.XY.offset(14)):       # recess that the lip fits into
        Rectangle(38 + 2 * gap, 28 + 2 * gap)
    extrude(amount=2 + gap, mode=Mode.SUBTRACT)
# [/snippet]


def lip(face):
    return face.center().Z > 14.01


def recess(face):
    c = face.center()
    return 14.01 < c.Z < 17 and abs(c.X) < 19.5 and abs(c.Y) < 14.5


lift = Pos(0, 0, 12)

bottom = scene.state("Box with lip")
bottom.solid(base.part, accent=lip)
bottom.label((19, -14, 16), "lip", "r")

apart = scene.state("Lid above")
apart.solid(base.part, accent=lip)
apart.solid(lift * lid.part, role="mate")
apart.arrow((0, -15, 24), (0, -15, 17.5), width=0.7)

shut = scene.state("Closed, cut open")
shut.solid(cut_open(base.part), section=is_cut_face, accent=lip)
shut.solid(cut_open(lid.part), role="mate")
shut.label((18.5, 0, 15), "lip sits inside the lid", "r")
shut.label((-18.5, 0, 15), "0.2 mm gap", "l")
scene.save(thumb=1)
