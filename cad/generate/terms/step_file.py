import os
import tempfile

from build123d import *
from OCP.BRepTools import BRepTools
from common import Scene

scene = Scene(__file__)
home = os.getcwd()
os.chdir(tempfile.mkdtemp())            # the example files are written to a temporary folder

# [snippet]
with BuildPart() as knob:
    Cylinder(radius=14, height=12, align=(Align.CENTER, Align.CENTER, Align.MIN))
    fillet(knob.edges().sort_by(Axis.Z)[-1], radius=5)

export_step(knob.part, "knob.step")     # the exact shape: for other CAD programs, and to share
export_stl(knob.part, "knob.stl")       # triangles only: for the slicer

loaded = import_step("knob.step")       # read one back: also how you load a motor from its maker
# [/snippet]

os.chdir(home)

exact = scene.state("STEP: exact")
exact.solid(loaded)
exact.label((0, 0, 12), "true curved surfaces", "t")

# the same shape as a coarse STL would store it: flat triangles and nothing else
BRepTools.Clean_s(knob.part.wrapped)    # forget the fine triangles made for the STL file
points, triangles = knob.part.tessellate(0.5, 0.75)
mesh = {"pos": [], "nrm": [], "idx": []}
seen = set()
flat = scene.state("STL: triangles")
for a, b, c in triangles:
    pa, pb, pc = points[a], points[b], points[c]
    normal = (pb - pa).cross(pc - pa).normalized()
    first = len(mesh["pos"]) // 3
    for p in (pa, pb, pc):
        mesh["pos"] += [round(p.X, 3), round(p.Y, 3), round(p.Z, 3)]
        mesh["nrm"] += [round(normal.X, 3), round(normal.Y, 3), round(normal.Z, 3)]
    mesh["idx"] += [first, first + 1, first + 2]
    for i, j in ((a, b), (b, c), (c, a)):
        if (min(i, j), max(i, j)) not in seen:
            seen.add((min(i, j), max(i, j)))
            flat.line(points[i], points[j])
flat._meshes["base"] = mesh
flat.label((0, 0, 12), "flat triangles only", "t")
scene.save(thumb=1)
