"""A printed holder designed around a bought micro servo, from datasheet numbers only."""

from build123d import *
from common import cut_open, is_cut_face
from example import Example, show

ex = Example(__file__)

# [snippet: servo.py]
#> """SG90 micro servo. A bought part, modelled from its datasheet: reference only."""
#> from build123d import *
#> from ocp_vscode import show
#>
body_l, body_w = 22.8, 12.6       # the case, seen from above
body_h = 26.7                     # bottom of the case to the top of the case
tab_span, tab_t = 32.5, 2.5       # the two mounting tabs, end to end, and their thickness
tab_z = 16.0                      # bottom of the case to the underside of the tabs
tab_hole_d = 2.0
tab_hole_spacing = 27.8
shaft_x = 5.1                     # the output shaft is off-centre, toward +X
shaft_d = 4.8
total_h = 34.5                    # bottom of the case to the top of the shaft
horn_d = 40.0                     # the circle swept by the arm on the shaft


def make_servo() -> Part:
    """Origin: centre of the underside of the tabs, the face the servo rests on."""
    low = (Align.CENTER, Align.CENTER, Align.MIN)
    with BuildPart() as servo:
        with Locations((0, 0, -tab_z)):
            Box(body_l, body_w, body_h, align=low)
        Box(tab_span, body_w, tab_t, align=low)
        with Locations((0, 0, tab_t)):
            with GridLocations(tab_hole_spacing, 0, 2, 1):
                Hole(tab_hole_d / 2, depth=tab_t)
        with Locations((shaft_x, 0, body_h - tab_z)):
            Cylinder(5.9, 4.0, align=low)                                  # round gear cover
            Cylinder(shaft_d / 2, total_h - body_h, align=low)             # output shaft
    servo.part.label = "SG90 servo"
    return servo.part


def horn_zone() -> Part:
    """Keep-out zone: the space the arm sweeps, from the top of the case upward.
    Nothing else may enter it."""
    zone = Pos(shaft_x, 0, body_h - tab_z) * Cylinder(
        horn_d / 2, total_h - body_h + 2.0, align=(Align.CENTER, Align.CENTER, Align.MIN)
    )
    zone.label = "keep-out: servo arm"
    return zone

#>
#> if __name__ == "__main__":
#>     show(make_servo(), horn_zone(), names=["servo", "keep-out"], alphas=[1, 0.3])
# [/snippet]


# [snippet: servo_holder.py]
#> from build123d import *
#> from ocp_vscode import show
#> from servo import body_l, body_w, tab_span, tab_z, tab_hole_spacing
#>
clearance = 0.2             # per side, between the servo and its pocket
wall = 3.0                  # side walls of the pocket
floor = 2.0
spare = 0.5                 # gap under the servo, so it hangs on its tabs
pilot_d, pilot_depth = 1.6, 8.0       # for the small screws that come with the servo
cable_w, cable_h = 9.0, 4.0           # window for the plug and cable
ear_l, ear_t = 10.0, 3.0              # mounting ear at each end
ear_slot_l, ear_slot_w = 7.0, 3.4     # M3 slot

pocket_l = body_l + 2 * clearance
pocket_w = body_w + 2 * clearance
pocket_depth = tab_z + spare
block_l = tab_span + 4.0
block_w = pocket_w + 2 * wall
block_h = floor + pocket_depth


