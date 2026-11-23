import math

from build123d import *
from common import Scene, is_flat
from drawing import Sheet

scene = Scene(__file__, view=(0.55, -1.2, 1.25))

# [snippet]
spacing_x, spacing_y = 58, 23       # centre to centre, as board drawings give it

with BuildPart() as plate:
    Box(66, 31, 2)
    with GridLocations(spacing_x, spacing_y, 2, 2):     # the spacing is between centres
        Hole(radius=1.4)

pitch = 2.54                        # the spacing of a row of equal things: header pins
with BuildPart() as header:
    Box(8 * pitch, pitch, 2.5)
    with GridLocations(pitch, 0, 8, 1):
        Box(0.64, 0.64, 8.5)
# [/snippet]

z = 1.05
holes = scene.state("Centre to centre")
holes.solid(plate.part, accent=lambda f: not is_flat(f))
holes.line((-29, -11.5, z), (29, -11.5, z), role="accent")
holes.line((29, -11.5, z), (29, 11.5, z), role="accent")
holes.label((0, -11.5, z), "58 mm, centre to centre", "b")
holes.label((29, 0, z), "23 mm", "r")


def circle(cx, radius):
    return [(cx + radius * math.cos(math.radians(a)), radius * math.sin(math.radians(a))) for a in range(0, 361, 6)]


sheet = Sheet(font=2.6)
sheet.rect(-22, -10, 44, 20, "body")
sheet.lines([[(-22, -10), (22, -10), (22, 10), (-22, 10), (-22, -10)]], "vis")
for cx in (-10, 10):
    sheet.area([circle(cx, 3)], "peg")
    sheet.lines([[(cx, -5), (cx, 17)]], "cl")
sheet.dim((-10, 17), (10, 17), "centre to centre: 20")
sheet.lines([[(-7, 0), (-7, -17)], [(7, 0), (7, -17)]], "dim")
sheet.dim((-7, -17), (7, -17), "")
sheet.text(0, -22.5, "edge to edge: 14")
sheet.text(0, -31, "TWO HOLES OF 6 MM: SAY WHICH SPACING YOU MEAN", "ttl")
scene.svg("Or edge to edge?", sheet.render())

k = 2.6                                 # drawn larger than life, so the pins can be seen
p = pitch * k
pins = scene.state("Pitch")
pins.solid(scale(header.part, by=k), accent=lambda f: abs(f.center().Z) > 1.3 * k, fine=False)
pins.line((-3.5 * p, 0, 4.4 * k), (-2.5 * p, 0, 4.4 * k), role="accent")
pins.label((-3 * p, 0, 4.4 * k), "pitch 2.54 mm", "t")
pins.line((-3.5 * p, -1.3 * k, -1.25 * k), (3.5 * p, -1.3 * k, -1.25 * k), role="accent")
pins.label((0, -1.3 * k, -1.25 * k), "first to last pin: 7 × 2.54 = 17.78 mm", "b")
scene.save(thumb=0)
