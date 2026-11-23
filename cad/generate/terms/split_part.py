from build123d import *
from common import Scene, is_flat

scene = Scene(__file__)

# [snippet]
with BuildPart() as rail:
    Box(90, 16, 10)
    with GridLocations(30, 0, 3, 1):
        Hole(radius=2.2)

cut = Plane.YZ                          # the cutting plane: across the middle, facing +X
right = split(rail.part, bisect_by=cut, keep=Keep.TOP)       # the side the plane faces
left = split(rail.part, bisect_by=cut, keep=Keep.BOTTOM)     # the other side

# two 3 mm pins line the halves up again: each hole goes 5 mm into both halves
pin_holes = [Pos(0, y, 0) * Cylinder(1.6, 10, rotation=(0, 90, 0)) for y in (-5, 5)]
left -= pin_holes
right -= pin_holes
# [/snippet]

whole = scene.state("One part")
whole.solid(rail.part)
whole.sheet(Plane.YZ, 26, 20)
whole.label((0, -13, 10), "cutting plane", "t")
whole.label((45, 0, 5), "90 mm: too long for the printer", "b")


def cut_face(face):
    return is_flat(face) and abs(face.center().X) < 0.01


pins = [Pos(0, y, 0) * Cylinder(1.5, 9.6, rotation=(0, 90, 0)) for y in (-5, 5)]
halves = scene.state("Split in two")
halves.solid(Pos(-9, 0, 0) * left, accent=lambda f: cut_face(Pos(9, 0, 0) * f) or (not is_flat(f) and abs(f.center().X + 11.5) < 3))
halves.solid(Pos(9, 0, 0) * right, role="mate")
for pin in pins:
    halves.solid(pin, role="steel")
halves.label((-9, -8, 5), "cut face", "b")
halves.label((0, 5, 1.5), "alignment pins", "t")
scene.save(thumb=1)
