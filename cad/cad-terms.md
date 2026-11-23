# CAD terms for build123d and 3D printing

A shared vocabulary between a person and an AI agent that writes build123d code for 3D-printed parts. When the person uses one of these terms, it has the meaning given here.

## Working rules

- All dimensions are in millimetres.
- Z is up. Front is the side toward −Y, back is +Y, left is −X, right is +X, top is +Z, bottom is −Z.
- Unless told otherwise, a part sits on the XY plane with its bottom at z = 0, centred in X and Y.
- A size given for a hole, pin, tube or cylinder is a diameter unless the person says radius. A fillet size is a radius.
- Clearance is per side unless the person says total. A 0.2 mm clearance on a 10 mm peg means a 10.4 mm hole.
- A hole described only by a screw size, such as an M3 hole, needs one more fact: clearance, thread-in or insert. Ask if it is missing.
- Put every dimension in a named variable at the top of the script and derive positions from those variables.
- If a dimension, a position or a side is not stated, ask. Do not guess silently, and list any assumption you make.

## build123d notes to remember

- **Boolean operations:** Inside a BuildPart block the same three choices are mode=Mode.ADD, Mode.SUBTRACT and Mode.INTERSECT.
- **Shell:** build123d has no function called shell. Use offset with a negative amount, and pass the faces to remove as openings.
- **Offset:** An outward offset rounds the outside corners by default. Pass kind=Kind.INTERSECTION to keep them sharp. The same offset function hollows a solid when you give it a 3D part: see Shell.
- **Pattern:** GridLocations and PolarLocations only choose the places. Whatever you create inside the with block is made once at every place.
- **Mirror:** Plane.YZ mirrors left to right, Plane.XZ front to back and Plane.XY top to bottom. Inside BuildPart the copy is joined to what is already there.
- **Through hole and blind hole:** Hole with no depth goes right through. Give depth= for a blind hole. The hole starts at the current location and goes down into the part.
- **Countersink:** build123d defaults to an 82° cone, which fits US inch screws. Metric countersunk screws use 90°, so set counter_sink_angle=90.
- **Slot:** SlotOverall takes the full end-to-end length. SlotCenterToCenter takes the distance between the centres of the two round ends. Say which one you mean.
- **Nut trap:** major_radius=False makes the radius reach the flat sides, so the size you give is the nut's flat-to-flat width.
- **Face, edge, vertex:** sort_by orders items along a direction so you can take the first or last. group_by collects items that sit at the same position. filter_by keeps items of one kind or direction.
- **Directions and axes:** sort_by(Axis.Y)[0] is the face furthest toward −Y, the front. [-1] is the one furthest toward +Y, the back. The same works with Axis.X and Axis.Z.
- **Align:** Every build123d shape is centred by default, in all three directions. That is why a Box often ends up half below the plane. Pass align=(Align.CENTER, Align.CENTER, Align.MIN) to sit it on top.
- **Concentric:** Features created at the same Locations are concentric automatically. Problems start when one of them is placed by hand with its own coordinates.
- **Diameter and radius:** Circle, Cylinder, Hole and fillet in build123d all take a radius. Keep the diameter in a named variable and divide by two where it is used.

## Making solids

Ways to turn a flat sketch into a 3D shape, and to combine or copy shapes.

### Extrude

Also called: pad.

Extrude takes a flat 2D shape, called the profile, and pushes it in a straight line to make a solid. Holes in the profile become holes through the solid. It is the most common way to start a part.

```python
with BuildPart() as part:
    with BuildSketch() as profile:
        RectangleRounded(40, 26, radius=6)
        Circle(6, mode=Mode.SUBTRACT)
    extrude(amount=12)
```

Printing: A profile extruded straight up from the print bed gives vertical walls, which print cleanly without support.

Not the same as Revolve: Extrude pushes the profile in a straight line. Revolve spins it around an axis.

### Revolve

Also called: lathe, revolution.

Revolve spins a flat profile around an axis, like clay on a potter's wheel. A full 360° turn gives a round part such as a knob, spool or wheel. A smaller angle gives only a slice of it.

```python
with BuildPart() as part:
    with BuildSketch(Plane.XZ) as profile:
        with BuildLine():
            Polyline(
                (4, 0), (16, 0), (16, 4), (8, 8),
                (8, 18), (16, 22), (16, 26), (4, 26),
                close=True,
            )
        make_face()
    revolve(axis=Axis.Z, revolution_arc=360)
```

Printing: Round parts usually print best standing up, with the axis pointing away from the bed, so every layer is a full circle.

Not the same as Extrude: Revolve spins the profile around an axis. Extrude pushes it in a straight line.

### Loft

Also called: blend, transition.

Loft joins two or more flat profiles, set some distance apart, with a smooth skin. The solid starts as the first shape and gradually turns into the last one. It is how you make adapters, funnels and tapered handles.

```python
with BuildPart() as part:
    with BuildSketch() as bottom:                      # a square at the bottom
        Rectangle(32, 32)
    with BuildSketch(Plane.XY.offset(30)) as top:      # a circle 30 mm above it
        Circle(9)
    loft()                                             # blend one into the other
```

Printing: A loft that gets narrower toward the top prints without support. One that flares outward is an overhang, so keep the flare gentler than 45°.

Not the same as Extrude: Extrude keeps the same shape all the way. Loft changes from one shape into another.

Not the same as Sweep: Loft blends between different profiles. Sweep moves one profile along a path.

