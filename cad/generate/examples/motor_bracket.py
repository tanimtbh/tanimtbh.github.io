"""A printed bracket designed around a bought stepper motor, starting from its STEP file."""

import tempfile
from pathlib import Path

from build123d import *
from example import Example, show

ex = Example(__file__, view=(-1.0, -1.15, 1.0))


def _stand_in_motor() -> Part:
    """What a maker's STEP file of a NEMA 17 motor holds, in simple form.
    Origin at the centre of the mounting face, shaft along +Z."""
    down = (Align.CENTER, Align.CENTER, Align.MAX)
    up = (Align.CENTER, Align.CENTER, Align.MIN)
    body = Box(42.3, 42.3, 40, align=down)
    body = chamfer(body.edges().filter_by(Axis.Z), 4.5)
    body += Cylinder(11, 2, align=up) + Cylinder(2.5, 24, align=up)
    for at in GridLocations(31, 31, 2, 2):
        body -= at * Cylinder(1.5, 4.5, align=down)
    return body


# the website has no maker's file, so write one first
vendor = Path(tempfile.mkdtemp()) / "nema17.step"
export_step(_stand_in_motor(), vendor)
import_file = str(vendor)

# [snippet: motor.py]
#> """NEMA 17 stepper motor. A bought part: the maker's STEP file, never changed."""
#> from build123d import *
#> from ocp_vscode import show
#>
#> motor = import_step("vendor/nema17.step")
motor = import_step(import_file)  # [hide]
motor.label = "NEMA 17 stepper"

# measure it before designing anything around it
box = motor.bounding_box()
print(f"size: {box.size.X:.1f} x {box.size.Y:.1f} x {box.size.Z:.1f} mm")
print(f"z from {box.min.Z:.1f} to {box.max.Z:.1f}: the origin is on the mounting face")

round_faces = motor.faces().filter_by(GeomType.CYLINDER)
screw_holes = [f for f in round_faces if abs(f.radius - 1.5) < 0.05]
xs = sorted({round(f.center().X, 2) for f in screw_holes})
print(f"{len(screw_holes)} M3 holes, {xs[-1] - xs[0]:.1f} mm apart")
print("other diameters:", sorted({round(2 * f.radius, 2) for f in round_faces if f.radius > 2}))

#>
#> if __name__ == "__main__":
#>     show(motor)
# [/snippet]


# [snippet: motor_bracket.py]
#> from build123d import *
#> from ocp_vscode import show
#>
face = 42.3                 # NEMA 17 mounting face, square
hole_spacing = 31.0         # the four M3 holes, centre to centre
boss_hole_d = 22.5          # the motor's 22 mm centring boss, plus clearance
m3_clear_d = 3.4

plate_w, plate_t = 52.0, 5.0        # upright plate the motor bolts to
foot_d, foot_t = 46.0, 5.0          # foot under the motor
motor_gap = 7.0                     # room under the motor for the heads of the M5 screws
rib_t = 3.0
m5_clear_d = 5.5
foot_holes_y = (17.0, 35.0)

shaft_z = foot_t + motor_gap + face / 2       # height of the shaft above the underside
plate_h = shaft_z + face / 2


def make_bracket() -> Part:
    """Origin: on the underside, at the middle of the front edge. The motor sits behind
    the upright plate (toward +Y) and its shaft points to the front (toward -Y)."""
    front = (Align.CENTER, Align.MIN, Align.MIN)
    with BuildPart() as bracket:
        Box(plate_w, foot_d, foot_t, align=front)        # foot
        Box(plate_w, plate_t, plate_h, align=front)      # upright plate

        # a large gusset on each side, outside the motor
        for x in (-plate_w / 2, plate_w / 2 - rib_t):
            with BuildSketch(Plane.YZ.offset(x)):
                Polygon((plate_t, foot_t), (foot_d, foot_t), (plate_t, plate_h), align=None)
            extrude(amount=rib_t)

        # the motor's face pattern, cut through the upright plate
        with BuildSketch(Plane.XZ):
            with Locations((0, shaft_z)):
                Circle(boss_hole_d / 2)
                with GridLocations(hole_spacing, hole_spacing, 2, 2):
                    Circle(m3_clear_d / 2)
        extrude(amount=plate_t, both=True, mode=Mode.SUBTRACT)

        # two M5 holes in the foot, to bolt the bracket down
        with Locations(*[(0, y, foot_t) for y in foot_holes_y]):
            Hole(m5_clear_d / 2)
    bracket.part.label = "motor bracket"
    return bracket.part

