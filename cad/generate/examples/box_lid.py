"""Two examples from one small project: a box and its lid, each designed in its
own file and then assembled, and the bought screws and inserts that hold it shut."""

from build123d import *
from common import cut_open, is_cut_face
from example import Example, show

# [snippet: params.py]
# Sizes shared by every part of the box. All in mm.
length, width = 70.0, 50.0      # outside of the box
base_h = 24.0
wall = 2.0
corner_r = 4.0                  # outside corner radius
lid_t = 4.0

lip_t, lip_h = 1.0, 2.0         # rim on the base that locates the lid
clearance = 0.2                 # per side, between the lip and the lid

post_d = 8.0                    # corner posts that take the lid screws
post_inset = 4.5                # outside face to post centre
insert_hole_d = 4.0             # hole for an M3 heat-set insert
insert_hole_depth = 6.7
screw_clear_d = 3.4             # M3 clearance hole
countersink_d = 6.3             # for an M3 flat-head screw

# worked out from the sizes above
post_dx = length - 2 * post_inset
post_dy = width - 2 * post_inset
# [/snippet]


# [snippet: base.py]
#> from build123d import *
#> from ocp_vscode import show
#> from params import *
#>
#>
def make_base() -> Part:
    """The box. Its origin is the centre of its underside."""
    low = (Align.CENTER, Align.CENTER, Align.MIN)
    with BuildPart() as base:
        # open box with rounded corners
        Box(length, width, base_h, align=low)
        fillet(base.edges().filter_by(Axis.Z), radius=corner_r)
        offset(amount=-wall, openings=base.faces().sort_by(Axis.Z)[-1])

        # a post in each corner, as tall as the walls
        with Locations((0, 0, wall)):
            with GridLocations(post_dx, post_dy, 2, 2):
                Cylinder(post_d / 2, base_h - wall, align=low)

        # lip on the inner half of the wall top
        outer = wall - lip_t
        with BuildSketch(Plane.XY.offset(base_h)):
            RectangleRounded(length - 2 * outer, width - 2 * outer, corner_r - outer)
            RectangleRounded(length - 2 * wall, width - 2 * wall, corner_r - wall, mode=Mode.SUBTRACT)
        extrude(amount=lip_h)

        # holes for the heat-set inserts, from the top of each post
        with Locations((0, 0, base_h)):
            with GridLocations(post_dx, post_dy, 2, 2):
                Hole(insert_hole_d / 2, depth=insert_hole_depth)
    base.part.label = "base"
    return base.part

#>
#> if __name__ == "__main__":
#>     show(make_base())
# [/snippet]


# [snippet: lid.py]
#> from build123d import *
#> from ocp_vscode import show
#> from params import *
#>
#>
def make_lid() -> Part:
    """The lid. Its origin is the centre of its underside, the face that rests on the base."""
    with BuildPart() as lid:
        with BuildSketch():
            RectangleRounded(length, width, corner_r)
        extrude(amount=lid_t)

        # groove underneath: the lip of the base, grown by the clearance
        outer = wall - lip_t - clearance
        inner = wall + clearance
        with BuildSketch():
            RectangleRounded(length - 2 * outer, width - 2 * outer, corner_r - outer)
            RectangleRounded(length - 2 * inner, width - 2 * inner, corner_r - inner, mode=Mode.SUBTRACT)
        extrude(amount=lip_h + clearance, mode=Mode.SUBTRACT)

        # countersunk screw holes above the posts (90 degrees for metric screws)
        with Locations((0, 0, lid_t)):
            with GridLocations(post_dx, post_dy, 2, 2):
                CounterSinkHole(screw_clear_d / 2, countersink_d / 2, counter_sink_angle=90)
    lid.part.label = "lid"
    return lid.part

#>
#> if __name__ == "__main__":
#>     show(make_lid())
# [/snippet]


# [snippet: assembly.py]
#> from build123d import *
#> from ocp_vscode import show
#> from params import *
#> from base import make_base
#> from lid import make_lid

explode = 0     # set to 15 to lift the lid and look inside

base = make_base()
lid = Pos(0, 0, base_h + explode) * make_lid()

