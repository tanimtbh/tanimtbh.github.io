from build123d import *
from common import Scene
from drawing import Sheet

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)
gap = 0.2      # clearance on each sloped side

with BuildPart() as base:
    Box(30, 30, 10, align=low)
    with BuildSketch(Plane.XZ):              # slot: narrow at the top, wide inside
        Polygon((-4, 10), (4, 10), (6, 5), (-6, 5), align=None)
    extrude(amount=15, both=True, mode=Mode.SUBTRACT)

with BuildPart() as slider:
    with Locations((0, 0, 10)):
        Box(18, 30, 4, align=low)
    with BuildSketch(Plane.XZ):              # the same shape, a little smaller
        Polygon((-4 + gap, 10), (4 - gap, 10), (6 - gap, 5 + gap), (-6 + gap, 5 + gap), align=None)
    extrude(amount=15, both=True)
# [/snippet]


def slot(face):
    c = face.center()
    return abs(c.X) < 6.1 and 4.9 < c.Z < 9.99 and abs(c.Y) < 14.9


out = Pos(0, -24, 0)

apart = scene.state("Apart")
apart.solid(base.part, accent=slot)
apart.solid(out * slider.part, role="mate")
apart.arrow((13, -30, 12), (13, -18, 12), width=0.7)
apart.label((13, -30, 12), "slides in from the end", "r")

joined = scene.state("Joined")
joined.solid(base.part, accent=slot)
joined.solid(slider.part, role="mate")
joined.label((9, -15, 12), "cannot lift out", "r")

# end view, with the gap drawn larger than life so it shows
sheet = Sheet(font=1.9)
g = 0.5
sheet.area([[(-15, 0), (15, 0), (15, 10), (4, 10), (6, 5), (-6, 5), (-4, 10), (-15, 10)]], "sec")
sheet.lines([[(-15, 0), (15, 0), (15, 10), (4, 10), (6, 5), (-6, 5), (-4, 10), (-15, 10), (-15, 0)]], "vis")
sheet.area([[(-9, 10 + g), (9, 10 + g), (9, 14 + g), (-9, 14 + g)],], "peg")
sheet.area([[(-4 + g, 10 + g), (4 - g, 10 + g), (6 - g * 1.6, 5 + g), (-6 + g * 1.6, 5 + g)]], "peg")
sheet.lines([[(5.2, 7.6), (18, 7.6)]], "dim")
sheet.text(18.6, 6.9, "gap", anchor="start")
sheet.text(0, -4.5, "END VIEW: WIDER INSIDE THAN AT THE OPENING", "ttl")
scene.svg("End view", sheet.render())
scene.save(thumb=0)