### Sweep

Also called: pipe, sweep along a path.

Sweep drags a flat profile along a line or curve, called the path, and fills in everything it passes through. A ring swept along a bent path gives a pipe. It is the tool for tubes, cable channels, handles and rails.

```python
with BuildPart() as part:
    with BuildLine(Plane.XZ) as path:                  # the route to follow
        FilletPolyline((0, 0), (0, 26), (36, 26), radius=12)
    with BuildSketch() as profile:                     # the shape that travels along it
        Circle(5)
        Circle(3.5, mode=Mode.SUBTRACT)
    sweep()
```

Printing: A tube running sideways has a small overhang at the top of its inside. Up to roughly 8 mm inside diameter this usually prints without support.

Not the same as Extrude: Extrude pushes the profile in a straight line. Sweep can follow any path.

Not the same as Loft: Sweep moves one profile along a path. Loft blends between different profiles.

### Boolean operations

Also called: union, subtract, intersect, cut, difference, fuse, combine.

A boolean operation combines two solids into one. Union joins them. Subtract removes one from the other, which is how most holes and pockets are made. Intersect keeps only the volume the two share.

```python
box = Box(30, 30, 16)
cylinder = Pos(12, -12, 0) * Cylinder(radius=11, height=26)

joined = box + cylinder     # union: keep both
cut = box - cylinder        # subtract: remove the cylinder from the box
overlap = box & cylinder    # intersect: keep only the shared part
```

Code note: Inside a BuildPart block the same three choices are mode=Mode.ADD, Mode.SUBTRACT and Mode.INTERSECT.

### Shell

Also called: hollow.

Shell hollows out a solid and leaves a wall of the thickness you choose. Any face you name as an opening is removed completely. It turns a block into a box or case in one step.

```python
with BuildPart() as part:
    Box(50, 36, 22)
    top = part.faces().sort_by(Axis.Z)[-1]
    offset(amount=-2, openings=top)    # 2 mm walls, top left open
```

Code note: build123d has no function called shell. Use offset with a negative amount, and pass the faces to remove as openings.

Printing: Keep walls at least 1.2 mm thick, which is three passes of a 0.4 mm nozzle. 2 mm is a safe choice for an enclosure.

### Offset

Also called: inset, outset, grow, shrink.

Offset makes a new outline that stays a fixed distance from the original everywhere. A positive distance grows the shape and a negative one shrinks it. It is how you make a border, a matching lid, or a part that fits around another with an even gap.

```python
with BuildSketch() as shape:
    Polygon((-15, -10), (15, -10), (15, 0), (0, 0), (0, 10), (-15, 10), align=None)

bigger = offset(shape.sketch, amount=3)       # 3 mm outward, all the way round
smaller = offset(shape.sketch, amount=-3)     # 3 mm inward
```

Code note: An outward offset rounds the outside corners by default. Pass kind=Kind.INTERSECTION to keep them sharp. The same offset function hollows a solid when you give it a 3D part: see Shell.

Not the same as Shell: Offset moves an outline or surface by a distance. Shell uses that to hollow a solid, leaving a wall.

Not the same as Scale: Offset adds the same distance everywhere, so a 2 mm rim stays 2 mm. Scale multiplies every size, so thin parts and thick parts change by different amounts.

### Pattern

Also called: array, linear pattern, polar pattern, circular pattern.

A pattern repeats one feature many times at regular spacing. A grid (or linear) pattern places the copies in rows and columns. A polar pattern places them around a centre point, like the bolt holes on a flange. You give the count and the spacing instead of placing each copy by hand.

```python
# Grid pattern: rows and columns
with BuildPart() as plate:
    Box(54, 34, 4)
    with GridLocations(x_spacing=12, y_spacing=14, x_count=4, y_count=2):
        Hole(radius=2.5)

# Polar pattern: copies spread around a circle
with BuildPart() as flange:
    Cylinder(radius=22, height=4)
    with PolarLocations(radius=15, count=6):
        Hole(radius=2.5)
```

Code note: GridLocations and PolarLocations only choose the places. Whatever you create inside the with block is made once at every place.

Not the same as Mirror: A pattern makes several copies that all face the same way. A mirror makes one flipped copy.

### Mirror

Also called: symmetry, reflect.

Mirror reflects a shape across a plane, the way a mirror would show it. You model one half of a symmetric part, mirror it, and the two halves join into the whole part. A change to the first half then appears on both sides.

```python
low = (Align.MIN, Align.CENTER, Align.MIN)

with BuildPart() as half:                    # build one side only
    Box(24, 22, 4, align=low)
    with Locations((20, 0, 4)):
        Box(4, 22, 14, align=low)
    with Locations((10, 0, 4)):
        Hole(radius=2.4)

with BuildPart() as part:
    insert(half.part)
    mirror(about=Plane.YZ)                   # copy it to the other side
```

Code note: Plane.YZ mirrors left to right, Plane.XZ front to back and Plane.XY top to bottom. Inside BuildPart the copy is joined to what is already there.

Not the same as Pattern: A mirror makes one flipped copy. A pattern makes several copies that all face the same way.

## Edges and strength

Small features that soften sharp edges and stiffen thin walls.

### Fillet

Also called: round, rounded edge.

A fillet replaces a sharp edge with a rounded one. Its size is the radius of the curve. Fillets make a part more comfortable to hold, and make inside corners stronger because the load is spread over the curve.

