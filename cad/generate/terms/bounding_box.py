from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(50, 30, 4, align=low)
    with Locations((-23, 0, 4)):
        Box(4, 30, 26, align=low)
    with Locations((8, 0, 4)):
        Cylinder(radius=9, height=10, align=low)

size = part.part.bounding_box().size
print(f"{size.X:.0f} × {size.Y:.0f} × {size.Z:.0f} mm")         # 50 × 30 × 30 mm

bed_x, bed_y, bed_z = 220, 220, 250                             # the build volume of your printer
fits = size.X <= bed_x and size.Y <= bed_y and size.Z <= bed_z
# [/snippet]


def crate(state, box):
    """Draw the twelve edges of a bounding box as dashed lines."""
    a, b = box.min, box.max
    for z in (a.Z, b.Z):
        state.line((a.X, a.Y, z), (b.X, a.Y, z), (b.X, b.Y, z), (a.X, b.Y, z), (a.X, a.Y, z), role="dash")
    for x, y in ((a.X, a.Y), (b.X, a.Y), (b.X, b.Y), (a.X, b.Y)):
        state.line((x, y, a.Z), (x, y, b.Z), role="dash")


box = part.part.bounding_box()
plain = scene.state("Bounding box")
plain.solid(part.part)
crate(plain, box)
plain.label((0, -15, 0), "50 mm in X", "b")
plain.label((25, 0, 0), "30 mm in Y", "r")
plain.label((25, 15, 15), "30 mm in Z", "r")

turned_part = Rot(Z=45) * part.part
turned_box = turned_part.bounding_box()
turned = scene.state("Turned 45°")
turned.solid(turned_part)
crate(turned, turned_box)
turned.label((0, turned_box.min.Y, 0), f"{turned_box.size.X:.1f} mm in X", "b")
turned.label((turned_box.max.X, 0, 0), f"{turned_box.size.Y:.1f} mm in Y", "r")
turned.label((0, turned_box.max.Y, 30), "same part, bigger box", "t")
scene.save(thumb=0)
