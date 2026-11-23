from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    Box(46, 34, 14, align=low)
    offset(amount=-2, openings=case.faces().sort_by(Axis.Z)[-1])
    with Locations((17, 11, 2)):
        Cylinder(radius=3, height=8, align=low)             # a screw boss

# keep-out zone: the space the battery needs, with 1 mm to spare all round
battery_zone = Pos(-4, 0, 2) * Box(32, 22, 9, align=low)

overlap = case.part & battery_zone
print(overlap.volume)                                       # 0: nothing is in the zone
# [/snippet]

with BuildPart() as wrong:
    Box(46, 34, 14, align=low)
    offset(amount=-2, openings=wrong.faces().sort_by(Axis.Z)[-1])
    with Locations((9, 8, 2)):
        Cylinder(radius=3, height=8, align=low)

clear = scene.state("Zone is free")
clear.solid(case.part)
clear.solid(battery_zone, role="zone", edges="faint")
clear.label((-4, -11, 11), "keep-out zone: the battery goes here", "b")
clear.label((17, 11, 10), "boss stays outside", "t")

blocked = scene.state("Something is in it")
blocked.solid(wrong.part - battery_zone)
blocked.solid(battery_zone, role="zone", edges="faint")
blocked.solid(wrong.part & battery_zone, role="clash")
blocked.label((9, 8, 10), "this boss is in the zone: move it", "t")
scene.save(thumb=0)
