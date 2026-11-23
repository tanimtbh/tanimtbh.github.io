from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
low = (Align.MIN, Align.CENTER, Align.MIN)

with BuildPart() as half:                    # build one side only
    Box(24, 22, 4, align=low)
    with Locations((20, 0, 4)):
        Box(4, 22, 14, align=low)
    with Locations((10, 0, 4)):
        Hole(radius=2.4)

with BuildPart() as part:
    insert(half.part)
    mirror(about=Plane.YZ)                   # copy it to the other side
# [/snippet]

plane = Plane.YZ.shift_origin((0, 0, 9))

one = scene.state("One half")
one.solid(half.part)
one.sheet(plane, 34, 30)
one.label((0, 11, 20), "mirror plane (YZ)", "l")

both = scene.state("Mirrored")
both.solid(half.part)
both.solid(mirror(half.part, about=Plane.YZ), role="accent")
both.sheet(plane, 34, 30)
both.label((-12, -11, 2), "mirrored copy", "l")
scene.save()
