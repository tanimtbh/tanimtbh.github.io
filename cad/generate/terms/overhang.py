from build123d import *
from common import Scene, is_flat

# Looked at from slightly below, so the undersides are visible.
scene = Scene(__file__, view=(0.6, -1.5, -0.45))

with BuildPart() as part:
    with BuildSketch(Plane.XZ):
        with BuildLine():
            Polyline(
                (-5, 0), (5, 0), (5, 20), (22, 20), (22, 30),
                (-22, 30), (-22, 27), (-5, 10),
                close=True,
            )
        make_face()
    extrude(amount=7, both=True)

support = Pos(13.75, 0, 10) * Box(16.5, 14, 20)


def flat_underside(face):
    return is_flat(face) and face.normal_at().Z < -0.99 and face.center().Z > 1


def plate(state):
    state.line((-30, -14, 0), (30, -14, 0), (30, 14, 0), (-30, 14, 0), (-30, -14, 0), role="faint")
    state.label((-30, -14, 0), "print bed", "b")
    return state


bare = plate(scene.state("Overhangs"))
bare.solid(part.part, accent=flat_underside)
bare.label((-13.5, -7, 18.5), "45° slope: prints fine", "l")
bare.label((14, -7, 20), "90° flat: nothing below it", "r")

held = plate(scene.state("With support"))
held.solid(part.part, accent=flat_underside)
held.solid(support, role="support", edges="faint")
held.label((14, -7, 8), "support material", "r")
scene.save(thumb=0)
