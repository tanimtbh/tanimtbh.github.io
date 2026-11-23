from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat
from hardware import SIZES, cap_screw, heat_set_insert

scene = Scene(__file__, view=(0.55, -1.5, 0.7))

# [snippet]
# Hole diameters in mm: [M2, M2.5, M3, M4, M5]
SCREWS = ["M2", "M2.5", "M3", "M4", "M5"]
CLEARANCE = dict(zip(SCREWS, [2.4, 2.9, 3.4, 4.5, 5.5]))   # screw slides through
THREAD_IN = dict(zip(SCREWS, [1.6, 2.1, 2.5, 3.3, 4.2]))   # screw bites into plastic
INSERT = dict(zip(SCREWS, [3.2, 4.0, 4.0, 5.6, 6.4]))      # brass heat-set insert

screw = "M3"

with BuildPart() as block:
    Box(44, 14, 10)
    with Locations((-14, 0, 5)):
        Hole(radius=CLEARANCE[screw] / 2)        # right through
    with Locations((0, 0, 5)):
        Hole(radius=THREAD_IN[screw] / 2, depth=8)
    with Locations((14, 0, 5)):
        Hole(radius=INSERT[screw] / 2, depth=6.5)
# [/snippet]

# five screws side by side, smallest first
row = scene.state("Sizes")
x = -22.0
for size, length in (("M2", 8), ("M2.5", 8), ("M3", 10), ("M4", 12), ("M5", 14)):
    head = SIZES[size]["head"]
    x += head / 2
    row.solid(Pos(x, 0, 0) * cap_screw(size, length), role="steel")
    row.label((x, 0, SIZES[size]["head_h"]), size, "t")
    if size == "M3":
        row.label((x + 1.5, 0, -6), "M3 = 3 mm thread", "r")
    x += head / 2 + 5


def hole(face):
    floor = is_flat(face) and abs(face.normal_at().Z) > 0.99 and abs(face.center().Z) < 4.9
    return floor or not is_flat(face)


opened = cut_open(block.part)
kinds = scene.state("Three kinds of hole")
kinds.solid(opened, section=is_cut_face, accent=hole)
kinds.label((-14, 0, 5), "clearance 3.4", "t")
kinds.label((0, 0, 5), "thread-in 2.5", "t")
kinds.label((14, 0, 5), "insert 4.0", "t")

used = scene.state("With M3 screws")
used.solid(opened, section=is_cut_face, accent=hole)
used.solid(Pos(-14, 0, 5) * cap_screw("M3", 14), role="steel")
used.solid(Pos(0, 0, 5) * cap_screw("M3", 7), role="steel")
used.solid(Pos(14, 0, 5) * heat_set_insert(), role="brass")
used.label((-14, 0, -5), "passes through", "b")
used.label((0, 0, -3), "cuts its own thread", "b")
used.label((16, 0, 2), "brass insert", "r")
scene.save(thumb=0)
