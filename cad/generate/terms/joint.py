from build123d import *
from common import Scene

scene = Scene(__file__, view=(0.7, -1.2, 1.0))

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

base = Box(40, 30, 6, align=low) + Pos(-10, 0, 6) * Cylinder(3, 5, align=low)     # a plate with a pin
arm = Pos(13, 0, 0) * Box(36, 10, 4, align=low) - Cylinder(3.2, 4, align=low)     # a bar with a hole at its origin

# a joint is a named point on a part: where it connects, and how it may move
RevoluteJoint("pin", base, axis=Axis((-10, 0, 6), (0, 0, 1)))      # may turn about the pin
RigidJoint("hole", arm, Location((0, 0, 0)))                       # the underside of the hole

# connecting the two joints moves the arm into place: no coordinates to work out
base.joints["pin"].connect_to(arm.joints["hole"], angle=0)
# [/snippet]

placed = Pos(0, 0, 0) * arm
base.joints["pin"].connect_to(arm.joints["hole"], angle=50)
swung = Pos(0, 0, 0) * arm
loose = Pos(-4, -34, 12) * (Pos(13, 0, 0) * Box(36, 10, 4, align=low) - Cylinder(3.2, 4, align=low))

before = scene.state("Two joints")
before.solid(base)
before.solid(loose, role="mate")
before.dots([(-10, 0, 6), (-4, -34, 12)], 1.3)
before.line((-10, 0, 6), (-10, 0, 22), role="accent")
before.label((-10, 0, 22), "joint “pin”: may turn about this axis", "t")
before.label((-4, -34, 12), "joint “hole”", "b")

joined = scene.state("Connected")
joined.solid(base)
joined.solid(placed, role="mate")
joined.dots([(-10, 0, 6)], 1.3)
joined.label((21, 0, 10), "moved onto the pin", "r")

turned = scene.state("Turned 50°")
turned.solid(base)
turned.solid(placed, role="ghost", edges="faint")
turned.solid(swung, role="mate")
turned.label((-10, 0, 11), "same joint, angle=50", "l")
scene.save(thumb=1)
