"""Turn build123d shapes into the JSON files the website's 3D viewer reads.

Every file in generate/terms/ builds the pictures for one term:

    scene = Scene(__file__)
    scene.state("Before").solid(some_shape)
    scene.state("After").solid(other_shape, accent=lambda face: ...)
    scene.save()

The code between "# [snippet]" and "# [/snippet]" in a term file is the code
shown on the website, so the picture and the snippet always come from the
same run.
"""

from __future__ import annotations

import json
import math
import re
import textwrap
from pathlib import Path

from build123d import *
from OCP.BRep import BRep_Tool
from OCP.BRepLib import BRepLib_ToolTriangulatedShape
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.TopAbs import TopAbs_REVERSED
from OCP.TopLoc import TopLoc_Location

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "models"

LINEAR_TOL = 0.03  # mm: how far a triangle may sit from the true surface
ANGULAR_TOL = 0.12  # radians: how coarse a curve may look


def _r(value: float) -> float:
    return round(value, 3)


def _xyz(v) -> list[float]:
    return [_r(v.X), _r(v.Y), _r(v.Z)]


def sample_edge(edge: Edge, per_turn: int = 72) -> list[list[float]]:
    """Points along an edge, close enough together to look smooth.

    per_turn is how many points a full circle gets."""
    if edge.geom_type == GeomType.LINE:
        steps = 1
    elif edge.geom_type == GeomType.CIRCLE:
        steps = max(6, math.ceil(edge.length / edge.radius / (2 * math.pi) * per_turn))
    else:
        steps = max(12, per_turn * 4 // 9)
    return [_xyz(edge.position_at(i / steps)) for i in range(steps + 1)]


def _edge_key(edge: Edge):
    ends = frozenset(
        tuple(round(c, 2) for c in _xyz(edge.position_at(t))) for t in (0, 1)
    )
    mid = tuple(round(c, 2) for c in _xyz(edge.position_at(0.5)))
    return ends, mid


# ---- handy face tests for term files -------------------------------------


def is_flat(face: Face) -> bool:
    return face.geom_type == GeomType.PLANE


def is_cut_face(face: Face) -> bool:
    """True for the flat faces left behind by cut_open()."""
    return (
        is_flat(face)
        and abs(face.center().Y) < 1e-6
        and abs(face.normal_at().Y) > 0.999
    )


def cut_open(shape):
    """Remove the front half (everything with y < 0) so the inside shows."""
    return shape - Pos(0, -500, 0) * Box(1000, 1000, 1000)


# ---- one picture ---------------------------------------------------------


class State:
    """One picture of a term, for example "Before" or "After"."""

    per_turn = 72  # points on a full circle of an edge line

    def __init__(self, label: str):
        self.name = label
        self._meshes: dict[str, dict[str, list]] = {}
        self._lines: dict[str, list[float]] = {}
        self._labels: list[dict] = []
        self._svg: str | None = None

    # -- solids and faces --

    def solid(
        self,
        shape,
        role: str = "base",
        accent=None,
        section=None,
        edges: str | None = "edge",
        accent_edges=None,
        fine: bool | None = None,
    ) -> "State":
        """Add a shape.

        role          colour of its faces: base, accent, mate (a second
                      part), section, steel, brass, ghost, tint, plane,
                      support, clash (overlap, red), zone (see-through
                      red: space to keep empty), x, y, z
        accent        function(face) -> True for faces to highlight
        section       function(face) -> True for faces made by cutting it open
        edges         colour of its edge lines, or None for no lines
        accent_edges  function(edge) -> True for edges to highlight
        fine          False for small helper shapes, to keep files small.
                      Screws and inserts are coarse unless you say otherwise.
                      A pair (linear, angular) sets the mesh tolerances.
        """
        if fine is None:
            fine = role not in ("steel", "brass")
        if isinstance(fine, tuple):
            linear, angular = fine
        else:
            linear, angular = (LINEAR_TOL, ANGULAR_TOL) if fine else (0.12, 0.4)

        # Decide the colours first. A test may measure a face (bounding_box),
        # and that throws away its triangles, so the mesh is made afterwards.
        faces = shape.faces()
        roles = []
        for face in faces:
            if section and section(face):
                roles.append("section")
            elif accent and accent(face):
                roles.append("accent")
            else:
                roles.append(role)

        BRepMesh_IncrementalMesh(shape.wrapped, linear, False, angular, True)
        seen = set()
        for face, face_role in zip(faces, roles):
            self._add_face(face, face_role)
            if not edges:
                continue
            for edge in face.edges():
                # Skip the seam line of a cylinder and the zero-length edge
                # at the tip of a cone: they are not real corners.
                if BRep_Tool.Degenerated_s(edge.wrapped) or BRep_Tool.IsClosed_s(
                    edge.wrapped, face.wrapped
                ):
                    continue
                key = _edge_key(edge)
                if key in seen:
                    continue
                seen.add(key)
                highlighted = accent_edges and accent_edges(edge)
                self._add_edge(edge, "accent" if highlighted else edges)
        return self

    def _add_face(self, face: Face, role: str) -> None:
        location = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(face.wrapped, location)
        if tri is None:
            return
        if not tri.HasNormals():
            BRepLib_ToolTriangulatedShape.ComputeNormals_s(face.wrapped, tri)
        trsf = location.Transformation()
        flipped = face.wrapped.Orientation() == TopAbs_REVERSED
        sign = -1 if flipped else 1

        mesh = self._meshes.setdefault(role, {"pos": [], "nrm": [], "idx": []})
        first = len(mesh["pos"]) // 3
        for i in range(1, tri.NbNodes() + 1):
            p = tri.Node(i).Transformed(trsf)
            n = tri.Normal(i).Transformed(trsf)
            mesh["pos"] += [_r(p.X()), _r(p.Y()), _r(p.Z())]
            mesh["nrm"] += [round(sign * n.X(), 2), round(sign * n.Y(), 2), round(sign * n.Z(), 2)]
        for i in range(1, tri.NbTriangles() + 1):
            a, b, c = tri.Triangle(i).Get()
            if flipped:
                b, c = c, b
            mesh["idx"] += [first + a - 1, first + b - 1, first + c - 1]

    # -- lines --

    def _add_edge(self, edge: Edge, role: str) -> None:
        self.line(*sample_edge(edge, self.per_turn), role=role)

    def edges(self, edges, role: str = "accent") -> "State":
        """Draw some edges on their own, for example to highlight them."""
        for edge in edges:
            self._add_edge(edge, role)
        return self

    def line(self, *points, role: str = "edge") -> "State":
        """Draw a line through the points. Roles: edge, accent, dash, x, y, z."""
        pts = [_xyz(Vector(p)) if not isinstance(p, list) else p for p in points]
        buffer = self._lines.setdefault(role, [])
        for a, b in zip(pts, pts[1:]):
            buffer += [*a, *b]
        return self

    # -- helper shapes --

    def dots(self, points, radius: float, role: str = "accent") -> "State":
        for p in points:
            self.solid(Pos(*Vector(p)) * Sphere(radius), role=role, edges=None, fine=False)
        return self

    def arrow(self, start, end, role: str = "accent", width: float = 0.5) -> "State":
        start, end = Vector(start), Vector(end)
        length = (end - start).length
        head = min(width * 5, length * 0.5)
        frame = Plane(origin=start, z_dir=end - start).location
        low = (Align.CENTER, Align.CENTER, Align.MIN)
        shaft = frame * Cylinder(width / 2, length - head, align=low)
        tip = frame * Pos(0, 0, length - head) * Cone(width * 1.5, 0, head, align=low)
        self.solid(shaft, role=role, edges=None, fine=False)
        self.solid(tip, role=role, edges=None, fine=False)
        return self

    def sheet(self, plane: Plane, width: float, height: float) -> "State":
        """A see-through rectangle showing where a plane is."""
        self.solid(plane.location * Rectangle(width, height), role="plane", edges="accent")
        return self

    def triad(self, length: float, width: float = 0.5) -> "State":
        """X, Y and Z arrows from the origin."""
        for role, tip in (("x", (length, 0, 0)), ("y", (0, length, 0)), ("z", (0, 0, length))):
            self.arrow((0, 0, 0), tip, role=role, width=width)
        return self

    def label(self, at, text: str, side: str = "r") -> "State":
        """A text label pinned to a 3D point. side: r, l, t or b."""
        self._labels.append({"at": _xyz(Vector(at)), "text": text, "side": side})
        return self

    def to_json(self) -> dict:
        if self._svg is not None:
            return {"label": self.name, "type": "svg", "svg": self._svg}
        return {
            "label": self.name,
            "type": "3d",
            "meshes": [{"role": role, **mesh} for role, mesh in self._meshes.items()],
            "lines": [{"role": role, "pos": pos} for role, pos in self._lines.items()],
            "labels": self._labels,
        }


# ---- all pictures of one term --------------------------------------------


class Scene:
    def __init__(self, file: str, view=(1.0, -1.35, 0.85)):
        """view is where the camera sits, as a direction from the part."""
        self.path = Path(file)
        self.id = self.path.stem.replace("_", "-")
        self.view = view
        self.states: list[State] = []

    def state(self, label: str) -> State:
        state = State(label)
        self.states.append(state)
        return state

    def svg(self, label: str, markup: str) -> State:
        """A flat drawing instead of a 3D picture."""
        state = self.state(label)
        state._svg = markup
        return state

    def _snippet(self) -> str:
        source = self.path.read_text(encoding="utf-8")
        match = re.search(r"# \[snippet\]\n(.*?)\n\s*# \[/snippet\]", source, re.S)
        return textwrap.dedent(match.group(1)).strip() if match else ""

    def save(self, thumb: int | None = None) -> None:
        """thumb: which state to use for the small preview (default: the last)."""
        data = {
            "id": self.id,
            "code": self._snippet(),
            "view": list(self.view),
            "thumb": len(self.states) - 1 if thumb is None else thumb,
            "states": [state.to_json() for state in self.states],
        }
        OUT.mkdir(parents=True, exist_ok=True)
        target = OUT / f"{self.id}.json"
        target.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        print(f"  {self.id:<22} {len(self.states)} states  {target.stat().st_size / 1024:6.1f} kB")
