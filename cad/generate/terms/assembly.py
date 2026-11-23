from build123d import *
from common import Scene, cut_open, is_cut_face

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

# each part is modelled on its own, around its own origin
with BuildPart() as base_builder:
    Box(44, 32, 12, align=low)
    offset(amount=-2, openings=base_builder.faces().sort_by(Axis.Z)[-1])
    with Locations((0, 0, 2)), GridLocations(30, 18, 2, 2):
        Cylinder(radius=2.5, height=3, align=low)           # posts for the board

base = base_builder.part
board = Box(36, 24, 1.6, align=low)
lid = Box(44, 32, 2, align=low)
base.label, board.label, lid.label = "base", "board", "lid"

# the assembly only says where each part goes
node = Compound(label="sensor node", children=[
    base,
    Pos(0, 0, 5) * board,           # on the posts, 3 mm above the floor
    Pos(0, 0, 12) * lid,            # on top of the walls
])

for part in node.children:
    print(part.label, part.location.position)
# [/snippet]

apart = scene.state("Three parts")
apart.solid(base)
apart.solid(Pos(0, 0, 24) * board, role="mate")
apart.solid(Pos(0, 0, 38) * lid, role="accent")
for z, name in ((6, "base"), (24.8, "board"), (39, "lid")):
    apart.label((22 if z != 24.8 else 18, 0, z), name, "r")
apart.label((-22, -16, 38), "each part is modelled on its own", "t")

placed = node.children
together = scene.state("Assembled")
together.solid(cut_open(placed[0]), section=is_cut_face)
together.solid(cut_open(placed[1]), role="mate")
together.solid(cut_open(placed[2]), role="accent")
together.label((22, 0, 13), "lid: moved 12 mm up", "r")
together.label((18, 0, 5.8), "board: moved 5 mm up", "r")
together.label((8, 0, 0), "base: stays at the origin", "b")
scene.save(thumb=1)
