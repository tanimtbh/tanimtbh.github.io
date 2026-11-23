"""A printed bracket that bolts onto bought 2020 aluminium extrusion."""

from build123d import *
from example import Example, show

ex = Example(__file__)

# [snippet: frame.py]
#> """2020 aluminium T-slot extrusion. A bought part: reference only, never printed."""
#> from build123d import *
#> from ocp_vscode import show
#>
size = 20.0          # the profile is 20 x 20 mm
slot_w = 6.2         # width of the opening of each slot
lip_t = 1.8          # thickness of the two lips that close the slot
cavity_w = 9.0       # simplified: the space under the lips, where a T-nut sits
cavity_d = 3.0
bore_d = 4.2         # centre hole


def make_extrusion(length: float) -> Part:
    """Runs along X, centred on X and Y, lying on the XY plane: its top face is at z = 20."""
    with BuildPart() as profile:
        with BuildSketch(Plane.YZ):
            with Locations((0, size / 2)):
                RectangleRounded(size, size, 1.0)
                Circle(bore_d / 2, mode=Mode.SUBTRACT)
                with PolarLocations(size / 2, 4):           # one slot in each face
                    Rectangle(2 * lip_t, slot_w, mode=Mode.SUBTRACT)
                    with Locations((-lip_t - cavity_d / 2, 0)):
                        Rectangle(cavity_d, cavity_w, mode=Mode.SUBTRACT)
        extrude(amount=length / 2, both=True)
    profile.part.label = f"2020 extrusion, {length:g} mm"
    return profile.part

#>
#> if __name__ == "__main__":
#>     show(make_extrusion(120))
# [/snippet]


# [snippet: bracket.py]
#> from build123d import *
#> from ocp_vscode import show
#> from frame import slot_w
#>
foot_l, foot_w, foot_t = 50.0, 20.0, 6.0     # the foot lies on top of the profile
upright_h, upright_t = 30.0, 4.0             # the plate the sensor is fixed to
key_w = slot_w - 2 * 0.2                     # tongue under the foot, 0.2 mm clearance per side
key_h = 1.5
screw_hole_d = 5.5                           # M5 clearance
screw_spacing = 30.0
rib = 14.0                                   # length of the two short sides of each gusset
rib_t = 3.0
sensor_slot_l, sensor_slot_w = 20.0, 3.4     # M3 slot, so the sensor can be moved sideways


def make_bracket() -> Part:
    """Origin: centre of the underside of the foot. The key hangs below z = 0."""
    low = (Align.CENTER, Align.CENTER, Align.MIN)
    with BuildPart() as bracket:
        Box(foot_l, foot_w, foot_t, align=low)

        # upright plate along the back edge
        with Locations((0, foot_w / 2, foot_t)):
            Box(foot_l, upright_t, upright_h, align=(Align.CENTER, Align.MAX, Align.MIN))

        # key that drops into the slot of the profile and stops the bracket turning
        Box(foot_l, key_w, key_h, align=(Align.CENTER, Align.CENTER, Align.MAX))

        # a gusset at each end, between the foot and the upright
        corner_y = foot_w / 2 - upright_t
        for x in (-foot_l / 2, foot_l / 2 - rib_t):
            with BuildSketch(Plane.YZ.offset(x)):
                Polygon((corner_y, foot_t), (corner_y - rib, foot_t), (corner_y, foot_t + rib), align=None)
            extrude(amount=rib_t)

        # two M5 clearance holes, through the foot and the key
        with Locations((0, 0, foot_t)):
            with GridLocations(screw_spacing, 0, 2, 1):
                Hole(screw_hole_d / 2)

        # slot in the upright for the sensor
        with BuildSketch(Plane.XZ.offset(-foot_w / 2)):
            with Locations((0, foot_t + upright_h * 0.6)):
                SlotOverall(sensor_slot_l, sensor_slot_w)
        extrude(amount=upright_t, both=True, mode=Mode.SUBTRACT)
    bracket.part.label = "sensor bracket"
    return bracket.part

#>
#> if __name__ == "__main__":
#>     show(make_bracket())
# [/snippet]


# [snippet: hardware.py]
#> """Bought screws and nuts, as simple stand-ins without threads. Reference only."""
#> from build123d import *
#>
def cap_screw(d: float, length: float, head_d: float, head_h: float) -> Part:
    """Socket-head screw, pointing down. The underside of its head is at z = 0."""
    head = Cylinder(head_d / 2, head_h, align=(Align.CENTER, Align.CENTER, Align.MIN))
    shank = Cylinder(d / 2, length, align=(Align.CENTER, Align.CENTER, Align.MAX))
    screw = head + shank
    screw.label = f"M{d:g} x {length:g} socket-head screw"
    return screw


