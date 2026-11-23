from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
with BuildPart() as part:
    Box(40, 26, 16, align=(Align.CENTER, Align.CENTER, Align.MIN))

faces = part.faces()
front = faces.sort_by(Axis.Y)[0]      # lowest Y
back = faces.sort_by(Axis.Y)[-1]      # highest Y
left = faces.sort_by(Axis.X)[0]
right = faces.sort_by(Axis.X)[-1]
bottom = faces.sort_by(Axis.Z)[0]
top = faces.sort_by(Axis.Z)[-1]
# [/snippet]

near = scene.state("Front, right, top")
near.solid(part.part, accent=lambda f: f.center().Y < -12.9)
near.arrow((0, -13, 8), (0, -27, 8), role="y", width=0.7)
near.arrow((20, 0, 8), (34, 0, 8), role="x", width=0.7)
near.arrow((0, 0, 16), (0, 0, 30), role="z", width=0.7)
near.label((0, -27, 8), "front: toward −Y", "b")
near.label((34, 0, 8), "right: toward +X", "r")
near.label((0, 0, 30), "top: toward +Z", "t")

far = scene.state("Back, left, bottom")
far.solid(part.part, role="ghost", edges="faint")
far.arrow((0, 13, 8), (0, 27, 8), role="y", width=0.7)
far.arrow((-20, 0, 8), (-34, 0, 8), role="x", width=0.7)
far.arrow((0, 0, 0), (0, 0, -14), role="z", width=0.7)
far.label((0, 27, 8), "back: toward +Y", "r")
far.label((-34, 0, 8), "left: toward −X", "l")
far.label((0, 0, -14), "bottom: toward −Z", "b")
scene.save(thumb=0)