```python
with BuildPart() as part:
    Box(40, 30, 15)
    top_edges = part.edges().group_by(Axis.Z)[-1]
    fillet(top_edges, radius=4)
```

Printing: A fillet on an edge that touches the print bed starts as a steep overhang and often prints rough. Use a chamfer there instead.

Not the same as Chamfer: A fillet is curved. A chamfer is a flat cut at an angle.

### Chamfer

Also called: bevel.

A chamfer replaces a sharp edge with a flat, angled face, usually at 45°. Its size is the length cut back from the edge. Chamfers remove sharp corners and help two parts slide into each other.

```python
with BuildPart() as part:
    Box(40, 30, 15)
    top_edges = part.edges().group_by(Axis.Z)[-1]
    chamfer(top_edges, length=4)
```

Printing: A 45° chamfer prints without support facing up or down, so it is the safe choice for edges that touch the print bed.

Not the same as Fillet: A chamfer is a flat cut at an angle. A fillet is curved.

### Rib and gusset

Also called: gusset, stiffener, web, brace.

A rib is a thin extra wall that braces a larger one. A gusset is a triangular rib in the corner between two walls. Both add a lot of stiffness for very little plastic, so they work better than making the whole wall thicker.

```python
corner = (Align.MIN, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(40, 26, 4, align=corner)             # base
    Box(4, 26, 30, align=corner)             # wall
    with BuildSketch(Plane.XZ):              # a triangle in the inside corner
        Polygon((4, 4), (28, 4), (4, 24), align=None)
    extrude(amount=1.5, both=True)           # 3 mm thick rib
```

Printing: Make a rib at least 1.2 mm thick. A gusset with a 45° slope prints without support.

Not the same as Fillet: A fillet rounds the corner itself. A rib adds a brace across the corner, which stiffens a tall wall far more.

## Holes and slots

Openings for screws, pins and cables.

### Through hole and blind hole

Also called: thru hole, pocket hole.

A through hole passes completely through the part and is open at both ends. A blind hole stops at a set depth, so it has a floor. Always say which one you want, and give the depth for a blind hole.

```python
with BuildPart() as part:
    Box(38, 18, 12)
    with Locations((-9, 0, 6)):          # on the top face
        Hole(radius=3)                   # through hole: goes all the way
    with Locations((9, 0, 6)):
        Hole(radius=3, depth=7)          # blind hole: stops 7 mm down
```

Code note: Hole with no depth goes right through. Give depth= for a blind hole. The hole starts at the current location and goes down into the part.

Printing: A blind hole that opens downward has a flat roof that must print in mid-air. Small ones are fine. For larger ones, turn the part over or make the roof a cone.

Not the same as Counterbore: A blind hole has one diameter. A counterbore has two: a narrow hole with a wider recess on top.

### Counterbore

Also called: cbore.

A counterbore is a hole with a wider, flat-bottomed recess at the top. The recess hides the head of a socket-head screw, the kind with a cylinder-shaped head, so nothing sticks out above the surface.

```python
with BuildPart() as part:
    Box(18, 18, 8)
    with Locations((0, 0, 4)):    # centre of the top face
        CounterBoreHole(radius=1.7, counter_bore_radius=3.25, counter_bore_depth=3.4)
```

Printing: With the opening facing up it prints cleanly. Facing down, the flat step has to print in mid-air, so add support or turn the part over.

Not the same as Countersink: A counterbore has a flat step for cylinder-head screws. A countersink is a cone for flat-head screws.

### Countersink

Also called: csk.

A countersink is a hole with a cone-shaped opening at the top. It matches the sloped underside of a flat-head screw, so the top of the screw ends up level with the surface.

```python
with BuildPart() as part:
    Box(18, 18, 8)
    with Locations((0, 0, 4)):    # centre of the top face
        CounterSinkHole(radius=1.7, counter_sink_radius=3.2, counter_sink_angle=90)
```

Code note: build123d defaults to an 82° cone, which fits US inch screws. Metric countersunk screws use 90°, so set counter_sink_angle=90.

Printing: The cone is a 45° slope, so a countersink prints well facing up or down.

Not the same as Counterbore: A countersink is a cone for flat-head screws. A counterbore has a flat step for cylinder-head screws.

### Slot

Also called: slotted hole, obround, elongated hole.

A slot is a hole stretched into a line: two straight sides with a half circle at each end. A screw or pin can sit anywhere along its length, which gives you room for adjustment. Its width matches the screw, and its length sets how far things can move.

```python
with BuildPart() as part:
    Box(46, 22, 4)
    with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):    # on the top face
        SlotOverall(width=24, height=3.4)                  # 24 long, 3.4 wide (M3)
    extrude(amount=-4, mode=Mode.SUBTRACT)
```

Code note: SlotOverall takes the full end-to-end length. SlotCenterToCenter takes the distance between the centres of the two round ends. Say which one you mean.

Printing: A slot through a flat plate prints cleanly. Cut sideways through a standing wall, its long flat top becomes a bridge.

Not the same as Groove: A slot goes right through the material. A groove is a channel cut only part of the way in.

### Teardrop hole

Also called: teardrop, printable horizontal hole.

A teardrop hole is a round hole with a pointed roof added on top, like an upside-down drop of water. It is used for holes that run sideways through a standing wall. The top of a plain round hole is nearly flat and sags when printed. The two 45° sides of the point print cleanly.