def make_holder() -> Part:
    """Origin: centre of the underside. The servo drops in from above."""
    low = (Align.CENTER, Align.CENTER, Align.MIN)
    with BuildPart() as holder:
        Box(block_l, block_w, block_h, align=low)
        Box(block_l + 2 * ear_l, block_w, ear_t, align=low)          # ears

        with Locations((0, 0, block_h)):
            # pocket for the case of the servo
            Box(pocket_l, pocket_w, pocket_depth, align=(Align.CENTER, Align.CENTER, Align.MAX), mode=Mode.SUBTRACT)
            # pilot holes under the holes in the tabs
            with GridLocations(tab_hole_spacing, 0, 2, 1):
                Hole(pilot_d / 2, depth=pilot_depth)

        # window through the end wall facing -X, at the bottom of the pocket
        with Locations((-block_l / 2, 0, floor)):
            Box((block_l - pocket_l) / 2 + 1, cable_w, cable_h,
                align=(Align.MIN, Align.CENTER, Align.MIN), mode=Mode.SUBTRACT)

        # an M3 slot in each ear
        with BuildSketch(Plane.XY.offset(ear_t)):
            with GridLocations(block_l + ear_l, 0, 2, 1):
                SlotOverall(ear_slot_l, ear_slot_w)
        extrude(amount=-ear_t, mode=Mode.SUBTRACT)
    holder.part.label = "servo holder"
    return holder.part

#>
#> if __name__ == "__main__":
#>     show(make_holder())
# [/snippet]


# [snippet: assembly.py]
#> from build123d import *
#> from ocp_vscode import show
#> from servo import make_servo, horn_zone
#> from servo_holder import make_holder, block_h

holder = make_holder()
on_top = Pos(0, 0, block_h)              # the tabs rest on the top face of the holder
servo = on_top * make_servo()
zone = on_top * horn_zone()

# ---- checks ----
overlap = (holder & servo).volume
print(f"holder and servo overlap: {overlap:.3f} mm3")
assert overlap < 0.001, "the servo does not fit in the holder"

blocked = (holder & zone).volume
print(f"holder inside the keep-out zone: {blocked:.3f} mm3")
assert blocked < 0.001, "the holder is in the way of the servo arm"

show(holder, servo, zone, names=["holder", "servo", "keep-out"], alphas=[1, 1, 0.3])
# [/snippet]

# ---- pictures -------------------------------------------------------------

print("   holder", holder.bounding_box().size, holder.is_valid, "servo", make_servo().bounding_box().size)


def pocket(face):
    box = face.bounding_box()
    return abs(face.center().X) < pocket_l / 2 + 0.01 and abs(face.center().Y) < pocket_w / 2 + 0.01 \
        and box.min.Z > floor - 0.01 and box.size.X < pocket_l + 0.01 and box.size.Y < pocket_w + 0.01 \
        and box.max.Z < block_h + 0.01 and not (box.size.Z < 0.01 and box.min.Z > block_h - 0.01)


def window(face):
    box = face.bounding_box()
    return box.max.X < -pocket_l / 2 + 0.01 and box.max.Z < floor + cable_h + 0.01 and box.min.Z > floor - 0.01 \
        and box.size.Y < cable_w + 0.01 and box.min.X > -block_l / 2 - 0.01


alone = Pos(0, 0, tab_z) * make_servo()
s = ex.state("1 Servo (bought)")
s.solid(alone, role="steel", fine=(0.1, 0.32))
s.label((tab_span / 2, 0, tab_z), "tab", "r")
s.label((shaft_x, 0, total_h), "output shaft", "t")
s.label((-body_l / 2, 0, 3), "cable", "l")

s = ex.state("2 Holder")
s.solid(holder, accent=lambda f: pocket(f) or window(f))
s.label((0, pocket_w / 2, block_h), "pocket", "t")
s.label((-block_l / 2, 0, floor + cable_h / 2), "cable window", "b")
s.label((block_l / 2 + ear_l / 2, 0, ear_t), "M3 slot", "r")

s = ex.state("3 Servo in place")
s.solid(holder)
s.solid(servo, role="steel", fine=(0.1, 0.32))
s.solid(zone, role="zone", edges="faint", fine=False)
s.label((shaft_x, 0, block_h + total_h - tab_z + 2), "keep-out zone of the arm", "t")

s = ex.state("4 Cut open")
s.solid(cut_open(holder), section=is_cut_face)
s.solid(cut_open(servo), role="steel", section=is_cut_face, fine=(0.1, 0.32))
s.label((0, 0, floor), "0.5 mm spare", "b")
s.label((-tab_span / 2, 0, block_h + 2.5), "tab rests on the holder", "t")
ex.save(thumb=2)
