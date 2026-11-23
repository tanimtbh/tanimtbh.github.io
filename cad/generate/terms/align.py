from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
# The same box three times. Only the place of the origin (0, 0, 0) changes.
centred = Box(30, 20, 12)                                                    # the default
corner = Box(30, 20, 12, align=(Align.MIN, Align.MIN, Align.MIN))
on_bed = Box(30, 20, 12, align=(Align.CENTER, Align.CENTER, Align.MIN))
# [/snippet]


def picture(label, box, note):
    state = scene.state(label)
    state.solid(box, role="tint")
    state.triad(24, width=0.6)
    state.dots([(0, 0, 0)], 1.2)
    state.label((0, 0, 0), "origin", "l")
    state.label((box.center().X, box.center().Y - 10, box.center().Z - 6), note, "b")
    return state


picture("Centred", centred, "origin in the middle of the box")
picture("Corner at origin", corner, "origin at the lowest corner")
picture("Sitting on the plane", on_bed, "centred, with the bottom at z = 0")
scene.save(thumb=2)