```python
radius = 5
reach = radius * 0.7071       # where a 45° line touches the circle

with BuildPart() as part:
    Box(34, 10, 28, align=(Align.CENTER, Align.CENTER, Align.MIN))     # a standing wall
    with BuildSketch(Plane.XZ):                                        # seen from the front
        with Locations((0, 14)):
            Circle(radius)
            # a pointed roof on top of the circle: no part of it is flatter than 45°
            Polygon((-reach, reach), (0, radius * 1.4142), (reach, reach), align=None)
    extrude(amount=5, both=True, mode=Mode.SUBTRACT)
```

Printing: Small sideways holes, up to about 6 mm, print acceptably round. Use a teardrop above that size, and always point it away from the bed.

Not the same as Overhang: An overhang is the problem. A teardrop is one fix for it, for holes that run sideways.

## Joining parts

How two parts hold together: screws, snaps and interlocking shapes.

### Screw sizes

Also called: metric screws, M3, bolt sizes, fasteners.

Metric screws are named by their thread diameter in millimetres: an M3 screw has a 3 mm thread. The length is measured under the head, so M3 × 10 is 10 mm long. Each screw needs one of three kinds of hole: a clearance hole it slides through, a smaller hole it threads into, or a larger hole for a brass insert.

```python
# Hole diameters in mm: [M2, M2.5, M3, M4, M5]
SCREWS = ["M2", "M2.5", "M3", "M4", "M5"]
CLEARANCE = dict(zip(SCREWS, [2.4, 2.9, 3.4, 4.5, 5.5]))   # screw slides through
THREAD_IN = dict(zip(SCREWS, [1.6, 2.1, 2.5, 3.3, 4.2]))   # screw bites into plastic
INSERT = dict(zip(SCREWS, [3.2, 4.0, 4.0, 5.6, 6.4]))      # brass heat-set insert

screw = "M3"

with BuildPart() as block:
    Box(44, 14, 10)
    with Locations((-14, 0, 5)):
        Hole(radius=CLEARANCE[screw] / 2)        # right through
    with Locations((0, 0, 5)):
        Hole(radius=THREAD_IN[screw] / 2, depth=8)
    with Locations((14, 0, 5)):
        Hole(radius=INSERT[screw] / 2, depth=6.5)
```

Hole and hardware sizes, in mm:

| Screw | Clearance hole | Thread-in hole | Insert hole | Head width | Nut width |
|---|---|---|---|---|---|
| M2 | 2.4 | 1.6 | 3.2 | 3.8 | 4.0 |
| M2.5 | 2.9 | 2.1 | 4.0 | 4.5 | 5.0 |
| M3 | 3.4 | 2.5 | 4.0 | 5.5 | 5.5 |
| M4 | 4.5 | 3.3 | 5.6 | 7.0 | 7.0 |
| M5 | 5.5 | 4.2 | 6.4 | 8.5 | 8.0 |

Clearance holes are the standard medium fit. Thread-in holes are the standard drill sizes for cutting a thread. Insert holes are typical for common brass inserts and differ by brand, so check the datasheet. Head width is for socket-head screws. Nut width is measured flat to flat.

Printing: Printed holes come out a little small. For a clearance hole this rarely matters. For a thread-in hole, start with the table value plus 0.2 mm and test with one screw before you print the whole part.

Good to know: M3 is the usual choice for small printed cases. M2.5 fits the mounting holes of a Raspberry Pi. M2 suits very small boards and sensors.

Not the same as Self-tapping screw: A machine screw, such as M3, has a fine thread made for nuts and inserts. A self-tapping screw has a coarse, sharp thread made for biting into plastic, and its sizes are named differently.

### Boss and standoff

Also called: screw boss, mounting post, spacer, pillar.

A boss is a raised cylinder of material around a hole, so a screw has enough plastic to bite into. A standoff is a boss that also holds something, usually a circuit board, at a set height above the floor. The gap leaves room for the solder joints under the board.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as base:
    Box(48, 36, 2, align=low)                        # the floor of the case
    with Locations((0, 0, 2)):
        with GridLocations(36, 24, 2, 2):            # where the board's holes are
            Cylinder(radius=3, height=5, align=low)  # four bosses, 5 mm tall
    with Locations((0, 0, 7)):
        with GridLocations(36, 24, 2, 2):
            Hole(radius=1.05, depth=5)               # M2.5 screw threads in
```

Printing: Make the boss at least twice as wide as its hole, and add a small fillet at the foot. A thin post standing alone snaps off between layers.

Not the same as Heat-set insert: A boss is the plastic post. A heat-set insert is a metal thread you can melt into that post.

### Heat-set insert

Also called: threaded insert, brass insert, knurled insert.

A heat-set insert is a small brass tube with a screw thread inside and ridges outside. You press it into a slightly smaller hole with a hot soldering iron. The plastic melts around the ridges and grips it, leaving a strong metal thread that does not wear out.

```python
insert_hole = 4.0      # for a typical M3 insert: check your insert's datasheet
insert_length = 5.7
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(22, 22, 2, align=low)
    with Locations((0, 0, 2)):
        Cylinder(radius=4.2, height=8, align=low)                # boss around the insert
    with Locations((0, 0, 10)):
        Hole(radius=insert_hole / 2, depth=insert_length + 1)    # 1 mm spare at the bottom
