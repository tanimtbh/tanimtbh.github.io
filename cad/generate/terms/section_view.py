from build123d import *
from common import Scene, is_cut_face
from drawing import Sheet, outline, project

scene = Scene(__file__)

low = (Align.CENTER, Align.CENTER, Align.MIN)
with BuildPart() as hub:
    Cylinder(26, 8, align=low)
    Cylinder(12, 22, align=low)
    Cylinder(5, 60, mode=Mode.SUBTRACT)
    with Locations((0, 0, 22)):
        CounterBoreHole(radius=5, counter_bore_radius=8, counter_bore_depth=7)
    with PolarLocations(19, 4):
        Cylinder(2.6, 40, mode=Mode.SUBTRACT)
part = hub.part

# [snippet]
# Cut the part in half through its middle so you can look inside.
half = split(part, bisect_by=Plane.XZ, keep=Keep.BOTTOM)
# [/snippet]

scene.state("Whole part").solid(part)
scene.state("Cut open").solid(half, section=is_cut_face)

sheet = Sheet(font=3.6)

# top view, with the line that shows where the part is cut
top_at = (0, 62)
seen, behind = project(part, "top")
sheet.lines(behind, "hid", top_at).lines(seen, "vis", top_at)
sheet.lines([[(-36, 62), (36, 62)]], "cl")
for x in (-36, 36):
    # the arrows point the way you are looking: from the front, towards +Y
    sheet.lines([[(x, 62), (x, 69)], [(x - 1.6, 66.5), (x, 69), (x + 1.6, 66.5)]], "dim")
    sheet.text(x, 71.5, "A", "ttl")
sheet.text(0, 93, "TOP", "ttl")

# section view: cut material is hatched, the lines behind it stay visible
for face in half.faces().filter_by(is_cut_face):
    rings = [outline(face.outer_wire())] + [outline(w) for w in face.inner_wires()]
    sheet.area(rings, "sec")
seen, _ = project(half, "front")
sheet.lines(seen, "vis")
sheet.lines([[(0, -4), (0, 26)]], "cl")
sheet.text(0, -12, "SECTION A–A", "ttl")

scene.svg("Drawing", sheet.render())
scene.save(thumb=1)
