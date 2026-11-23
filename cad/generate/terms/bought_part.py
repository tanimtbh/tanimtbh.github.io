from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
# the bought part: an 18650 battery cell, with the largest sizes its datasheet allows.
# It is modelled only to check the fit. It is never changed and never printed.
cell_d, cell_len = 18.4, 65.2
gap = 0.4                               # room around the cell
floor = 2
axis_z = floor + gap + cell_d / 2       # height of the middle of the cell

cell = Pos(0, 0, axis_z) * Cylinder(cell_d / 2, cell_len, rotation=(0, 90, 0))
cell.label = "18650 cell (bought)"

# the printed part is designed around it
with BuildPart() as cradle:
    Box(cell_len + 8, cell_d + 6, axis_z, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with Locations((0, 0, axis_z)):
        Cylinder(cell_d / 2 + gap, cell_len + 2 * gap, rotation=(0, 90, 0), mode=Mode.SUBTRACT)
cradle.part.label = "cradle (printed)"
# [/snippet]

alone = scene.state("The bought part")
alone.solid(cell, role="steel")
alone.line((-cell_len / 2, -cell_d / 2 - 3, axis_z), (cell_len / 2, -cell_d / 2 - 3, axis_z), role="accent")
alone.label((0, -cell_d / 2 - 3, axis_z), "65.2 mm long", "b")
alone.label((cell_len / 2, 0, axis_z + cell_d / 2), "18.4 mm across", "t")

fitted = scene.state("Designed around it")
fitted.solid(cradle.part, accent=lambda f: not is_flat(f))
fitted.solid(cell, role="steel")
fitted.label((-20, 0, axis_z + cell_d / 2), "bought: fixed size, not printed", "t")
fitted.label((0, -cell_d / 2 - 3, 4), "printed: shaped to fit it", "b")
scene.save(thumb=1)
