from build123d import *
from common import Scene

scene = Scene(__file__)

# [snippet]
part = Box(40, 30, 15)

top_face = part.faces().sort_by(Axis.Z)[-1]      # one face
top_edges = part.edges().group_by(Axis.Z)[-1]    # four edges
corners = part.vertices()                        # eight vertices
# [/snippet]

face = scene.state("Face")
face.solid(part, accent=lambda f: f.center().Z > 7.4)
face.label(top_face.center(), "face: a flat or curved surface", "t")

edge = scene.state("Edge")
edge.solid(part, edges="faint")
edge.edges(top_edges)
edge.label((0, -15, 7.5), "edge: where two faces meet", "b")

vertex = scene.state("Vertex")
vertex.solid(part)
vertex.dots([v.center() for v in corners], radius=1.1)
vertex.label((20, -15, 7.5), "vertex: a corner point", "r")
scene.save(thumb=0)
