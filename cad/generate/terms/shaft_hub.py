from build123d import *
from common import Scene, is_flat

scene = Scene(__file__, view=(0.55, -1.0, 1.2))

# [snippet]
shaft = 5.0         # shaft diameter
across = 4.5        # measured across the flat of the D
gap = 0.1           # per side: the hub slides on, but does not wobble
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as hub:
    Cylinder(radius=9, height=10, align=low)
    with BuildSketch():                                     # the D-shaped hole
        Circle(shaft / 2 + gap)
        with Locations((0, across - shaft / 2 + gap)):      # everything beyond the flat
            Rectangle(shaft + 2, shaft, align=(Align.CENTER, Align.MIN), mode=Mode.SUBTRACT)
    extrude(amount=10, mode=Mode.SUBTRACT)
    with Locations((0, 5.5, 5)):                            # set screw hole, aimed at the flat
        Cylinder(radius=1.25, height=7, rotation=(90, 0, 0), mode=Mode.SUBTRACT)
# [/snippet]

rod = Cylinder(shaft / 2, 24, align=low) - Pos(0, across - shaft / 2, 6) * Box(
    shaft + 2, shaft, 18, align=(Align.CENTER, Align.MIN, Align.MIN))
grub = Pos(0, 5.6, 5) * Rot(90, 0, 0) * Cylinder(1.5, 6)


def d_flat(face):
    return is_flat(face) and abs(face.normal_at().Y) > 0.9


def bore(face):
    c = face.center()
    return (c.X ** 2 + c.Y ** 2) ** 0.5 < 3 and 0.1 < c.Z < 9.9


bare = scene.state("D-shaft")
bare.solid(rod, role="steel", accent=d_flat)
bare.label((0, 2, 18), "the flat", "r")
bare.label((2.5, 0, 3), "5 mm round", "r")

part = scene.state("Hub")
part.solid(hub.part, accent=lambda f: bore(f) or (not is_flat(f) and f.center().Y > 3 and abs(f.center().Z - 5) < 1))
part.label((-2.6, 0, 10), "D-shaped hole", "l")
part.label((0, 9, 5), "hole for a set screw", "r")

both = scene.state("Together")
both.solid(hub.part)
both.solid(Pos(0, 0, -6) * rod, role="steel", accent=d_flat)
both.solid(grub, role="steel", fine=False)
both.label((0, 8.6, 5), "set screw presses on the flat", "r")
both.label((-9, 0, 10), "hub", "l")
scene.save(thumb=2)
