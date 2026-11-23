from build123d import *
from common import Scene, cut_open, is_cut_face, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    with BuildSketch(Plane.XZ):                     # side view: a block with a sloped top
        Polygon((0, 0), (40, 0), (40, 10), (0, 26), align=None)
    extrude(amount=12, both=True)

    slope = part.faces().sort_by(Axis.Z)[-1]        # the sloped face
    normal = slope.normal_at()                      # the direction pointing straight out of it

    with Locations(slope):                          # a location on the face, facing along its normal
        Hole(radius=3, depth=8)                     # so the hole goes in at 90° to the slope
# [/snippet]

centre = slope.center()
tip = centre + normal * 16


def sloped(face):
    return is_flat(face) and abs(face.normal_at().Z - normal.Z) < 0.01


words = scene.state("Parallel, perpendicular")
words.solid(part.part, accent=lambda f: is_flat(f) and abs(f.normal_at().Y) > 0.99)
words.label((30, -12, 6), "front and back: parallel", "b")
words.label((40, 4, 10), "end: at 90° to the bottom", "t")

out = scene.state("Normal")
out.solid(part.part, accent=sloped)
out.arrow(centre, tip, width=0.7)
out.line(centre, centre + Vector(0, 0, 16), role="dash")
out.label(tip, "normal: straight out", "r")
out.label(centre + Vector(0, 0, 16), "straight up", "l")

hole = scene.state("Hole along the normal")
hole.solid(cut_open(part.part), section=is_cut_face, accent=lambda f: not is_flat(f))
hole.line(centre - normal * 12, tip, role="accent")
hole.label(tip, "the hole follows the normal", "t")
hole.label(centre - normal * 8, "perpendicular to the slope, not vertical", "b")
scene.save(thumb=1)
