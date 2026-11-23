from build123d import *
from common import Scene, cut_open, is_cut_face

scene = Scene(__file__)

# [snippet]
arm_length = 16     # longer = bends more easily
arm_thick = 2
hook = 1.5          # how far the hook sticks out

with BuildPart() as clip:
    with BuildSketch(Plane.XZ):              # side view, arm hanging down
        Polygon(
            (0, 0), (arm_thick, 0),
            (arm_thick, -arm_length + 5.6),          # flat catch face
            (arm_thick + hook, -arm_length + 5.6),
            (arm_thick + hook, -arm_length + 4.6),
            (arm_thick, -arm_length),                # lead-in slope
            (0, -arm_length),
            align=None,
        )
    extrude(amount=4, both=True)             # 8 mm wide
# [/snippet]

# The lid carries the clip. The box wall has a window for the hook.
lid = Pos(-1.5, 0, 26) * Box(21, 24, 3, align=(Align.CENTER, Align.CENTER, Align.MIN))
lid += Pos(3.6, 0, 26) * clip.part

wall = Pos(6, 0, 0) * Box(3, 24, 26, align=(Align.MIN, Align.CENTER, Align.MIN))
wall -= Pos(6, 0, 9.5) * Box(3, 10, 6.5, align=(Align.MIN, Align.CENTER, Align.MIN))
wall += Pos(-12, 0, -3) * Box(21, 24, 3, align=(Align.MIN, Align.CENTER, Align.MIN))


def clip_face(face):
    c = face.center()
    return abs(c.Y) < 4.01 and c.Z < 25.99 and 3.5 < c.X < 7.2


lift = Pos(0, 0, 11)

apart = scene.state("Apart")
apart.solid(wall, role="mate")
apart.solid(lift * lid, accent=lambda f: clip_face(Pos(0, 0, -11) * f))
apart.label((7.1, -4, 26), "hook", "r")
apart.label((9, 0, 12.5), "window for the hook", "r")
apart.arrow((-6, -12, 36), (-6, -12, 29), width=0.7)

shut = scene.state("Snapped in")
shut.solid(wall, role="mate")
shut.solid(lid, accent=clip_face)
shut.label((7.1, -4, 15), "hook holds the lid down", "r")

inside = scene.state("Cut open")
inside.solid(cut_open(wall), role="mate")
inside.solid(cut_open(lid), section=is_cut_face, accent=clip_face)
inside.label((4.6, 0, 21), "thin arm bends like a spring", "l")
inside.label((6.4, 0, 15.6), "flat face catches", "r")
inside.label((6.3, 0, 12), "slope pushes the arm aside", "b")
scene.save(thumb=2)