```

Printing: Print the hole at the size on the insert's datasheet and leave at least 2 mm of plastic around it. Make the hole about 1 mm deeper than the insert, so the melted plastic has somewhere to go.

Not the same as Nut trap: An insert is melted in and stays there. A nut trap is a pocket for an ordinary nut: no heat needed, but the nut can fall out.

### Nut trap

Also called: captive nut, nut pocket, nut slot.

A nut trap is a hexagonal pocket the same shape as a nut. The nut drops in and the flat sides stop it from turning, so you can tighten the screw from the other side with one tool. It gives a strong metal thread using only an ordinary nut.

```python
nut_width = 5.5     # M3 nut, measured flat to flat
nut_height = 2.4
gap = 0.2           # extra room so the nut drops in

with BuildPart() as part:
    Box(18, 18, 8)
    Hole(radius=1.7)                                 # M3 clearance hole, right through
    with BuildSketch(Plane.XY.offset(4)):            # on the top face
        RegularPolygon(radius=(nut_width + gap) / 2, side_count=6, major_radius=False)
    extrude(amount=-(nut_height + 0.4), mode=Mode.SUBTRACT)
```

Code note: major_radius=False makes the radius reach the flat sides, so the size you give is the nut's flat-to-flat width.

Printing: Make the pocket about 0.2 mm wider than the nut. A pocket that opens downward has a small flat roof, which prints fine at this size.

Not the same as Heat-set insert: A nut trap holds an ordinary nut and needs no heat. A heat-set insert is melted in and cannot fall out.

### Snap fit

Also called: snap hook, clip, cantilever snap, latch.

A snap fit is a thin, flexible arm with a hook on its end. As the parts are pushed together, a slope on the hook bends the arm out of the way. The arm then springs back, and the flat face of the hook catches behind an edge. This kind is called a cantilever snap and is the most common one.

```python
arm_length = 16     # longer = bends more easily
arm_thick = 2
hook = 1.5          # how far the hook sticks out

with BuildPart() as clip:
    with BuildSketch(Plane.XZ):              # side view, arm hanging down
        Polygon(
            (0, 0), (arm_thick, 0),
            (arm_thick, -arm_length + 5.6),          # flat catch face
            (arm_thick + hook, -arm_length + 5.6),
            (arm_thick + hook, -arm_length + 4.6),
            (arm_thick, -arm_length),                # lead-in slope
            (0, -arm_length),
            align=None,
        )
    extrude(amount=4, both=True)             # 8 mm wide
```

Printing: Print the arm lying along the layers, never standing across them, or it will snap off. A longer, thinner arm bends more safely. PETG flexes better than PLA.

Not the same as Clearance: A snap fit bends and springs back to lock. A press fit (interference fit) has nothing that moves: it holds only by being a tight squeeze.

### Lip and groove

Also called: lid lip, rebate, tongue and groove, step joint.

A lip is a thin raised rim around the edge of one part. It fits into a matching recess or groove in the other part. Together they stop a lid from sliding sideways, hide the seam and keep dust out. They only locate the lid, so you still need screws or snaps to hold it shut.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)
gap = 0.2      # clearance so the lid goes on without force

with BuildPart() as base:
    Box(40, 30, 14, align=low)
    offset(amount=-2, openings=base.faces().sort_by(Axis.Z)[-1])   # hollow, 2 mm walls
    with BuildSketch(Plane.XY.offset(14)):       # lip: a thin wall on the inner half of the rim
        Rectangle(38, 28)
        Rectangle(36, 26, mode=Mode.SUBTRACT)
    extrude(amount=2)

with BuildPart() as lid:
    with Locations((0, 0, 14)):
        Box(40, 30, 4, align=low)
    with BuildSketch(Plane.XY.offset(14)):       # recess that the lip fits into
        Rectangle(38 + 2 * gap, 28 + 2 * gap)
    extrude(amount=2 + gap, mode=Mode.SUBTRACT)
```

Printing: Leave about 0.2 mm of clearance on each side. Make the lip at least 1 mm thick, or it will not survive being opened and closed.

Not the same as Snap fit: A lip only keeps the lid in position. A snap fit actually holds it closed.

### Sliding dovetail

Also called: dovetail, dovetail rail, dovetail slide.

A dovetail is a rail whose cross-section is a trapezoid: narrow where it joins its part and wider at the tip. It slides into a slot of the same shape from one end. Because the tip is wider than the opening, the two parts can slide along the slot but cannot be pulled apart any other way.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)
gap = 0.2      # clearance on each sloped side

with BuildPart() as base:
    Box(30, 30, 10, align=low)
    with BuildSketch(Plane.XZ):              # slot: narrow at the top, wide inside
        Polygon((-4, 10), (4, 10), (6, 5), (-6, 5), align=None)
    extrude(amount=15, both=True, mode=Mode.SUBTRACT)

with BuildPart() as slider:
    with Locations((0, 0, 10)):
        Box(18, 30, 4, align=low)
    with BuildSketch(Plane.XZ):              # the same shape, a little smaller
        Polygon((-4 + gap, 10), (4 - gap, 10), (6 - gap, 5 + gap), (-6 + gap, 5 + gap), align=None)
    extrude(amount=15, both=True)
