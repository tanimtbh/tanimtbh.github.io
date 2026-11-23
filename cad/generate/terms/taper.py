from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as straight:
    with BuildSketch():
        RectangleRounded(30, 30, 4)
    extrude(amount=24)                  # walls go straight up

with BuildPart() as tapered:
    with BuildSketch():
        RectangleRounded(30, 30, 4)
    extrude(amount=24, taper=8)         # every wall leans inward by 8°
# [/snippet]

low = (Align.CENTER, Align.CENTER, Align.MIN)


def side(face):
    return abs(face.normal_at().Z) < 0.9


plain = scene.state("Straight")
plain.solid(straight.part)
plain.line((15, -15, 0), (15, -15, 30), role="dash")
plain.label((15, -15, 24), "walls at 90° to the base", "r")

lean = scene.state("Tapered 8°")
lean.solid(tapered.part, accent=side)
lean.line((15, -15, 0), (15, -15, 30), role="dash")
lean.label((15, -15, 28), "straight up", "r")
lean.label((11.6, -11.6, 24), "leans in by 8°", "l")

# a tapered pin finds its own way into a tapered socket
with BuildPart() as pin:
    with BuildSketch():
        Circle(6)
    extrude(amount=14, taper=6)
with BuildPart() as block:
    Box(30, 30, 14, align=low)
    with BuildSketch():
        Circle(6.2)
    extrude(amount=14, taper=6, mode=Mode.SUBTRACT)

peg = Pos(0, 0, 22) * Rot(180, 0, 0) * pin.part
socket = Pos(0, 0, 14) * Rot(180, 0, 0) * block.part
fit = scene.state("Pin and socket")
fit.solid(cut_open(socket), section=is_cut_face, accent=lambda f: not is_flat(f))
fit.solid(peg, role="mate")
fit.label((6, 0, 14), "wide mouth guides the pin in", "r")
fit.label((4.8, 0, 2), "tight only at the end", "r")
scene.save(thumb=1)
