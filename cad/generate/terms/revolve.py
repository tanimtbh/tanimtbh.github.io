from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    with BuildSketch(Plane.XZ) as profile:
        with BuildLine():
            Polyline(
                (4, 0), (16, 0), (16, 4), (8, 8),
                (8, 18), (16, 22), (16, 26), (4, 26),
                close=True,
            )
        make_face()
    revolve(axis=Axis.Z, revolution_arc=360)
# [/snippet]

half = revolve(profile.sketch, axis=Axis.Z, revolution_arc=180)
axis = ((0, 0, -6), (0, 0, 33))


def on_start_plane(face):
    return is_flat(face) and abs(face.center().Y) < 1e-6 and abs(face.normal_at().Y) > 0.99


start = scene.state("Profile")
start.solid(profile.sketch, role="accent", edges="accent")
start.line(*axis, role="dash")
start.label((0, 0, 33), "axis", "t")
start.label((16, 0, 13), "profile", "r")

mid = scene.state("Half turn")
mid.solid(half, accent=on_start_plane)
mid.line(*axis, role="dash")

full = scene.state("Full turn")
full.solid(part.part)
full.line(*axis, role="dash")
scene.save()