```

Printing: The sloped sides are well under 45°, so both parts print without support. Start with 0.2 mm of clearance per side and test with a short piece first.

Not the same as Tab and slot: A dovetail slides in from the end and cannot lift out. A tab pushes straight in and pulls straight out.

### Tab and slot

Also called: mortise and tenon, finger joint, box joint, tongue.

A tab is a small rectangular tongue sticking out of one part. A slot is the matching hole in the other part. Pushing the tabs into the slots lines the two parts up exactly and stops them from sliding, ready for glue or a screw. Woodworkers call the same idea a mortise and tenon.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)
gap = 0.15     # clearance on each side of a tab

with BuildPart() as base:
    Box(42, 24, 3, align=low)
    with Locations((-10, 0, 0), (10, 0, 0)):
        Box(8 + 2 * gap, 3 + 2 * gap, 3, align=low, mode=Mode.SUBTRACT)    # two slots

with BuildPart() as wall:
    with Locations((0, 0, 3)):
        Box(36, 3, 20, align=low)
    with Locations((-10, 0, 0), (10, 0, 0)):
        Box(8, 3, 3, align=low)                                            # two tabs
```

Printing: Make each slot 0.1 to 0.2 mm larger than its tab on every side. A small chamfer on the end of the tab makes it much easier to push in.

Not the same as Sliding dovetail: A tab pushes straight in and pulls straight out. A dovetail slides in from the end and cannot lift out.

### Miter joint

Also called: mitre joint, 45 degree joint.

In a miter joint the ends of both parts are cut at an angle, usually 45°, so they meet along a diagonal seam and form a 90° corner. No end face is left showing, which is why picture frames use it. It looks clean but has little strength of its own, so it needs glue, a pin or a screw.

```python
with BuildPart() as bar:
    with BuildSketch():
        Polygon((0, 0), (32, 0), (32, 8), (8, 8), align=None)    # one end cut at 45°
    extrude(amount=8)

# the matching bar is a mirror image across the 45° line
diagonal = Plane(origin=(0, 0, 0), z_dir=(1, -1, 0))
other = mirror(bar.part, about=diagonal)
```

Printing: Printed in one piece, a corner needs no joint at all. Miters are for frames too large for the printer, printed as separate bars and glued.

Not the same as Lap joint: A miter meets edge to edge along a diagonal. A lap joint overlaps the two parts, which gives far more area for glue or a screw.

Not the same as Butt joint: In a butt joint one square end simply meets the side of the other part, so that end stays visible. A miter hides both ends.

### Lap joint

Also called: half-lap, halving joint, overlap joint.

In a lap joint the two parts overlap. In the most common kind, the half-lap, half the thickness is removed from each part over the overlap, so together they are exactly as thick as one part. The large flat contact area makes it strong when glued or screwed.

```python
corner = (Align.MIN, Align.MIN, Align.MIN)

with BuildPart() as bar_a:                   # runs along X, top half removed at the end
    Box(34, 10, 8, align=corner)
    with Locations((0, 0, 4)):
        Box(10, 10, 4, align=corner, mode=Mode.SUBTRACT)

with BuildPart() as bar_b:                   # runs along Y, bottom half removed at the end
    Box(10, 34, 8, align=corner)
    Box(10, 10, 4, align=corner, mode=Mode.SUBTRACT)
```

Printing: A good way to join a part you had to split to fit the printer. Leave about 0.1 mm between the touching faces and put a screw or pin through the overlap.

Not the same as Miter joint: A lap joint overlaps the two parts. A miter meets edge to edge along a diagonal, which looks neater but is weaker.

## Position and reference

Words for saying exactly where something goes.

### Face, edge, vertex

Also called: topology.

Every solid is made of faces (its surfaces), edges (the lines where two faces meet) and vertices (the points where edges meet). Most CAD operations need to be told which faces, edges or vertices to work on.

```python
part = Box(40, 30, 15)

top_face = part.faces().sort_by(Axis.Z)[-1]      # one face
top_edges = part.edges().group_by(Axis.Z)[-1]    # four edges
corners = part.vertices()                        # eight vertices
```

Code note: sort_by orders items along a direction so you can take the first or last. group_by collects items that sit at the same position. filter_by keeps items of one kind or direction.

### Plane

Also called: workplane, sketch plane, datum plane.

A plane is an endless flat surface used as the drawing board for a sketch. The three standard planes are named after the two axes that lie in them: XY, XZ and YZ. You can also move a plane with offset, or use a face of your part as a plane.

```python
Plane.XY               # lies flat, faces up (+Z)
Plane.XZ               # stands up, faces the front (-Y)
Plane.YZ               # stands up, faces the right (+X)
raised = Plane.XY.offset(15)    # the XY plane moved 15 mm up

with BuildSketch(raised) as sketch:
    Circle(8)          # drawn 15 mm above the floor
```

Printing: For most printers the XY plane is the print bed and Z is the direction the layers stack.

Not the same as Align: A plane says where you are working. Align says which point of the new shape lands there.

### Directions and axes

Also called: front, back, left, right, orientation, X, Y, Z.

CAD positions use three axes: X runs left to right, Y runs front to back, and Z runs bottom to top. In the usual view, front is the side toward −Y, right is toward +X and top is toward +Z. Saying the axis as well as the word removes any doubt about which side you mean.

```python
with BuildPart() as part:
    Box(40, 26, 16, align=(Align.CENTER, Align.CENTER, Align.MIN))

faces = part.faces()
front = faces.sort_by(Axis.Y)[0]      # lowest Y
back = faces.sort_by(Axis.Y)[-1]      # highest Y
left = faces.sort_by(Axis.X)[0]
right = faces.sort_by(Axis.X)[-1]
bottom = faces.sort_by(Axis.Z)[0]
top = faces.sort_by(Axis.Z)[-1]
```

