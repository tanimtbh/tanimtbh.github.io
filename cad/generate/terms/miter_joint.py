from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
with BuildPart() as bar:
    with BuildSketch():
        Polygon((0, 0), (32, 0), (32, 8), (8, 8), align=None)    # one end cut at 45°
    extrude(amount=8)

# the matching bar is a mirror image across the 45° line
diagonal = Plane(origin=(0, 0, 0), z_dir=(1, -1, 0))
other = mirror(bar.part, about=diagonal)
# [/snippet]


def cut_face(face):
    n = face.normal_at()
    return abs(abs(n.X) - abs(n.Y)) < 0.01 and abs(n.Z) < 0.01


apart = scene.state("Apart")
apart.solid(Pos(3, -3, 0) * bar.part, accent=cut_face)
apart.solid(Pos(-3, 3, 0) * other, role="mate", accent=cut_face)
apart.label((8, 1, 8), "both ends cut at 45°", "r")

joined = scene.state("Miter joint")
joined.solid(bar.part)
joined.solid(other, role="mate")
joined.line((0, 0, 8.03), (8, 8, 8.03), role="accent")
joined.label((4, 4, 8), "the seam runs corner to corner", "t")

# for comparison: a butt joint, where one square end simply meets the other bar
butt_a = extrude(Polygon((0, 0), (32, 0), (32, 8), (0, 8), align=None), amount=8)
butt_b = extrude(Polygon((0, 8), (8, 8), (8, 32), (0, 32), align=None), amount=8)
butt = scene.state("Butt joint (compare)")
butt.solid(butt_a)
butt.solid(butt_b, role="mate")
butt.line((0, 8, 8.03), (8, 8, 8.03), role="accent")
butt.label((4, 8, 8), "one bar just stops against the other", "t")
scene.save(thumb=0)
