from build123d import *
from common import Scene
from drawing import Sheet

scene = Scene(__file__)

# [snippet]
peg_diameter = 10.0
clearance = 0.2    # gap on each side; tune it for your printer

with BuildPart() as socket:
    Box(24, 24, 12)
    Hole(radius=peg_diameter / 2 + clearance)
# [/snippet]


def diagram(peg_width: float, note: str, gap_text: str) -> str:
    """Side view of a peg in a hole, cut through the middle. Not to scale."""
    hole = 30.0
    sheet = Sheet(font=3.8)
    # the block, cut in half: material on both sides of the hole
    sheet.rect(-45, 0, 45 - hole / 2, 36, "sec").rect(hole / 2, 0, 45 - hole / 2, 36, "sec")
    sheet.lines([[(-45, 36), (-hole / 2, 36), (-hole / 2, 0), (-45, 0), (-45, 36)],
                 [(45, 36), (hole / 2, 36), (hole / 2, 0), (45, 0), (45, 36)]], "vis")
    # the peg
    sheet.rect(-peg_width / 2, 6, peg_width, 48, "peg")
    side = (hole - peg_width) / 2
    if side < 0:  # the peg is wider than the hole: show the overlap
        sheet.rect(-peg_width / 2, 6, -side, 30, "clash").rect(hole / 2, 6, -side, 30, "clash")
    sheet.lines([[(0, -4), (0, 58)]], "cl")
    sheet.dim((-peg_width / 2, 62), (peg_width / 2, 62), "peg")
    sheet.dim((-hole / 2, -9), (hole / 2, -9), "hole")
    # leader to the gap or overlap on the right-hand side
    x = (hole + peg_width) / 4
    sheet.lines([[(x, 24), (52, 44)]], "dim")
    sheet.text(54, 44.5, gap_text, anchor="start")
    sheet.text(0, -24, note, "ttl")
    return sheet.render()


scene.svg("Clearance fit", diagram(24, "PEG SMALLER THAN HOLE: SLIDES IN", "clearance (gap)"))
scene.svg("Interference fit", diagram(33, "PEG LARGER THAN HOLE: MUST BE PRESSED IN", "interference (overlap)"))
scene.save(thumb=0)