Code note: sort_by(Axis.Y)[0] is the face furthest toward −Y, the front. [-1] is the one furthest toward +Y, the back. The same works with Axis.X and Axis.Z.

Printing: On most printers the bed is the XY plane and Z is the height, so the bottom of your model is what touches the bed.

Not the same as Plane: A direction is a way to point: up, or toward +X. A plane is a flat surface, named by the two axes that lie in it.

### Align

Also called: alignment, anchor point, centred.

Align decides which point of a new shape is placed at the origin, or at the location you gave. Centred puts the middle of the shape there. Min puts its lowest corner there. Mixing them, for example centred in X and Y but min in Z, makes the shape sit on top of the plane and not half buried in it.

```python
# The same box three times. Only the place of the origin (0, 0, 0) changes.
centred = Box(30, 20, 12)                                                    # the default
corner = Box(30, 20, 12, align=(Align.MIN, Align.MIN, Align.MIN))
on_bed = Box(30, 20, 12, align=(Align.CENTER, Align.CENTER, Align.MIN))
```

Code note: Every build123d shape is centred by default, in all three directions. That is why a Box often ends up half below the plane. Pass align=(Align.CENTER, Align.CENTER, Align.MIN) to sit it on top.

Printing: Keeping the bottom of your part at z = 0 matches the print bed, so heights in the model are heights above the bed.

Not the same as Plane: Align says which point of the new shape lands at the location. A plane says where that location is and which way is up.

### Concentric

Also called: coaxial, same centre, centred on.

Two circles are concentric when they share the same centre point, like the rings of a target. For 3D features such as a hole inside a boss, the exact word is coaxial: they share one axis. Saying it tells the agent that the wall between them must be the same thickness all the way round.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(36, 36, 4, align=low)
    with Locations((0, 0, 4)):
        Cylinder(radius=11, height=9, align=low)     # boss
    with Locations((0, 0, 13)):
        Hole(radius=5)                               # same centre as the boss
```

Code note: Features created at the same Locations are concentric automatically. Problems start when one of them is placed by hand with its own coordinates.

Not the same as Tangent: Concentric circles share a centre and never touch. Tangent circles touch at exactly one point.

### Flush, proud, recessed

Also called: level, sticks out, sunken, inset.

Flush means two surfaces are exactly level, so a finger sliding across feels no step. Proud means one sticks out above the other. Recessed means it sits below. Follow proud or recessed with a distance, such as proud by 2 mm, and the agent knows exactly what to build.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)
hang = (Align.CENTER, Align.CENTER, Align.MAX)
top = 6        # height of the panel surface

with BuildPart() as panel:
    Box(72, 22, top, align=low)
    with Locations((-24, 0, top), (0, 0, top), (24, 0, top)):
        Box(12.4, 12.4, 5, align=hang, mode=Mode.SUBTRACT)     # three pockets

flush = Pos(-24, 0, top) * Box(12, 12, 5, align=hang)          # top level with the surface
proud = Pos(0, 0, top + 2) * Box(12, 12, 7, align=hang)        # sticks out 2 mm
recessed = Pos(24, 0, top - 2) * Box(12, 12, 3, align=hang)    # sits 2 mm below
```

Printing: Two separate parts are never perfectly flush after printing. If a step must not show, recess one part by 0.2 mm on purpose: a small even step looks neater than an uneven one.

Not the same as Counterbore: Recessed describes the result: something sits below the surface. A counterbore is one feature that gets a screw head there.

### Diameter and radius

Also called: Ø, OD, ID, inside diameter, outside diameter.

The diameter of a circle is its full width, measured through the centre. The radius is the distance from the centre to the edge, which is half the diameter. People, drawings and screw tables almost always give the diameter, but CAD code often asks for the radius. Mixing them up makes a hole twice or half the size you wanted.

```python
hole_diameter = 10      # people, drawings and screw tables give the diameter

with BuildPart() as part:
    Box(30, 30, 8)
    Hole(radius=hole_diameter / 2)      # build123d asks for the radius
```

Code note: Circle, Cylinder, Hole and fillet in build123d all take a radius. Keep the diameter in a named variable and divide by two where it is used.

Not the same as Fillet: A fillet is the one feature normally given as a radius: a 4 mm fillet means a 4 mm radius.

### Parameter

Also called: variable, parametric design, named dimension.

A parameter is a dimension stored under a name, such as length or wall, in place of a bare number written into the shape. Other sizes and positions are worked out from it. Change the one number and the whole model follows, with holes and walls still in the right place. A model built this way is called parametric.

```python
length = 60         # change a number here ...
width = 30
thickness = 4
hole = 4.5
edge = 6            # from each hole centre to the edges

with BuildPart() as part:
    Box(length, width, thickness)
    with GridLocations(length - 2 * edge, width - 2 * edge, 2, 2):
        Hole(radius=hole / 2)       # ... and the holes follow
```

Printing: Make the clearance a parameter too. After one test print you can then tune the fit of every joint by changing a single number.

Not the same as Tolerance: A parameter is a number you choose and can change. A tolerance is how far the real part may differ from that number.

## Technical drawing

How a 3D part is shown on flat paper.

### Orthographic views

Also called: front, top and side views, multiview drawing, projection.

Orthographic views each show the part straight-on from one direction, with no perspective, so sizes can be measured from the drawing. A standard drawing lines up front, top and right views. Edges hidden behind material are drawn dashed.

