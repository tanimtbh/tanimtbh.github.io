from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
box = Box(30, 30, 16)
cylinder = Pos(12, -12, 0) * Cylinder(radius=11, height=26)

joined = box + cylinder     # union: keep both
cut = box - cylinder        # subtract: remove the cylinder from the box
overlap = box & cylinder    # intersect: keep only the shared part
# [/snippet]


def from_cylinder(face):
    return not is_flat(face) or abs(face.center().Z) > 8.1


start = scene.state("Two bodies")
start.solid(box)
start.solid(cylinder, role="tint", edges="accent")

scene.state("Union").solid(joined, accent=from_cylinder)
scene.state("Subtract").solid(cut, accent=from_cylinder)

both = scene.state("Intersect")
both.solid(box, role="ghost", edges="faint")
both.solid(cylinder, role="ghost", edges="faint")
both.solid(overlap, role="accent")
scene.save(thumb=2)