def t_nut(d: float = 5.0, length: float = 10.0, width: float = 8.6, thick: float = 2.6) -> Part:
    """T-nut for a 2020 slot. Its top face, which presses against the lips, is at z = 0."""
    nut = Box(length, width, thick, align=(Align.CENTER, Align.CENTER, Align.MAX))
    nut -= Cylinder(d / 2, thick, align=(Align.CENTER, Align.CENTER, Align.MAX))
    nut.label = f"M{d:g} T-nut"
    return nut
# [/snippet]


# [snippet: assembly.py]
#> from build123d import *
#> from ocp_vscode import show
#> from frame import make_extrusion, size, lip_t, cavity_d
#> from bracket import make_bracket, foot_t, screw_spacing
#> from hardware import cap_screw, t_nut

screw_len = 10.0

frame = make_extrusion(120)
bracket = Pos(0, 0, size) * make_bracket()               # the foot sits on the top face
holes = GridLocations(screw_spacing, 0, 2, 1).locations
screws = [Pos(0, 0, size + foot_t) * at * cap_screw(5, screw_len, 8.5, 5) for at in holes]
nuts = [Pos(0, 0, size - lip_t) * at * t_nut() for at in holes]

# ---- checks ----
overlap = (frame & bracket).volume
print(f"bracket and frame overlap: {overlap:.3f} mm3")
assert overlap < 0.001, "the bracket collides with the frame"

below = screw_len - foot_t                 # how far a screw goes below the top of the profile
print(f"each screw goes {below:.1f} mm into the slot, {below - lip_t:.1f} mm of it in the T-nut")
assert below - lip_t >= 2.0, "too little thread in the T-nut"
assert below < lip_t + cavity_d, "the screw hits the bottom of the slot"

mount = Compound(label="sensor mount", children=[frame, bracket, *screws, *nuts])
show(mount)
# [/snippet]

# ---- pictures -------------------------------------------------------------

part = make_bracket()
print("   bracket", part.bounding_box().size, part.is_valid, "frame", frame.is_valid, frame.volume)


def key(face):
    return face.bounding_box().max.Z < 0.01 and face.bounding_box().min.Z < -0.01 or \
        (abs(face.center().Z + key_h) < 0.01)


def gusset(face):
    box = face.bounding_box()
    return box.size.X < rib_t + 0.01 and abs(abs(face.center().X) - (foot_l / 2 - rib_t / 2)) < rib_t / 2 + 0.01 \
        and box.min.Z > foot_t - 0.01 and box.max.Y < foot_w / 2 - upright_t + 0.01 and box.size.Z > 0.1 \
        and box.max.Z < foot_t + rib + 0.01


s = ex.state("1 Frame (bought)")
s.solid(frame, role="steel", fine=(0.1, 0.32))
s.label((40, 0, size), "slot opening 6.2 mm", "t")
s.label((60, 0, 0), "20 × 20 mm", "b")

s = ex.state("2 Bracket")
s.solid(part, accent=lambda f: key(f) or gusset(f))
s.label((foot_l / 2, 0, -key_h), "key for the slot", "r")
s.label((0, foot_w / 2, foot_t + upright_h * 0.6), "slot for the sensor", "t")
s.label((-foot_l / 2, 0, foot_t + 4), "gusset", "l")

s = ex.state("3 On the frame")
s.solid(frame, role="steel", fine=(0.1, 0.32))
s.solid(bracket)
for item in screws:
    s.solid(item, role="steel")
s.label((screw_spacing / 2, 0, size + foot_t + 5), "M5 × 10 screw", "r")


def chop(shape):
    """Remove everything beyond the right-hand screw, so the slot shows."""
    return shape - Pos(screw_spacing / 2 + 500, 0, 0) * Box(1000, 1000, 1000)


def chopped(face):
    return face.geom_type == GeomType.PLANE and abs(face.center().X - screw_spacing / 2) < 1e-6 \
        and abs(face.normal_at().X) > 0.999


s = ex.state("4 Cut through a screw")
s.solid(chop(frame), role="steel", section=chopped, fine=(0.1, 0.32))
s.solid(chop(bracket), section=chopped)
s.solid(chop(nuts[1]), role="brass", section=chopped)
s.solid(screws[1], role="steel")
s.solid(screws[0], role="steel")
s.label((screw_spacing / 2, -slot_w / 2 + 0.2, size - 0.8), "key in the slot", "l")
s.label((screw_spacing / 2, 4.3, size - lip_t - 1.3), "T-nut", "r")
ex.save(thumb=2)
