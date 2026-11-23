from build123d import *
from common import Scene
from drawing import Sheet, outline

scene = Scene(__file__)

# [snippet]
with BuildSketch() as shape:
    Polygon((-15, -10), (15, -10), (15, 0), (0, 0), (0, 10), (-15, 10), align=None)

bigger = offset(shape.sketch, amount=3)       # 3 mm outward, all the way round
smaller = offset(shape.sketch, amount=-3)     # 3 mm inward
# [/snippet]


def ring(sketch):
    points = outline(sketch.faces()[0].outer_wire(), axes=("X", "Y"))
    return points + [points[0]]


def picture(result, note, gap_from, gap_to):
    sheet = Sheet(font=2.2)
    sheet.area([ring(result)], "peg")
    sheet.lines([ring(shape.sketch)], "hid")
    sheet.lines([[gap_from, gap_to]], "dim")
    sheet.text(gap_to[0] + 1, gap_to[1] - 0.8, "3 mm", anchor="start")
    sheet.text(-15, 15.5, "dashed: the original outline", anchor="start")
    sheet.text(0, -19, note, "ttl")
    return sheet.render()


scene.svg("Outward", picture(bigger, "OFFSET OUTWARD BY 3 MM", (15, -5), (22, -5)))
scene.svg("Inward", picture(smaller, "OFFSET INWARD BY 3 MM", (12, -5), (22, -5)))
scene.save(thumb=0)
