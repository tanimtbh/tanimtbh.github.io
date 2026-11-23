from build123d import *
from common import Scene, is_flat

scene = Scene(__file__, view=(0.55, -1.2, 1.25))

# [snippet]
board_w, board_h, thick = 60, 30, 1.6
# hole positions as the drawing gives them: measured from the bottom-left corner
holes = [(4, 4), (56, 4), (4, 26), (40, 20)]

with BuildPart() as board:
    # put that same corner at the origin, so the numbers can be used as they are
    Box(board_w, board_h, thick, align=(Align.MIN, Align.MIN, Align.MIN))
    with Locations((0, 0, thick)):          # on the top face
        with Locations(*holes):
            Hole(radius=1.6)
# [/snippet]

z = thick + 0.05


def picture(label, shift, origin_note, x_note, y_note):
    """The same board, with the origin (0, 0) at a different place."""
    sx, sy = shift
    state = scene.state(label)
    state.solid(Pos(sx, sy, 0) * board.part, accent=lambda f: not is_flat(f))
    state.triad(12, 0.6)
    state.dots([(0, 0, 0)], 1.0)
    hx, hy = 40 + sx, 20 + sy                                   # one of the holes
    state.line((0, hy, z), (hx, hy, z), role="accent")
    state.line((hx, 0, z), (hx, hy, z), role="accent")
    state.label((hx / 2, hy, z), x_note, "t")
    state.label((hx, hy / 2, z), y_note, "r")
    state.label((0, 0, 0), origin_note, "b")
    return state


picture("From the corner", (0, 0), "datum: bottom-left corner", "x = 40", "y = 20")
picture("From the centre", (-30, -15), "datum: centre of the board", "x = 10", "y = 5")
scene.save(thumb=0)