# two printed parts must never share space
overlap = (base & lid).volume
print(f"base and lid overlap: {overlap:.3f} mm3")
assert overlap < 0.001, "the lid and the base collide"

box = Compound(label="sensor box", children=[base, lid])
show(box)
# [/snippet]


# [snippet: hardware.py]
#> """Bought parts, as simple stand-ins without threads.
#>
#> They are only here to check the fit. They are never changed and never printed.
#> """
#> from build123d import *
#>
down = (Align.CENTER, Align.CENTER, Align.MAX)


def flat_head_screw(length: float, d: float = 3.0, head_d: float = 6.0) -> Part:
    """Metric flat-head screw (ISO 10642), 90 degree head. Top of the head at z = 0,
    pointing down. The length of a flat-head screw includes the head."""
    head_h = (head_d - d) / 2
    screw = Cone(d / 2, head_d / 2, head_h, align=down) + Cylinder(d / 2, length, align=down)
    screw.label = f"M{d:g} x {length:g} flat-head screw"
    return screw


def heat_set_insert(length: float = 5.7, d: float = 4.0, thread_d: float = 3.0) -> Part:
    """Brass insert, top at z = 0. Modelled at the size of its hole, because it melts in."""
    insert = Cylinder(d / 2, length, align=down) - Cylinder(thread_d / 2, length, align=down)
    insert.label = f"M{thread_d:g} heat-set insert"
    return insert
# [/snippet]


# [snippet: assembly.py #2]
#> from build123d import *
#> from ocp_vscode import show
#> from params import *
#> from base import make_base
#> from lid import make_lid
#> from hardware import flat_head_screw, heat_set_insert

screw_len = 10.0
insert_len = 5.7
explode = 0     # set to 15 to pull everything apart

base = make_base()
lid = Pos(0, 0, base_h + explode) * make_lid()

posts = GridLocations(post_dx, post_dy, 2, 2).locations
screws = [Pos(0, 0, base_h + lid_t + 2.5 * explode) * at * flat_head_screw(screw_len) for at in posts]
inserts = [Pos(0, 0, base_h + 0.4 * explode) * at * heat_set_insert(insert_len) for at in posts]

# ---- checks ----
reach = screw_len - lid_t                    # how far a screw goes below the lid
grip = min(reach, insert_len)                # thread actually engaged
print(f"screw reaches {reach:.1f} mm into the post, {grip:.1f} mm of thread engaged")
assert reach <= insert_hole_depth, "the screw hits the bottom of the hole"
assert grip >= 4.0, "less than 4 mm of thread engaged"
assert countersink_d >= 6.0, "the screw head would stand proud of the lid"

for printed in (base, lid):
    for screw in screws:
        assert (printed & screw).volume < 0.001, f"a screw collides with the {printed.label}"

# ---- parts list ----
print("Parts to buy:")
print(f"  {len(screws)} x {screws[0].label} (ISO 10642)")
print(f"  {len(inserts)} x {inserts[0].label}, {insert_len:g} mm long")

box = Compound(label="sensor box", children=[base, lid, *screws, *inserts])
show(box)
# [/snippet]


# ---- pictures -------------------------------------------------------------

base = make_base()
lid0 = make_lid()
print("   base", base.bounding_box().size, base.is_valid, "lid", lid0.bounding_box().size, lid0.is_valid)
print("   overlap closed:", (base & (Pos(0, 0, base_h) * lid0)).volume)


def lip(face):
    return face.bounding_box().min.Z > base_h - 0.01


def post(face):
    box = face.bounding_box()
    c = face.center()
    return abs(c.X) > post_dx / 2 - post_d / 2 - 0.1 and abs(c.Y) > post_dy / 2 - post_d / 2 - 0.1 \
        and box.size.X < post_d + 0.1 and box.size.Y < post_d + 0.1 and box.max.Z < base_h + 0.01 \
        and box.min.Z > wall - 0.01


def groove(face):
    box = face.bounding_box()
    return box.max.Z < lip_h + clearance + 0.01 and box.min.Z > -0.01 and box.size.Z > 0.1 \
        and box.size.X > 20 or (abs(box.max.Z - (lip_h + clearance)) < 0.01 and box.size.Z < 0.01)


def lifted(shape, dz):
    return Pos(0, 0, dz) * shape