#>
#> if __name__ == "__main__":
#>     show(make_bracket())
# [/snippet]


# [snippet: assembly.py]
#> from build123d import *
#> from ocp_vscode import show
#> from motor import motor
#> from motor_bracket import make_bracket, plate_t, shaft_z, hole_spacing
#> from hardware import cap_screw
from hardware import cap_screw as _cap  # [hide]
cap_screw = lambda d, length, head_d, head_h: _cap(f"M{d:g}", length)  # [hide]

screw_len = 8.0
thread_depth = 4.5          # depth of the M3 threads in the motor face, from the datasheet

bracket = make_bracket()

# turn the motor so its shaft points to the front, then put its face on the back of the plate
turned = Rot(90, 0, 0)
motor_placed = Pos(0, plate_t, shaft_z) * turned * motor
screws = [
    Pos(x, 0, shaft_z + z) * turned * cap_screw(3, screw_len, 5.5, 3)
    for x in (-hole_spacing / 2, hole_spacing / 2)
    for z in (-hole_spacing / 2, hole_spacing / 2)
]

# ---- checks ----
overlap = (bracket & motor_placed).volume
print(f"bracket and motor overlap: {overlap:.3f} mm3")
assert overlap < 0.001, "the bracket collides with the motor"

grip = screw_len - plate_t
print(f"each screw goes {grip:.1f} mm into the motor (the thread is {thread_depth} mm deep)")
assert 3.0 <= grip <= thread_depth, "wrong screw length for this plate thickness"

drive = Compound(label="motor mount", children=[bracket, motor_placed, *screws])
show(drive)
# [/snippet]

# ---- pictures -------------------------------------------------------------

print("   bracket", bracket.bounding_box().size, bracket.is_valid, "shaft_z", shaft_z, "plate_h", plate_h)


def pattern(face):
    box = face.bounding_box()
    return box.max.Y < plate_t + 0.01 and box.min.Y > -0.01 and face.geom_type == GeomType.CYLINDER


def rib(face):
    box = face.bounding_box()
    return box.size.X < rib_t + 0.01 and abs(abs(face.center().X) - (plate_w / 2 - rib_t / 2)) < rib_t / 2 + 0.01 \
        and box.min.Y > plate_t - 0.01 and box.min.Z > foot_t - 0.01 and box.size.Y > 1


upright = Pos(0, 0, 40) * motor
s = ex.state("1 Motor (STEP file)")
s.solid(upright, role="steel", fine=(0.1, 0.32))
s.label((-15.5, -15.5, 40), "4 × M3, 31 mm apart", "l")
s.label((11, 0, 42), "boss 22 mm", "r")
s.label((0, 0, 64), "shaft 5 mm", "t")
s.label((0, -21.15, 10), "42.3 mm square", "b")

s = ex.state("2 Bracket")
s.solid(bracket, accent=lambda f: pattern(f) or rib(f))
s.label((0, 0, plate_h), "22.5 mm hole for the boss", "t")
s.label((-plate_w / 2, 30, 18), "gusset", "l")

s = ex.state("3 Motor mounted")
s.solid(bracket)
s.solid(motor_placed, role="steel", fine=(0.1, 0.32))
for item in screws:
    s.solid(item, role="steel")
s.label((0, -19, shaft_z), "shaft points to −Y", "l")
s.label((-hole_spacing / 2, -3, shaft_z + hole_spacing / 2), "M3 × 8 screw", "t")


def chop(shape):
    """Remove the left half, so the inside shows."""
    return shape - Pos(-500, 0, 0) * Box(1000, 1000, 1000)


def chopped(face):
    return face.geom_type == GeomType.PLANE and abs(face.center().X) < 1e-6 and abs(face.normal_at().X) > 0.999


s = ex.state("4 Cut open")
s.solid(chop(bracket), section=chopped)
s.solid(chop(motor_placed), role="steel", section=chopped, fine=(0.1, 0.32))
for item in screws:
    if item.center().X > 0:
        s.solid(item, role="steel")
s.label((0, 28, foot_t + motor_gap / 2), "7 mm gap", "b")
s.label((0, plate_t - 1, plate_h), "boss in its hole", "t")
ex.save(thumb=2)
