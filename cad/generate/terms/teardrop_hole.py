from build123d import *
from common import Scene, is_flat

scene = Scene(__file__, view=(0.55, -1.5, 0.45))

low = (Align.CENTER, Align.CENTER, Align.MIN)

# [snippet]
radius = 5
reach = radius * 0.7071       # where a 45° line touches the circle

with BuildPart() as part:
    Box(34, 10, 28, align=(Align.CENTER, Align.CENTER, Align.MIN))     # a standing wall
    with BuildSketch(Plane.XZ):                                        # seen from the front
        with Locations((0, 14)):
            Circle(radius)
            # a pointed roof on top of the circle: no part of it is flatter than 45°
            Polygon((-reach, reach), (0, radius * 1.4142), (reach, reach), align=None)
    extrude(amount=5, both=True, mode=Mode.SUBTRACT)
# [/snippet]

with BuildPart() as plain:
    Box(34, 10, 28, align=low)
    with BuildSketch(Plane.XZ):
        with Locations((0, 14)):
            Circle(radius)
    extrude(amount=5, both=True, mode=Mode.SUBTRACT)


def hole(face):
    c = face.center()
    return abs(c.Y) < 0.1 and abs(c.X) < 6 and 8 < c.Z < 22


def bed(state):
    state.line((-22, -10, 0), (22, -10, 0), (22, 10, 0), (-22, 10, 0), (-22, -10, 0), role="faint")
    return state


round_hole = bed(scene.state("Round hole"))
round_hole.solid(plain.part, accent=hole)
round_hole.label((0, -5, 19), "the top is almost flat: it sags", "t")

drop = bed(scene.state("Teardrop hole"))
drop.solid(part.part, accent=hole)
drop.label((0, -5, 21.07), "45° point: prints cleanly", "t")
drop.label((-22, -10, 0), "print bed", "b")
scene.save()
