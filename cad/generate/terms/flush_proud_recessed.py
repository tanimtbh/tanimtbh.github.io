from build123d import *
from common import Scene, cut_open, is_cut_face

scene = Scene(__file__, view=(0.45, -1.5, 0.8))

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)
hang = (Align.CENTER, Align.CENTER, Align.MAX)
top = 6        # height of the panel surface

with BuildPart() as panel:
    Box(72, 22, top, align=low)
    with Locations((-24, 0, top), (0, 0, top), (24, 0, top)):
        Box(12.4, 12.4, 5, align=hang, mode=Mode.SUBTRACT)     # three pockets

flush = Pos(-24, 0, top) * Box(12, 12, 5, align=hang)          # top level with the surface
proud = Pos(0, 0, top + 2) * Box(12, 12, 7, align=hang)        # sticks out 2 mm
recessed = Pos(24, 0, top - 2) * Box(12, 12, 3, align=hang)    # sits 2 mm below
# [/snippet]


def fill(state, body, buttons):
    state.solid(body, section=is_cut_face)
    for button in buttons:
        state.solid(button, role="accent")
    return state


whole = fill(scene.state("Three buttons"), panel.part, (flush, proud, recessed))
whole.label((-24, 0, 6), "flush: level", "t")
whole.label((0, 0, 8), "proud: sticks out", "t")
whole.label((24, 0, 4), "recessed: sits below", "t")

side = fill(scene.state("Cut open"), cut_open(panel.part), [cut_open(b) for b in (flush, proud, recessed)])
side.line((-36, 0, 6), (36, 0, 6), role="dash")
side.label((-24, 0, 6), "flush", "t")
side.label((0, 0, 8), "proud by 2 mm", "t")
side.label((24, 0, 4), "recessed by 2 mm", "t")
side.label((33, 0, 6), "panel surface", "b")
scene.save(thumb=0)
