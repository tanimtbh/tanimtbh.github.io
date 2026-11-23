from build123d import *
from common import Scene

scene = Scene(__file__)

# An L-shaped hook: a base with a thin arm.
with BuildPart() as hook:
    with BuildSketch(Plane.XZ):
        Polygon((0, 0), (26, 0), (26, 6), (5, 6), (5, 30), (0, 30), align=None)
    extrude(amount=6, both=True)

standing = hook.part
lying = Pos(0, 0, 6) * Rot(-90, 0, 0) * hook.part      # the same part laid on its side


def layers(state, part, step=2.0):
    """Draw the outline of every few printed layers."""
    top = part.bounding_box().max.Z
    z = step
    while z < top - 0.01:
        state.edges(section(part, section_by=Plane.XY.offset(z)).edges(), role="faint")
        z += step
    return state


def plate(state, near, far):
    state.line((-8, near, 0), (34, near, 0), (34, far, 0), (-8, far, 0), (-8, near, 0), role="faint")
    return state


weak = plate(scene.state("Arm standing up: weak"), -14, 14)
layers(weak.solid(standing), standing)
weak.line((0, -6, 8), (5, -6, 8), (5, 6, 8), role="accent")
weak.label((5, -6, 8), "snaps here, between two layers", "r")
weak.arrow((16, 0, 27), (6.5, 0, 27), width=0.8)
weak.label((16, 0, 27), "push", "r")

strong = plate(scene.state("Arm lying down: strong"), -8, 38)
layers(strong.solid(lying), lying)
strong.label((2.5, 22, 12), "layers run along the arm", "t")
strong.arrow((16, 27, 6), (6.5, 27, 6), width=0.8)
strong.label((16, 27, 6), "push", "r")
scene.save(thumb=0)
