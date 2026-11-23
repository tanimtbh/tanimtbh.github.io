from build123d import *
from common import Scene, is_flat
from hardware import pan_screw

scene = Scene(__file__, view=(0.55, -1.5, 0.45))

# [snippet]
head = 8.5        # round entry: the screw head passes through
shank = 4.5       # narrow slot: only the shank of the screw fits
travel = 8        # how far the part drops onto the screw
thick = 3

with BuildPart() as plate:
    Box(30, 36, thick, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with BuildSketch(Plane.XY.offset(thick)):
        Circle(head / 2)
        with Locations((0, travel / 2)):
            SlotCenterToCenter(travel, shank, rotation=90)
    extrude(amount=-thick, mode=Mode.SUBTRACT)
# [/snippet]

# stand the plate up, like the back of a box hanging on a wall
upright = Rot(90, 0, 0) * plate.part
wall = Pos(0, 0.3, 0) * Box(46, 5, 52, align=(Align.CENTER, Align.MIN, Align.CENTER))
screw = Pos(0, -3.4, travel) * Rot(90, 0, 0) * pan_screw(7.5, 2.6, 4.0, 9)


def keyhole(face):
    c = face.center()
    return abs(c.X) < 4.3 and -4.3 < c.Z < travel + 2.3 and not (is_flat(face) and abs(face.normal_at().Y) > 0.9)


alone = scene.state("Keyhole")
alone.solid(upright, accent=keyhole)
alone.label((4.2, -3, 0), "1. screw head goes in", "r")
alone.label((2.2, -3, travel), "2. part drops onto the shank", "r")

hung = scene.state("On the screw")
hung.solid(wall, role="mate")
hung.solid(upright, accent=keyhole)
hung.solid(screw, role="steel")
hung.label((3.7, -5, travel), "head is wider than the slot", "r")
hung.label((23, 3, -20), "wall", "r")
scene.save(thumb=0)
