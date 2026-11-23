from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
length = 60         # change a number here ...
width = 30
thickness = 4
hole = 4.5
edge = 6            # from each hole centre to the edges

with BuildPart() as part:
    Box(length, width, thickness)
    with GridLocations(length - 2 * edge, width - 2 * edge, 2, 2):
        Hole(radius=hole / 2)       # ... and the holes follow
# [/snippet]


def plate(length):
    with BuildPart() as other:
        Box(length, width, thickness)
        with GridLocations(length - 2 * edge, width - 2 * edge, 2, 2):
            Hole(radius=hole / 2)
    return other.part


def picture(length, shape):
    state = scene.state(f"length = {length}")
    state.solid(shape, accent=lambda f: not is_flat(f))
    x, y, z = length / 2, -width / 2, thickness / 2 + 0.05
    state.line((x - edge, y + edge, z), (x, y + edge, z), role="accent")
    state.line((x - edge, y + edge, z), (x - edge, y, z), role="accent")
    state.label((x, y + edge, z), "edge = 6", "r")
    state.line((-x, y - 4, 0), (x, y - 4, 0), role="accent")
    state.label((0, y - 4, 0), f"length = {length}", "b")
    return state


picture(60, part.part)
picture(40, plate(40))
scene.save(thumb=0)
