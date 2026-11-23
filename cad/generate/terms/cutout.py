from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
wall = 2
port_w, port_h = 9.0, 3.3       # the USB-C socket on the board
gap = 0.5                       # room around it, on every side
port_z = 7                      # centre of the socket above the outside bottom
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    Box(40, 30, 16, align=low)
    offset(amount=-wall, openings=case.faces().sort_by(Axis.Z)[-1])   # open box
    with BuildSketch(Plane.XZ.offset(15)):          # the outside of the front wall
        with Locations((0, port_z)):
            SlotOverall(port_w + 2 * gap, port_h + 2 * gap)
    extrude(amount=-wall, mode=Mode.SUBTRACT)       # cut through that one wall
# [/snippet]


def opening(face):
    c = face.center()
    return -15.01 < c.Y < -12.99 and abs(c.X) < 5.1 and abs(c.Z - port_z) < 2.2 and abs(face.normal_at().Y) < 0.5


with BuildSketch(Plane.XZ.offset(19)) as tip:
    with Locations((0, port_z)):
        SlotOverall(8.3, 2.4)
with BuildSketch(Plane.XZ.offset(31)) as grip:
    with Locations((0, port_z)):
        RectangleRounded(12, 6.5, 2)
plug = extrude(tip.sketch, amount=-9) + extrude(grip.sketch, amount=-12)

empty = scene.state("Cutout")
empty.solid(case.part, accent=opening)
empty.line((-9, -15.05, 0), (-9, -15.05, port_z), role="accent")
empty.line((-9, -15.05, port_z), (-5, -15.05, port_z), role="dash")
empty.label((-9, -15.05, 3.5), "centre: 7 mm up", "l")
empty.label((5, -15, port_z), "socket size + 0.5 mm all round", "r")
empty.label((10, -15, 16), "front wall (−Y)", "t")

used = scene.state("With the plug")
used.solid(case.part, accent=opening)
used.solid(plug, role="mate", fine=False)
used.label((6, -25, port_z), "the plug body stays outside", "r")
scene.save(thumb=0)
