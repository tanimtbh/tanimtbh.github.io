from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
slot_w = 2.4        # narrow: keeps fingers and screwdrivers out
strip = 3.6         # solid material left between two slots
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as wall:
    Box(46, 2, 34, align=low)                         # a standing side wall
    with BuildSketch(Plane.XZ.offset(1)):             # its front face
        with Locations((0, 17)):
            with GridLocations(slot_w + strip, 0, 6, 1):
                SlotOverall(20, slot_w, rotation=90)  # tall, narrow slots
    extrude(amount=-2, mode=Mode.SUBTRACT)
# [/snippet]

with BuildPart() as across:
    Box(46, 2, 34, align=low)
    with BuildSketch(Plane.XZ.offset(1)):
        with Locations((0, 17)):
            with GridLocations(0, slot_w + strip, 1, 4):
                SlotOverall(30, slot_w)
    extrude(amount=-2, mode=Mode.SUBTRACT)


def slot(face):
    c = face.center()
    return abs(c.Y) < 0.99 and abs(c.X) < 20 and 3 < c.Z < 31


good = scene.state("Upright slots")
good.solid(wall.part, accent=slot)
good.label((3, -1, 27), "only the small round top hangs in the air", "t")
good.line((-3, -1.05, 4.5), (3, -1.05, 4.5), role="accent")
good.label((0, -1.05, 4.5), "spacing 6 mm", "b")

poor = scene.state("Sideways slots")
poor.solid(across.part, accent=slot)
poor.label((0, -1, 27.2), "the top of every slot is a 30 mm bridge", "t")
scene.save(thumb=0)
