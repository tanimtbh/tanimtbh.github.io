import math

from build123d import *
from common import Scene
from drawing import Sheet

scene = Scene(__file__)

# [snippet]
hole_diameter = 10      # people, drawings and screw tables give the diameter

with BuildPart() as part:
    Box(30, 30, 8)
    Hole(radius=hole_diameter / 2)      # build123d asks for the radius
# [/snippet]


def circle(radius):
    return [(radius * math.cos(math.radians(a)), radius * math.sin(math.radians(a))) for a in range(0, 361, 5)]


# one circle: diameter and radius
one = Sheet(font=3.0)
one.lines([circle(15)], "vis")
one.lines([[(-2, 0), (2, 0)], [(0, -2), (0, 2)]], "dim")
tip = (15 * math.cos(math.radians(50)), 15 * math.sin(math.radians(50)))
one.lines([[(0, 0), tip]], "cl")
one.lines([[tip, (22, 14)]], "dim")
one.text(23, 13, "radius 15: centre to edge", anchor="start")
one.dim((-15, -20), (15, -20), "diameter 30")
one.text(0, -25.5, "all the way across")
one.lines([[(-15, 0), (-15, -20)], [(15, 0), (15, -20)]], "dim")
one.text(0, -34, "DIAMETER = 2 × RADIUS", "ttl")
scene.svg("Diameter and radius", one.render())

# a ring: inside and outside diameter
two = Sheet(font=3.0)
two.area([circle(15), circle(9)], "peg")
two.dim((-15, -20), (15, -20), "outside 30")
two.lines([[(-15, 0), (-15, -20)], [(15, 0), (15, -20)]], "dim")
two.dim((-9, 0), (9, 0), "inside 18")
two.lines([[(12, 0), (22, 12)]], "dim")
two.text(23, 11, "wall 6 = (30 − 18) ÷ 2", anchor="start")
two.text(0, -31, "A RING HAS TWO DIAMETERS", "ttl")
scene.svg("Inside and outside", two.render())
scene.save(thumb=0)
