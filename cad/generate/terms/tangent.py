import math

from build123d import *
from common import Scene, sample_edge
from drawing import Sheet

scene = Scene(__file__)

# [snippet]
with BuildLine() as smooth:
    start = Line((0, 0), (30, 0))
    bend = TangentArc(start @ 1, (45, 15), tangent=start % 1)   # leaves the line in the same direction
    Line(bend @ 1, (45, 35))

with BuildLine() as kinked:
    Line((0, 0), (30, 0))
    ThreePointArc((30, 0), (36.5, 8.5), (45, 15))               # an arc, but not a tangent one
    Line((45, 15), (45, 35))
# [/snippet]


def dot(sheet, x, y, radius=1.1):
    ring = [(x + radius * math.cos(math.radians(a)), y + radius * math.sin(math.radians(a))) for a in range(0, 361, 20)]
    sheet.area([ring], "peg")


def picture(curve, title, notes):
    sheet = Sheet(font=2.8)
    sheet.lines([[(p[0], p[1]) for p in sample_edge(edge)] for edge in curve.edges()], "vis")
    for x, y, text in notes:
        dot(sheet, x, y)
        sheet.text(x - 3, y + 2.5 if y else -5.5, text, anchor="end" if y else "middle")
    sheet.text(22, -14, title, "ttl")
    return sheet.render()


scene.svg("Tangent", picture(smooth.line, "LINE, ARC, LINE: ONE SMOOTH PATH", [
    (30, 0, "tangent: no corner"), (45, 15, "tangent: no corner")]))
scene.svg("Not tangent", picture(kinked.line, "THE SAME END POINTS, BUT WITH CORNERS", [
    (30, 0, "corner"), (45, 15, "corner")]))

# a circle resting on a line touches it at exactly one point
touch = Sheet(font=2.8)
touch.lines([[(-26, 0), (26, 0)]], "vis")
touch.lines([[(12 * math.cos(math.radians(a)), 12 + 12 * math.sin(math.radians(a))) for a in range(0, 361, 5)]], "vis")
touch.lines([[(0, 12), (0, 0)]], "cl")
dot(touch, 0, 0)
touch.text(0, -5.5, "touches at one point")
touch.text(15, 9, "the radius meets", anchor="start")
touch.text(15, 5, "the line at 90°", anchor="start")
touch.text(0, -14, "A LINE TANGENT TO A CIRCLE", "ttl")
scene.svg("Line and circle", touch.render())
scene.save(thumb=0)
