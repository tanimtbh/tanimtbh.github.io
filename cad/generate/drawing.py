"""Flat SVG pictures: 2D views of a part, and simple labelled diagrams.

Coordinates are ordinary maths coordinates (y goes up). Colours and line
styles come from the website's stylesheet through the class names:

    vis   visible outline            hid   hidden line (dashed)
    cl    centre / cutting line      sec   cut material (hatched)
    body  solid material             peg   highlighted part
    clash overlapping material       dim   dimension line
    lbl   label text                 ttl   view title
"""

from __future__ import annotations

import math
from html import escape

from build123d import *
from common import sample_edge

# where the camera sits, and which way is "up" on the paper
VIEWS = {
    "front": ((0, -1000, 0), (0, 0, 1)),
    "top": ((0, 0, 1000), (0, 1, 0)),
    "right": ((1000, 0, 0), (0, 0, 1)),
}


def project(shape, view: str):
    """Flatten a part to 2D lines. Returns (visible, hidden) polylines."""
    origin, up = VIEWS[view]
    visible, hidden = shape.project_to_viewport(origin, viewport_up=up, look_at=(0, 0, 0))

    def as_lines(edges):
        return [[(p[0], p[1]) for p in sample_edge(e)] for e in edges]

    return as_lines(visible), as_lines(hidden)


def outline(wire: Wire, axes=("X", "Z")) -> list[tuple[float, float]]:
    """A closed 2D outline of a wire, using two of its 3D coordinates."""
    chains = []
    for edge in wire.order_edges():
        pts = [(getattr(edge.position_at(t / 24), axes[0]), getattr(edge.position_at(t / 24), axes[1]))
               for t in range(25)]
        chains.append(pts)
    result = chains[0]
    if len(chains) > 1:
        # the first edge may run backwards: its end must touch the second edge
        touches = min(math.dist(result[-1], chains[1][0]), math.dist(result[-1], chains[1][-1])) < 1e-4
        if not touches:
            result = result[::-1]
    for pts in chains[1:]:
        if math.dist(result[-1], pts[0]) > math.dist(result[-1], pts[-1]):
            pts = pts[::-1]
        result = result + pts[1:]
    return result


class Sheet:
    def __init__(self, font: float = 4.0):
        self.font = font
        self._items: list[str] = []
        self._box = [math.inf, math.inf, -math.inf, -math.inf]

    def _grow(self, x: float, y: float) -> None:
        b = self._box
        b[0], b[1], b[2], b[3] = min(b[0], x), min(b[1], y), max(b[2], x), max(b[3], y)

    def _d(self, polylines, at, close: bool) -> str:
        parts = []
        for line in polylines:
            pts = [(x + at[0], y + at[1]) for x, y in line]
            for x, y in pts:
                self._grow(x, y)
            parts.append("M" + "L".join(f"{x:.2f} {-y:.2f}" for x, y in pts) + ("Z" if close else ""))
        return "".join(parts)

    def lines(self, polylines, cls: str, at=(0, 0)) -> "Sheet":
        self._items.append(f'<path class="{cls}" d="{self._d(polylines, at, False)}"/>')
        return self

    def area(self, outlines, cls: str, at=(0, 0)) -> "Sheet":
        """Filled shape. Extra outlines inside the first one become holes."""
        self._items.append(f'<path class="{cls}" fill-rule="evenodd" d="{self._d(outlines, at, True)}"/>')
        return self

    def rect(self, x: float, y: float, w: float, h: float, cls: str) -> "Sheet":
        return self.area([[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]], cls)

    def text(self, x: float, y: float, text: str, cls: str = "lbl", anchor: str = "middle",
             size: float | None = None) -> "Sheet":
        size = size or self.font
        half = len(text) * size * 0.3
        left = {"start": 0, "middle": half, "end": 2 * half}[anchor]
        self._grow(x - left, y - size * 0.4)
        self._grow(x - left + 2 * half, y + size)
        self._items.append(
            f'<text class="{cls}" x="{x:.2f}" y="{-y:.2f}" font-size="{size}" '
            f'text-anchor="{anchor}">{escape(text)}</text>'
        )
        return self

    def dim(self, a, b, text: str, gap: float = 0.0, cls: str = "dim") -> "Sheet":
        """A dimension line from a to b with small end ticks and a label."""
        (x1, y1), (x2, y2) = a, b
        length = math.dist(a, b)
        nx, ny = -(y2 - y1) / length, (x2 - x1) / length
        tick = self.font * 0.45
        self.lines([[a, b]], cls)
        for x, y in (a, b):
            self.lines([[(x - nx * tick, y - ny * tick), (x + nx * tick, y + ny * tick)]], cls)
        mx, my = (x1 + x2) / 2 + nx * gap, (y1 + y2) / 2 + ny * gap
        if abs(nx) > abs(ny):  # vertical line: put the text beside it
            self.text(mx + math.copysign(self.font * 0.5, nx or 1), my - self.font * 0.35, text,
                      anchor="start" if nx >= 0 else "end")
        else:
            self.text(mx, my + self.font * 0.5, text)
        return self

    def render(self, pad: float = 6.0) -> str:
        x0, y0, x1, y1 = self._box
        view = f"{x0 - pad:.2f} {-y1 - pad:.2f} {x1 - x0 + 2 * pad:.2f} {y1 - y0 + 2 * pad:.2f}"
        return (
            f'<svg class="dwg" xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img">'
            + "".join(self._items)
            + "</svg>"
        )
