"""One part, built one step at a time: an open case for a small sensor board."""

import copy

from build123d import *
from common import cut_open, is_cut_face
from example import Example, show

ex = Example(__file__, view=(-0.8, -1.0, 1.9))

# [snippet: sensor_case.py]
#> from build123d import *
#> from ocp_vscode import show

# ---- parameters, all in mm ----
board_l, board_w, board_t = 52.0, 28.0, 1.6
gap = 1.0                 # room around the board
wall = 2.0                # walls and floor
inner_h = 14.0
corner_r = 3.0

standoff_d, standoff_h = 6.0, 4.0
screw_hole_d = 2.1        # an M2.5 screw threads into this
hole_inset = 2.5          # board edge to hole centre

usb_w, usb_h = 10.0, 4.5  # opening for the USB-C plug
usb_above_board = 1.6     # centre of the connector above the board

vent_w, vent_h = 2.0, 8.0
vent_count, vent_pitch = 6, 5.0

bed_chamfer = 0.6

# ---- worked out from the parameters ----
outer_l = board_l + 2 * (gap + wall)
outer_w = board_w + 2 * (gap + wall)
outer_h = inner_h + wall
hole_dx = board_l - 2 * hole_inset
hole_dy = board_w - 2 * hole_inset
usb_z = wall + standoff_h + board_t + usb_above_board
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    # step 1: open box with rounded corners
    Box(outer_l, outer_w, outer_h, align=low)
    fillet(case.edges().filter_by(Axis.Z), radius=corner_r)
    offset(amount=-wall, openings=case.faces().sort_by(Axis.Z)[-1])
    step_1 = copy.copy(case.part)  # [hide]

    # step 2: four standoffs under the board's mounting holes
    with Locations((0, 0, wall)):
        with GridLocations(hole_dx, hole_dy, 2, 2):
            Cylinder(standoff_d / 2, standoff_h, align=low)
    with Locations((0, 0, wall + standoff_h)):
        with GridLocations(hole_dx, hole_dy, 2, 2):
            Hole(screw_hole_d / 2, depth=standoff_h)
    step_2 = copy.copy(case.part)  # [hide]

    # step 3: USB-C opening in the left wall (the wall facing -X)
    with BuildSketch(Plane.YZ.offset(-outer_l / 2)):
        with Locations((0, usb_z)):
            SlotOverall(usb_w, usb_h)
    extrude(amount=wall, both=True, mode=Mode.SUBTRACT)
    step_3 = copy.copy(case.part)  # [hide]

    # step 4: vent slots in the back wall (the wall facing +Y)
    with BuildSketch(Plane.XZ.offset(-outer_w / 2)):
        with Locations((0, wall + inner_h / 2)):
            with GridLocations(vent_pitch, 0, vent_count, 1):
                SlotOverall(vent_h, vent_w, rotation=90)
    extrude(amount=wall, both=True, mode=Mode.SUBTRACT)
    step_4 = copy.copy(case.part)  # [hide]

    # step 5: small chamfer on the edge that touches the print bed
    chamfer(case.edges().group_by(Axis.Z)[0], length=bed_chamfer)

show(case, names=["sensor_case"])

size = case.part.bounding_box().size
print(f"overall size: {size.X:.1f} x {size.Y:.1f} x {size.Z:.1f} mm")
# [/snippet]

final = case.part
print("   usb_z", usb_z, "volume", round(final.volume), "valid", final.is_valid)


def near(value, target, tol=0.05):
    return abs(value - target) < tol


def standoff(face):
    c = face.center()
    box = face.bounding_box()
    return wall - 0.01 < box.min.Z and box.max.Z < wall + standoff_h + 0.01 and abs(c.X) > 15 and abs(c.Y) > 5 \
        and box.size.X < standoff_d + 0.1 and not near(box.max.Z, wall)


def usb(face):
    box = face.bounding_box()
    return box.max.X < -outer_l / 2 + wall + 0.01 and box.size.X > wall - 0.3 and box.size.Y < usb_w + 0.1 \
        and box.size.Z < usb_h + 0.1


def vent(face):
    box = face.bounding_box()
    return box.min.Y > outer_w / 2 - wall - 0.01 and box.size.Y > wall - 0.3 and box.size.X < vent_w + 0.1 \
        and box.size.Z < vent_h + 0.1


def bed_edge(face):
    box = face.bounding_box()
    return box.max.Z < bed_chamfer + 0.01 and box.size.Z > 0.1


s = ex.state("1 Open box")
s.solid(step_1)
s.label((-outer_l / 2 + 1, -outer_w / 2 + 1, outer_h), "3 mm radius", "b")
s.label((0, 0, wall), "2 mm floor", "t")

s = ex.state("2 Standoffs")
s.solid(step_2, accent=standoff)
s.label((hole_dx / 2, hole_dy / 2, wall + standoff_h), "standoff", "t")

s = ex.state("3 USB opening")
s.solid(step_3, accent=usb)
s.label((-outer_l / 2, 0, usb_z - usb_h / 2), "USB opening, −X wall", "b")

s = ex.state("4 Vents")
s.solid(step_4, accent=vent)
s.label((0, outer_w / 2, outer_h), "vent slots, +Y wall", "t")

s = ex.state("5 Chamfer")
s.solid(final, accent=bed_edge)
s.label((0, -outer_w / 2, 0.3), "0.6 mm chamfer", "b")
ex.save()
