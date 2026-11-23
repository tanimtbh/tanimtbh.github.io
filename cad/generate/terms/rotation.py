import math

from build123d import *
from common import Scene

scene = Scene(__file__, view=(0.45, -1.0, 1.45))

# [snippet]
arm = Box(30, 8, 4, align=(Align.MIN, Align.CENTER, Align.MIN))     # starts at the origin, points along +X

turned = Rot(Z=30) * arm            # +30° about the Z axis: turns around the origin
back = Rot(Z=-30) * arm             # a negative angle turns the other way

# to turn it around its own middle: move the middle to the origin, turn, move back
on_the_spot = Pos(15, 0, 0) * Rot(Z=30) * Pos(-15, 0, 0) * arm
# [/snippet]


def arc(radius, start, end, centre=(0, 0)):
    step = 3 if end > start else -3
    return [(centre[0] + radius * math.cos(math.radians(a)), centre[1] + radius * math.sin(math.radians(a)), 4.05)
            for a in range(start, end + step, step)]


def picture(label, shape, pivot, start, end, note, note_side="r"):
    state = scene.state(label)
    state.solid(arm, role="ghost", edges="faint")
    state.solid(shape, role="accent")
    state.arrow((*pivot, 0), (*pivot, 16), role="z", width=0.6)
    state.line(*arc(22 if pivot == (0, 0) else 13, start, end, pivot), role="accent")
    state.label((*pivot, 16), "seen from above (+Z), turning about this point", "t")
    radius = 22 if pivot == (0, 0) else 13
    middle = math.radians((start + end) / 2)
    state.label((pivot[0] + radius * math.cos(middle), pivot[1] + radius * math.sin(middle), 4.05), note, note_side)
    return state


picture("+30° about Z", turned, (0, 0), 0, 30, "+30°: counter-clockwise", "b")
picture("−30° about Z", back, (0, 0), 0, -30, "−30°: clockwise", "b")
picture("About its middle", on_the_spot, (15, 0), 0, 30, "+30°, on the spot", "b")
scene.save(thumb=0)
