from build123d import *
from common import Scene, cut_open, is_cut_face
from hardware import cap_screw, extrusion_2020, t_nut

scene = Scene(__file__)

# [snippet]
slot = 6.0              # width of the slot opening of a 2020 profile
screw = 5.5             # clearance hole for an M5 screw
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as bracket:
    Box(20, 30, 4, align=low)                       # lies flat on one face of the profile
    # a key that drops into the slot, so the part cannot turn
    Box(slot - 0.3, 30, 1.2, align=(Align.CENTER, Align.CENTER, Align.MAX))
    with Locations((0, 0, 4)):
        Hole(radius=screw / 2)                      # for an M5 screw into a T-nut in the slot
# [/snippet]

# the profile lies along Y, with its top face at z = 0
profile = Pos(0, 35, -10) * Rot(90, 0, 0) * extrusion_2020(70)
nut = Pos(0, 0, -1.8) * t_nut("M5")
bolt = Pos(0, 0, 4) * cap_screw("M5", 9.5)


def key(face):
    return face.center().Z < -0.01


bare = scene.state("2020 profile")
bare.solid(profile, role="steel")
bare.line((-10, -35.05, -20), (10, -35.05, -20), role="accent")
bare.label((0, -35, -20), "20 × 20 mm", "b")
bare.label((3, -35, 0), "slot: 6 mm wide", "t")
bare.label((0, -35, -10), "centre hole", "l")

fitted = scene.state("Part bolted on")
fitted.solid(profile, role="steel")
fitted.solid(bracket.part, accent=key)
fitted.solid(bolt, role="steel")
fitted.label((10, 0, 3), "printed part", "r")
fitted.label((0, 0, 9), "M5 screw", "t")

inside = scene.state("Cut open")
inside.solid(cut_open(profile), role="steel", section=is_cut_face)
inside.solid(cut_open(bracket.part), section=is_cut_face, accent=key)
inside.solid(cut_open(nut), role="steel", section=is_cut_face)
inside.solid(bolt, role="steel")
inside.label((5.2, 0, -3), "T-nut in the slot", "r")
inside.label((-2.8, 0, -0.6), "key in the slot", "l")
scene.save(thumb=1)
