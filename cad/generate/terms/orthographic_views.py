from build123d import *
from common import Scene
from drawing import Sheet, project

scene = Scene(__file__)

low = (Align.CENTER, Align.CENTER, Align.MIN)
base = Box(50, 30, 8, align=low)
wall = Pos(-21, 0, 8) * Box(8, 30, 24, align=low)
floor_hole = Pos(8, 0, 0) * Cylinder(6, 40)
wall_hole = Pos(-21, 0, 20) * Rot(0, 90, 0) * Cylinder(5, 20)
part = base + wall - floor_hole - wall_hole

# [snippet]
# Look at the part from the front and flatten what you see into 2D lines.
# "hidden" holds the edges that are behind material (drawn dashed).
visible, hidden = part.project_to_viewport(
    viewport_origin=(0, -100, 0),    # camera in front of the part
    viewport_up=(0, 0, 1),
)
# [/snippet]

scene.state("3D part").solid(part)

# Third-angle layout: top view above the front view, right view beside it.
sheet = Sheet(font=3.6)
places = {"front": (0, 0), "top": (0, 62), "right": (58, 0)}
titles = {"front": (0, -9, "FRONT"), "top": (0, 39, "TOP"), "right": (58, -9, "RIGHT")}
for view, at in places.items():
    seen, behind = project(part, view)
    sheet.lines(behind, "hid", at)
    sheet.lines(seen, "vis", at)
    x, y, text = titles[view]
    sheet.text(x, y, text, "ttl")
scene.svg("Drawing", sheet.render())
scene.save()