```python
# Look at the part from the front and flatten what you see into 2D lines.
# "hidden" holds the edges that are behind material (drawn dashed).
visible, hidden = part.project_to_viewport(
    viewport_origin=(0, -100, 0),    # camera in front of the part
    viewport_up=(0, 0, 1),
)
```

Good to know: Putting the top view above the front view is called third-angle projection, the US standard. European (ISO) drawings use first-angle projection, where the top view goes below the front view.

Not the same as Section view: An orthographic view shows the outside and marks hidden edges with dashes. A section view cuts the part open to show the inside directly.

### Section view

Also called: cross-section, cutaway.

A section view shows the part as if it were sliced through and the front piece taken away. The cut material is filled with diagonal lines, called hatching. A cutting line with letters (A–A) on another view shows where the slice was made.

```python
# Cut the part in half through its middle so you can look inside.
half = split(part, bisect_by=Plane.XZ, keep=Keep.BOTTOM)
```

Printing: Slicing your model open is the quickest way to check wall thickness and find hidden hollows before you print.

Not the same as Orthographic views: A section view cuts the part open. An orthographic view shows the uncut outside and marks hidden edges with dashes.

## Fit and printing

What decides whether a part prints well and fits together.

### Clearance

Also called: gap, play, fit, press fit.

Clearance is the gap you design between two parts that fit together. A positive gap gives a clearance fit, which slides. A negative gap, where the peg is larger than the hole, gives an interference fit that has to be pressed in and holds by friction.

```python
peg_diameter = 10.0
clearance = 0.2    # gap on each side; tune it for your printer

with BuildPart() as socket:
    Box(24, 24, 12)
    Hole(radius=peg_diameter / 2 + clearance)
```

Printing: Printed holes come out slightly small. On an FDM printer start with 0.2 mm per side for a sliding fit and 0.1 mm for a snug fit, then test-print and adjust.

Not the same as Tolerance: Clearance is a gap you choose. Tolerance is how far the real size may differ from the size you asked for, because no printer is exact.

### Tolerance

Also called: accuracy, plus or minus, ±.

No machine makes a part at exactly the size in the model. Tolerance is the amount of error you accept, written with a plus-or-minus sign: 10 ± 0.2 mm means anything from 9.8 to 10.2 is fine. A home 3D printer is typically accurate to about ± 0.1 to 0.2 mm, and holes usually come out small.

```python
pin = 5.0                                   # the pin you want to fit
extras = [0.0, 0.1, 0.2, 0.3, 0.4]          # added to the hole diameter

with BuildPart() as strip:                  # a small test piece: print it once
    Box(64, 14, 4)
    for i, extra in enumerate(extras):
        with Locations((-24 + 12 * i, 0, 2)):
            Hole(radius=(pin + extra) / 2)
```

Printing: Print a small test strip before a large part. Ten minutes of printing tells you the exact hole size your printer needs.

Not the same as Clearance: Tolerance is error you cannot avoid. Clearance is a gap you add on purpose, and it must be larger than the tolerance or the parts will not fit.

### Wall thickness

Also called: wall, minimum wall, shell thickness.

Wall thickness is the distance through the solid material, from one surface to the other. A printer builds walls from side-by-side lines of plastic, each about as wide as the nozzle. A wall thinner than one line cannot be printed at all, and very thin walls are fragile.

```python
wall = 2.0      # one number for every wall and the floor

with BuildPart() as part:
    Box(40, 30, 18, align=(Align.CENTER, Align.CENTER, Align.MIN))
    offset(amount=-wall, openings=part.faces().sort_by(Axis.Z)[-1])
```

Printing: With a 0.4 mm nozzle, 0.8 mm is the practical minimum, 1.2 mm is sturdy for small parts and 2 mm suits an enclosure. A thickness between whole lines, such as 1.0 mm, can leave a gap inside the wall.

Not the same as Shell: Wall thickness is a measurement. Shell is the operation that hollows a solid and leaves walls of that thickness.

### Overhang

An overhang is a part of the model that sticks out sideways with nothing below it. Each printed layer has to rest on the layer beneath, so a steep overhang sags or fails unless the slicer adds support material under it.

Printing: The 45° rule: a slope up to about 45° from vertical prints without support. If it is flatter than that, add support, turn the part, or reshape the overhang as a chamfer.

Not the same as Bridge: An overhang is held on one side only. A bridge is held at both ends, so it can cross a short gap without support.

### Bridge

Also called: bridging.

A bridge is a flat section printed straight across an open gap with nothing under it, resting on a support at each end. The printer stretches the hot plastic across like a rope. Short bridges come out clean, and long ones sag in the middle.

Printing: Most printers bridge 20 to 30 mm cleanly, and more with good cooling. If a bridge is too long, add a pillar in the middle or replace it with two 45° slopes.

Not the same as Overhang: A bridge is held at both ends, so it can cross a gap. An overhang is held on one side only and droops much sooner.

### Layer direction

Also called: print orientation, layer lines, grain.

A printed part is a stack of thin layers. The plastic within one layer is strong, but the bond between two layers is much weaker, a bit like the grain in wood. A thin feature that stands up across the layers snaps off easily. The same feature printed lying down, with the layers running along it, is far stronger.

Printing: Decide which face goes on the bed before you design clips, hooks and thin posts, and tell your agent. Lay them along the layers, or thicken them and add a fillet at the root.

Not the same as Overhang: Overhang is about whether a shape can be printed at all. Layer direction is about how strong it is once printed.
