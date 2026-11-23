from build123d import *
from common import Scene, cut_open, is_cut_face
from drawing import Sheet

scene = Scene(__file__)

# [snippet]
wall = 2.0      # one number for every wall and the floor

with BuildPart() as part:
    Box(40, 30, 18, align=(Align.CENTER, Align.CENTER, Align.MIN))
    offset(amount=-wall, openings=part.faces().sort_by(Axis.Z)[-1])
# [/snippet]

cut = scene.state("Cut open")
cut.solid(cut_open(part.part), section=is_cut_face)
cut.line((18, 0, 18.05), (20, 0, 18.05), role="accent")
cut.label((19, 0, 18), "wall 2 mm", "r")
cut.line((-8, 0, 0), (-8, 0, 2), role="accent")
cut.label((-8, 0, 1), "floor 2 mm", "b")

# looking down on a thin wall: it is made of side-by-side lines of plastic
sheet = Sheet(font=1.5)
for i in range(3):
    sheet.rect(i * 4, 0, 4, 22, "peg")
sheet.dim((0, -4), (12, -4), "1.2 mm")
sheet.lines([[(2, 22), (2, 26)], [(6, 22), (6, 26)], [(10, 22), (10, 26)]], "dim")
sheet.text(6, 27, "three lines, each 0.4 mm wide")
sheet.text(6, -11, "A WALL IS A WHOLE NUMBER OF NOZZLE LINES", "ttl")
scene.svg("Nozzle lines", sheet.render())
scene.save(thumb=0)
