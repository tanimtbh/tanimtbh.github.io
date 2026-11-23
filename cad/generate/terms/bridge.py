from build123d import *
from common import Scene, is_flat

# Looked at from slightly below, so the undersides are visible.
scene = Scene(__file__, view=(0.6, -1.5, -0.45))


def profile(points):
    with BuildPart() as part:
        with BuildSketch(Plane.XZ):
            with BuildLine():
                Polyline(*points, close=True)
            make_face()
        extrude(amount=7, both=True)
    return part.part


arch = profile([(-22, 0), (-15, 0), (-15, 16), (15, 16), (15, 0), (22, 0), (22, 21), (-22, 21)])
arm = profile([(-22, 0), (-15, 0), (-15, 16), (15, 16), (15, 21), (-22, 21)])


def underside(face):
    return is_flat(face) and face.normal_at().Z < -0.99 and face.center().Z > 1


def plate(state):
    state.line((-30, -14, 0), (30, -14, 0), (30, 14, 0), (-30, 14, 0), (-30, -14, 0), role="faint")
    state.label((-30, -14, 0), "print bed", "b")
    return state


bridge = plate(scene.state("Bridge"))
bridge.solid(arch, accent=underside)
bridge.label((0, -7, 21), "bridge: held at both ends", "t")
bridge.line((-15, -7, 16), (15, -7, 16), role="accent")
bridge.label((0, -7, 16), "span 30 mm", "b")

hang = plate(scene.state("Overhang (compare)"))
hang.solid(arm, accent=underside)
hang.label((15, -7, 16), "held at one end only: it droops", "b")
scene.save(thumb=0)
