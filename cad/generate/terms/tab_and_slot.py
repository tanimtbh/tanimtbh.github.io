from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)
gap = 0.15     # clearance on each side of a tab

with BuildPart() as base:
    Box(42, 24, 3, align=low)
    with Locations((-10, 0, 0), (10, 0, 0)):
        Box(8 + 2 * gap, 3 + 2 * gap, 3, align=low, mode=Mode.SUBTRACT)    # two slots

with BuildPart() as wall:
    with Locations((0, 0, 3)):
        Box(36, 3, 20, align=low)
    with Locations((-10, 0, 0), (10, 0, 0)):
        Box(8, 3, 3, align=low)                                            # two tabs
# [/snippet]


def slot(face):
    c = face.center()
    return abs(c.Y) < 1.7 and abs(c.X) < 14.5 and 0.01 < c.Z < 2.99


def tab(face):
    return face.center().Z < 2.99


apart = scene.state("Apart")
apart.solid(base.part, accent=slot)
apart.solid(Pos(0, 0, 9) * wall.part, role="mate", accent=lambda f: f.center().Z < 11.99)
apart.label((14, -1.5, 10.5), "tab", "r")
apart.label((14.15, -1.65, 3), "slot", "r")

joined = scene.state("Joined")
joined.solid(base.part)
joined.solid(wall.part, role="mate")
joined.label((18, -1.5, 3), "the tabs sit in the slots", "r")
scene.save(thumb=0)
