from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
pin = 3.0           # pin diameter
knuckle = 7.0       # outside diameter of the barrel around the pin
gap = 0.3           # between knuckles, and around the pin
length = 30         # along the hinge axis (Y)
seg = (length - 4 * gap) / 5        # five knuckles with four gaps between them
low = (Align.CENTER, Align.CENTER, Align.MIN)


def leaf(side, mine):
    """side: -1 is the left leaf, +1 the right. mine: the knuckles it owns."""
    with BuildPart() as part:
        with Locations((side * 14, 0, 0)):
            Box(20, length, 3, align=low)                           # the flat leaf
        for i in mine:
            y = -length / 2 + seg / 2 + i * (seg + gap)
            with Locations((0, y, knuckle / 2)):
                Cylinder(knuckle / 2, seg, rotation=(90, 0, 0))     # one knuckle
            with Locations((side * 2.25, y, 0)):
                Box(4.5, seg, 3, align=low)                         # joins it to the leaf
        with Locations((0, 0, knuckle / 2)):                        # hole for the pin
            Cylinder(pin / 2 + gap, length, rotation=(90, 0, 0), mode=Mode.SUBTRACT)
    return part.part


left = leaf(-1, (0, 2, 4))      # the knuckles alternate
right = leaf(+1, (1, 3))
# [/snippet]

axis = Pos(0, 0, knuckle / 2)
rod = axis * Rot(90, 0, 0) * Cylinder(pin / 2, length + 2)


def swing(angle):
    return axis * Rot(0, -angle, 0) * axis.inverse() * right


flat = scene.state("Flat")
flat.solid(left, fine=False)
flat.solid(right, role="mate", fine=False)
flat.solid(rod, role="steel")
flat.label((0, -6.1, 7), "knuckles alternate", "t")
flat.label((0, -16, 3.5), "pin", "b")

opened = scene.state("Opened 90°")
opened.solid(left, fine=False)
opened.solid(swing(90), role="mate", fine=False)
opened.solid(rod, role="steel")
opened.line((0, -20, 3.5), (0, 20, 3.5), role="dash")
opened.label((0, 19, 3.5), "axis: centre of the pin", "t")

apart = scene.state("Apart")
apart.solid(Pos(-6, 0, 0) * left, fine=False)
apart.solid(Pos(6, 0, 0) * right, role="mate", fine=False)
apart.solid(Pos(0, -24, 0) * rod, role="steel")
apart.label((-6, 0, 7), "3 knuckles", "t")
apart.label((6, -6.1, 7), "2 knuckles", "r")
apart.label((0, -40, 3.5), "pin slides out", "b")
scene.save(thumb=1)
