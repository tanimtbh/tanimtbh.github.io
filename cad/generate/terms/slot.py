from build123d import *
from common import Scene
from hardware import cap_screw

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(46, 22, 4)
    with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):    # on the top face
        SlotOverall(width=24, height=3.4)                  # 24 long, 3.4 wide (M3)
    extrude(amount=-4, mode=Mode.SUBTRACT)
# [/snippet]


def slot(face):
    c = face.center()
    return abs(c.X) < 12.5 and abs(c.Y) < 1.8 and abs(c.Z) < 1.9


shape = scene.state("Slot")
shape.solid(part.part, accent=slot)
shape.line((-12, -5, 2.05), (12, -5, 2.05), role="accent")
shape.label((0, -5, 2.05), "overall length 24 mm", "b")
shape.label((12, 0, 2), "width 3.4 mm", "r")

use = scene.state("Adjustable")
use.solid(part.part, accent=slot)
use.solid(Pos(-7, 0, 2) * cap_screw("M3", 8), role="steel")
use.solid(Pos(8, 0, 2) * cap_screw("M3", 8), role="ghost", edges="faint")
use.arrow((-3, 0, 7.5), (5, 0, 7.5), width=0.6)
use.label((1, 0, 7.5), "the screw can sit anywhere along the slot", "t")
scene.save(thumb=0)