def lid_face(test, dz):
    return lambda face: test(Pos(0, 0, -dz) * face)


# example 1: each part on its own, then together
ex = Example(__file__, view=(1.0, -1.25, 1.35), name="box-lid", files=["params.py", "base.py", "lid.py", "assembly.py"])

s = ex.state("1 Base")
s.solid(base, accent=lambda f: lip(f) or post(f))
s.label((0, width / 2 - 1.5, base_h + lip_h), "lip", "t")
s.label((-post_dx / 2, -post_dy / 2, base_h), "post, insert hole", "b")

# the lid on its own, turned over so the groove shows
flipped = Rot(180, 0, 0) * lid0
s = ex.state("2 Lid (underside)")
s.solid(flipped, role="mate", accent=lambda f: groove(Rot(180, 0, 0) * f))
s.label((0, width / 2 - 1.5, 0), "groove for the lip", "t")
s.label((-post_dx / 2, -post_dy / 2, 0), "screw hole", "b")

s = ex.state("3 Assembled")
s.solid(base)
s.solid(lifted(lid0, base_h), role="mate")
s.label((0, -width / 2, base_h), "lid origin at z = 24", "b")

s = ex.state("4 Exploded")
s.solid(base, accent=lip)
s.solid(lifted(lid0, base_h + 15), role="mate")
s.line((length / 2, -width / 2 + corner_r, base_h), (length / 2, -width / 2 + corner_r, base_h + 15), role="dash")
s.line((-length / 2, -width / 2 + corner_r, base_h), (-length / 2, -width / 2 + corner_r, base_h + 15), role="dash")
s.label((-length / 2, -width / 2 + corner_r, base_h + 8), "explode = 15", "l")

s = ex.state("5 Cut open")
s.solid(cut_open(base), section=is_cut_face, accent=lip)
s.solid(cut_open(lifted(lid0, base_h)), role="mate", section=is_cut_face)
s.label((length / 2 - 1.5, 0, base_h + 1), "lip in its groove", "t")
ex.save(thumb=3)

# example 2: the bought screws and inserts
hw = Example(__file__, view=(1.0, -1.25, 1.35), name="box-hardware", files=["params.py", "hardware.py", "assembly.py #2"])
posts = GridLocations(post_dx, post_dy, 2, 2).locations


def placed(explode):
    lid_ = Pos(0, 0, base_h + explode) * lid0
    screws_ = [Pos(0, 0, base_h + lid_t + 2.5 * explode) * at * flat_head_screw(10.0) for at in posts]
    inserts_ = [Pos(0, 0, base_h + 0.4 * explode) * at * heat_set_insert(5.7) for at in posts]
    return lid_, screws_, inserts_


lid_, screws_, inserts_ = placed(15)
s = hw.state("1 Exploded")
s.solid(base)
s.solid(lid_, role="mate")
for part in screws_:
    s.solid(part, role="steel")
for part in inserts_:
    s.solid(part, role="brass")
s.label((-post_dx / 2, -post_dy / 2, base_h + lid_t + 37.5), "M3 × 10 screw", "l")
s.label((-post_dx / 2, -post_dy / 2, base_h + 6), "M3 insert", "l")

lid_, screws_, inserts_ = placed(0)
s = hw.state("2 Assembled")
s.solid(base)
s.solid(lid_, role="mate")
for part in screws_:
    s.solid(part, role="steel")
s.label((-post_dx / 2, -post_dy / 2, base_h + lid_t), "head just below the surface", "b")

# cut through the front pair of posts
shift = Pos(0, post_dy / 2, 0)
s = hw.state("3 Cut through a screw")
s.solid(cut_open(shift * base), section=is_cut_face)
s.solid(cut_open(shift * lid_), role="mate", section=is_cut_face)
for part in screws_:
    if part.center().Y < 0:
        s.solid(shift * part, role="steel")
for part in inserts_:
    if part.center().Y < 0:
        s.solid(cut_open(shift * part), role="brass")
s.label((-post_dx / 2, 0, base_h - 3), "6 mm into the post", "l")
s.label((post_dx / 2, 0, base_h - 6.7), "0.7 mm spare", "b")
hw.save(thumb=0)
