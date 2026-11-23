from build123d import *
from common import Scene, is_flat
from hardware import cap_screw, nema17

scene = Scene(__file__)

# [snippet]
face = 42.3             # NEMA 17: width of the square motor face
hole_spacing = 31.0     # between the four M3 screw holes, centre to centre
boss = 22.0             # the raised ring around the shaft
plate = 4

with BuildPart() as mount:
    Box(face + 8, face + 8, plate, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with Locations((0, 0, plate)):
        Hole(radius=boss / 2 + 0.25)                # 22.5 mm: the boss fits in and centres the motor
        with GridLocations(hole_spacing, hole_spacing, 2, 2):
            Hole(radius=3.4 / 2)                    # clearance holes for M3 screws
# [/snippet]

motor = nema17()
corners = [(x, y) for x in (-15.5, 15.5) for y in (-15.5, 15.5)]

alone = scene.state("NEMA 17 motor")
alone.solid(motor, role="steel", fine=False)
alone.line((-15.5, -15.5, 0.05), (15.5, -15.5, 0.05), role="accent")
alone.label((0, -15.5, 0.05), "31 mm between holes", "b")
alone.label((11, 0, 2), "22 mm boss", "r")
alone.label((0, 0, 24), "5 mm shaft", "t")
alone.line((-21.15, -21.2, -34), (21.15, -21.2, -34), role="accent")
alone.label((0, -21.2, -34), "42.3 mm face", "b")

plain = scene.state("Mount plate")
plain.solid(mount.part, accent=lambda f: not is_flat(f))
plain.label((11.25, 0, plate), "22.5 mm hole for the boss", "r")
plain.label((15.5, -15.5, plate), "4 × M3 clearance holes", "b")

fitted = scene.state("Assembled")
fitted.solid(motor, role="steel", fine=False)
fitted.solid(mount.part, accent=lambda f: not is_flat(f))
for x, y in corners:
    fitted.solid(Pos(x, y, plate) * cap_screw("M3", 8), role="steel")
fitted.label((25, 0, 2), "printed plate", "r")
fitted.label((15.5, -15.5, plate + 3), "M3 × 8 screws into the motor", "b")
scene.save(thumb=2)
