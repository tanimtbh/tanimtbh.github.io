"""Simple screws, nuts and inserts for the pictures. All sizes in mm.

These are plain stand-ins without real threads: enough to show how a screw
sits in a part. The numbers are the standard sizes for metric hardware.
"""

from build123d import *

# thread diameter, socket-head diameter and height, hex key, nut width and height
SIZES = {
    "M2": dict(d=2.0, head=3.8, head_h=2.0, key=1.5, nut=4.0, nut_h=1.6),
    "M2.5": dict(d=2.5, head=4.5, head_h=2.5, key=2.0, nut=5.0, nut_h=2.0),
    "M3": dict(d=3.0, head=5.5, head_h=3.0, key=2.5, nut=5.5, nut_h=2.4),
    "M4": dict(d=4.0, head=7.0, head_h=4.0, key=3.0, nut=7.0, nut_h=3.2),
    "M5": dict(d=5.0, head=8.5, head_h=5.0, key=4.0, nut=8.0, nut_h=4.7),
}

_UP = (Align.CENTER, Align.CENTER, Align.MIN)
_DOWN = (Align.CENTER, Align.CENTER, Align.MAX)


def cap_screw(size: str = "M3", length: float = 10.0):
    """A socket-head screw pointing down. The underside of its head is at z = 0."""
    s = SIZES[size]
    head = Cylinder(s["head"] / 2, s["head_h"], align=_UP)
    shank = Cylinder(s["d"] / 2, length, align=_DOWN)
    depth = s["head_h"] * 0.55
    socket = Pos(0, 0, s["head_h"] - depth) * extrude(
        RegularPolygon(s["key"] / 2, 6, major_radius=False), amount=depth
    )
    return head + shank - socket


def hex_nut(size: str = "M3"):
    """A hex nut lying flat, with its underside at z = 0."""
    s = SIZES[size]
    body = extrude(RegularPolygon(s["nut"] / 2, 6, major_radius=False), amount=s["nut_h"])
    return body - Cylinder(s["d"] / 2 - 0.2, s["nut_h"], align=_UP)


def heat_set_insert(outer: float = 3.94, length: float = 5.7, thread: float = 3.0):
    """A brass threaded insert, with its top at z = 0. It has two grip bands."""
    body = Cylinder(outer / 2, length, align=_DOWN) - Cylinder(thread / 2 - 0.2, length, align=_DOWN)
    groove = Cylinder(outer / 2, 0.9, align=_DOWN) - Cylinder(outer / 2 - 0.35, 0.9, align=_DOWN)
    return body - Pos(0, 0, -length / 2 + 0.45) * groove


def nema17(length: float = 34.0, shaft_length: float = 22.0):
    """A NEMA 17 stepper motor. Its mounting face is at z = 0 and the shaft points up."""
    body = Box(42.3, 42.3, length, align=_DOWN)
    body = chamfer(body.edges().filter_by(Axis.Z), 4)
    boss = Cylinder(11, 2, align=_UP)                       # 22 mm centring boss
    shaft = Cylinder(2.5, 2 + shaft_length, align=_UP)      # 5 mm shaft
    motor = body + boss + shaft
    for x in (-15.5, 15.5):                                 # four M3 holes on a 31 mm square
        for y in (-15.5, 15.5):
            motor -= Pos(x, y, 0) * Cylinder(1.5, 4.5, align=_DOWN)
    return motor


def extrusion_2020(length: float = 60.0):
    """A 20 x 20 mm T-slot aluminium profile, standing on z = 0. A simple stand-in."""
    slot = [(-3, 10), (3, 10), (3, 8.2), (5.5, 8.2), (2.9, 3.9), (-2.9, 3.9), (-5.5, 8.2), (-3, 8.2)]
    with BuildSketch() as profile:
        RectangleRounded(20, 20, 1.5)
        with PolarLocations(0, 4):
            Polygon(*slot, align=None, mode=Mode.SUBTRACT)
        Circle(2.1, mode=Mode.SUBTRACT)
    return extrude(profile.sketch, amount=length)


def t_nut(size: str = "M5"):
    """A flat T-nut for a 2020 slot. Its top, which sits under the lips of the slot, is at z = 0."""
    with BuildSketch(Plane.XZ) as shape:
        Polygon((-5.2, 0), (5.2, 0), (5.2, -1.2), (3.2, -3.6), (-3.2, -3.6), (-5.2, -1.2), align=None)
    body = extrude(shape.sketch, amount=5, both=True)
    return body - Cylinder(SIZES[size]["d"] / 2 - 0.2, 3.6, align=_DOWN)


def ball_bearing(bore: float = 8.0, outside: float = 22.0, width: float = 7.0):
    """A ball bearing lying flat, with its underside at z = 0. The shields are set in a little."""
    ring = (outside - bore) * 0.14                          # thickness of each steel ring
    body = Cylinder(outside / 2, width, align=_UP) - Cylinder(bore / 2, width, align=_UP)
    shield = Cylinder(outside / 2 - ring, 0.5, align=_UP) - Cylinder(bore / 2 + ring, 0.5, align=_UP)
    return body - shield - Pos(0, 0, width - 0.5) * shield


def pan_screw(head: float = 7.5, head_h: float = 2.6, shank: float = 4.0, length: float = 16.0):
    """A plain wall screw pointing down. The underside of its head is at z = 0."""
    top = Cylinder(head / 2, head_h, align=_UP)
    top = fillet(top.edges().sort_by(Axis.Z)[-1], head_h * 0.6)
    return top + Cylinder(shank / 2, length, align=_DOWN)
