from build123d import *
from common import Scene, is_flat
from drawing import Sheet

scene = Scene(__file__)

# [snippet]
pin = 5.0                                   # the pin you want to fit
extras = [0.0, 0.1, 0.2, 0.3, 0.4]          # added to the hole diameter

with BuildPart() as strip:                  # a small test piece: print it once
    Box(64, 14, 4)
    for i, extra in enumerate(extras):
        with Locations((-24 + 12 * i, 0, 2)):
            Hole(radius=(pin + extra) / 2)
# [/snippet]

# what "10 ± 0.2" means, with the differences drawn much larger than life
sheet = Sheet(font=2.6)
sheet.rect(0, 20, 34, 6, "sec").lines([[(0, 20), (34, 20), (34, 26), (0, 26), (0, 20)]], "vis")
sheet.rect(0, 10, 40, 6, "peg")
sheet.rect(0, 0, 46, 6, "sec").lines([[(0, 0), (46, 0), (46, 6), (0, 6), (0, 0)]], "vis")
sheet.text(50, 22, "9.8: smallest allowed", anchor="start")
sheet.text(50, 12, "10.0: what you asked for", anchor="start")
sheet.text(50, 2, "10.2: largest allowed", anchor="start")
sheet.lines([[(34, -3), (34, 30)], [(46, -3), (46, 30)]], "cl")
sheet.dim((34, 33), (46, 33), "tolerance")
sheet.text(40, -11, "10 ± 0.2 MM", "ttl")
scene.svg("What it means", sheet.render())

test = scene.state("Test strip")
test.solid(strip.part, accent=lambda f: not is_flat(f))
for i, extra in enumerate(extras):
    test.label((-24 + 12 * i, 0, 2), f"{pin + extra:.1f}", "t")
low = (Align.CENTER, Align.CENTER, Align.MIN)
test.solid(Pos(0, 0, -2) * Cylinder(2.5, 12, align=low), role="steel")
test.label((2.5, 0, 8), "5 mm pin: try it in each hole", "r")
scene.save(thumb=1)
