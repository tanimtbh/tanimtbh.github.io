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
- A distance between holes or pins is centre to centre unless the person says edge to edge.
- In a design with several parts, keep each part in its own file with its own origin, and place the parts only in the assembly file. Never union separate parts.
- A bought part (screw, motor, bearing, circuit board, aluminium profile) is reference geometry. Never change its size and never export it for printing.
- After any change to an assembly, check every pair of parts for overlap and report the result.

## build123d notes to remember

- **Sketch and profile:** Shapes inside one BuildSketch are joined into a single profile. Give a shape mode=Mode.SUBTRACT to cut it out of the profile.
- **Taper and draft:** extrude(taper=8) leans every wall inward by 8°. A negative angle leans them outward. The sketch you start from keeps its size.
- **Boolean operations:** Inside a BuildPart block the same three choices are mode=Mode.ADD, Mode.SUBTRACT and Mode.INTERSECT.
- **Shell:** build123d has no function called shell. Use offset with a negative amount, and pass the faces to remove as openings.
- **Offset:** An outward offset rounds the outside corners by default. Pass kind=Kind.INTERSECTION to keep them sharp. The same offset function hollows a solid when you give it a 3D part: see Shell.
- **Pattern:** GridLocations and PolarLocations only choose the places. Whatever you create inside the with block is made once at every place.
- **Mirror:** Plane.YZ mirrors left to right, Plane.XZ front to back and Plane.XY top to bottom. Inside BuildPart the copy is joined to what is already there.
- **Emboss and engrave:** Text() makes a flat sketch of the letters. Extrude it by a positive amount to emboss, or by a negative amount with mode=Mode.SUBTRACT to engrave. Sketch it on the face it belongs to, so it reads correctly from outside.
- **Through hole and blind hole:** Hole with no depth goes right through. Give depth= for a blind hole. The hole starts at the current location and goes down into the part.
- **Countersink:** build123d defaults to an 82° cone, which fits US inch screws. Metric countersunk screws use 90°, so set counter_sink_angle=90.
- **Slot:** SlotOverall takes the full end-to-end length. SlotCenterToCenter takes the distance between the centres of the two round ends. Say which one you mean.
- **Pocket:** Sketch on the face, then extrude by a negative amount with mode=Mode.SUBTRACT. The negative amount cuts into the part.
- **Cutout:** Plane.XZ.offset(15) is a plane 15 mm in front of the origin, on the front wall of a part that deep. In a sketch there, X is left to right and the second coordinate is the height. A negative extrude then cuts into the wall.
- **Keyhole slot:** A keyhole is a Circle and a SlotCenterToCenter in the same sketch, cut through together.
- **Vent slots:** Put SlotOverall inside GridLocations in one sketch, then cut the whole sketch through the wall with a single extrude.
- **Nut trap:** major_radius=False makes the radius reach the flat sides, so the size you give is the nut's flat-to-flat width.
- **Hinge:** Model both halves in the closed position. To show the hinge open, rotate one half about the hinge axis: move the axis to the origin, rotate, and move it back.
- **Face, edge, vertex:** sort_by orders items along a direction so you can take the first or last. group_by collects items that sit at the same position. filter_by keeps items of one kind or direction.
- **Directions and axes:** sort_by(Axis.Y)[0] is the face furthest toward −Y, the front. [-1] is the one furthest toward +Y, the back. The same works with Axis.X and Axis.Z.
- **Origin and datum:** align=(Align.MIN, Align.MIN, Align.MIN) puts the corner of a Box at the origin, so positions from a drawing can be typed in unchanged. Locations inside Locations add up, which moves a whole set of positions at once.
- **Rotation:** Rot(Z=30) turns a shape about the Z axis through the origin. To turn about another point, move that point to the origin, rotate, and move back: Pos(15, 0, 0) * Rot(Z=30) * Pos(-15, 0, 0) * shape. The moves are applied from right to left.
- **Align:** Every build123d shape is centred by default, in all three directions. That is why a Box often ends up half below the plane. Pass align=(Align.CENTER, Align.CENTER, Align.MIN) to sit it on top.
- **Concentric:** Features created at the same Locations are concentric automatically. Problems start when one of them is placed by hand with its own coordinates.
- **Tangent:** TangentArc starts in the direction of the line before it. line @ 1 is the end point of a line and line % 1 is its direction there.
- **Parallel, perpendicular, normal:** face.normal_at() gives the direction pointing out of a face. Locations(face) places things at the centre of the face, turned to match it, so a Hole made there follows the normal.
- **Diameter and radius:** Circle, Cylinder, Hole and fillet in build123d all take a radius. Keep the diameter in a named variable and divide by two where it is used.
- **Spacing and pitch:** GridLocations takes centre-to-centre spacing and centres the whole pattern on the current location.
- **Bounding box:** part.bounding_box().size gives the three overall sizes as .X, .Y and .Z. The box always follows the axes, so turning a part can change it.
- **Keep-out zone:** Model the zone as its own solid and intersect it with the part: (part & zone).volume must be 0. Show it see-through in the viewer, and never join it to the part.
- **Exploded view:** Keep the real positions in the assembly and add the extra gap only for the picture. The OCP viewer can also pull the parts of an assembly apart for you, with its Explode tool.
- **Splitting a part:** split(part, bisect_by=plane, keep=Keep.TOP) keeps the piece on the side the plane faces. Keep.BOTTOM keeps the other piece, and Keep.BOTH returns both.
- **Assembly:** Compound(label=..., children=[...]) groups placed parts without joining them. Give every part a label, and the OCP viewer lists the assembly as a tree with those names.
- **Joint (mate):** RigidJoint(label, part, Location(...)) marks a fixed point. RevoluteJoint(label, part, axis=Axis(...)) marks a turning axis. a.joints["x"].connect_to(b.joints["y"]) moves part b into place, and a revolute joint also takes angle=.
- **Interference check:** (a & b).volume is the volume two parts share: 0 means no overlap. Parts that only touch share a face but no volume, so they pass.
- **Bought part:** Keep each bought part in its own function or file and give it a label. Use import_step() when the maker offers a STEP file. Otherwise a few Box and Cylinder shapes with the right outside sizes and hole positions are enough.
- **STEP, STL and 3MF:** export_step(part, "name.step") and import_step("name.step") keep the exact shape. export_stl(part, "name.stl") makes triangles: a smaller tolerance= gives smoother curves and a larger file. For 3MF, use the Mesher class.
- **Aluminium extrusion:** The profile is one sketch extruded to the length of the bar. A simple stand-in with the 20 mm square, the four slots and the centre hole is enough to design against.
- **Shaft and hub:** A D-shaped bore is a circle with a rectangle subtracted from it in the same sketch, then cut through the hub.
- **Bearing seat:** A bearing seat is a counterbore: CounterBoreHole with the seat as the wide part and the through hole as the narrow part.

## Making solids

Ways to turn a flat sketch into a 3D shape, and to combine or copy shapes.

### Sketch and profile

Also called: sketch, profile, outline, cross-section.

A sketch is a flat drawing made on a plane, built from lines, arcs, circles and rectangles. The closed outline it forms is called the profile. Extrude, revolve, loft and sweep all turn a profile into a solid. The outline must be closed, with no gaps and no lines that cross, so that it has a clear inside.

```python
with BuildPart() as part:
    with BuildSketch() as profile:          # a sketch: flat shapes drawn on a plane
        RectangleRounded(40, 26, 5)
        Circle(6, mode=Mode.SUBTRACT)       # a hole in the profile
    extrude(amount=10)                      # the closed profile becomes a solid
```

Code note: Shapes inside one BuildSketch are joined into a single profile. Give a shape mode=Mode.SUBTRACT to cut it out of the profile.

Not the same as Plane: A plane is the invisible sheet you draw on. A sketch is the drawing itself.

Not the same as Section view: A profile is a shape you draw to build a solid. A section view is a cut through a finished solid, to look inside.

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

Printing: A tube running sideways has a small overhang at the top of its inside. Up to roughly 6 mm inside diameter this usually prints without support. Above that, see Teardrop hole.

Not the same as Extrude: Extrude pushes the profile in a straight line. Sweep can follow any path.

Not the same as Loft: Sweep moves one profile along a path. Loft blends between different profiles.

### Taper and draft

Also called: draft angle, tapered, sloped walls, cone shape.

A tapered part gets steadily narrower along its length, so its walls lean and are not parallel. The lean is given as an angle from straight: 0° is a straight wall and a few degrees is a gentle taper. A tapered pin centres itself in a tapered hole and wedges tight. In moulding the same lean is called draft, and it lets the part slide out of the mould.

```python
with BuildPart() as straight:
    with BuildSketch():
        RectangleRounded(30, 30, 4)
    extrude(amount=24)                  # walls go straight up

with BuildPart() as tapered:
    with BuildSketch():
        RectangleRounded(30, 30, 4)
    extrude(amount=24, taper=8)         # every wall leans inward by 8°
```

Code note: extrude(taper=8) leans every wall inward by 8°. A negative angle leans them outward. The sketch you start from keeps its size.

Printing: A part that narrows toward the top prints without support. One that widens toward the top is an overhang: keep the lean within 45° of vertical.

Not the same as Chamfer: A chamfer cuts off the edge only. A taper leans the whole wall.

Not the same as Loft: A taper keeps the same shape and shrinks it evenly. A loft can change into a different shape.

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

Not the same as Assembly: A union melts solids into one piece. An assembly keeps every part separate and only places it.

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

Not the same as Rotation: A mirror flips a shape into its reflection. A rotation only turns it, and can never make the mirrored shape.

## Edges and details

Small features that soften sharp edges, stiffen thin walls and add markings.

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

### Emboss and engrave

Also called: raised text, engraved text, deboss, lettering, label, logo.

Embossed text is raised above the surface, like the letters on a coin. Engraved text is cut into it, like an inscription in stone. Both start from the same flat outline of the letters, which is pushed outward or cut inward by a small depth. They are used to label ports, mark a version number, or show which way round a part goes.

```python
depth = 0.8
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as raised:
    Box(44, 20, 3, align=low)
    with BuildSketch(Plane.XY.offset(3)):               # on the top face
        Text("ON", font_size=14)
    extrude(amount=depth)                               # emboss: adds material

with BuildPart() as sunk:
    Box(44, 20, 3, align=low)
    with BuildSketch(Plane.XY.offset(3)):
        Text("ON", font_size=14)
    extrude(amount=-depth, mode=Mode.SUBTRACT)          # engrave: cuts material
```

Code note: Text() makes a flat sketch of the letters. Extrude it by a positive amount to emboss, or by a negative amount with mode=Mode.SUBTRACT to engrave. Sketch it on the face it belongs to, so it reads correctly from outside.

Printing: Keep letters at least 5 mm tall, with strokes of 0.8 mm or more, and 0.4 to 0.8 mm deep or high. On the face that touches the bed only engraved text can print, because raised text would lift the part off the bed.

Not the same as Pocket: Engraving is a very shallow pocket in the shape of letters, made to be read. A pocket is made to hold something.

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

Not the same as Bearing seat: The shape is the same. A counterbore hides a screw head. A bearing seat holds a bearing and must fit it closely.

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

Not the same as Pocket: A slot goes right through the material. A pocket, or a groove, which is a long narrow pocket, is cut only part of the way in.

### Pocket

Also called: recess, cavity, groove, pocket cut.

A pocket is an area cut down into a face to a set depth, leaving a floor. Its outline can be any closed shape: a rectangle for a battery, a circle for a magnet, a hexagon for a nut. A long, narrow pocket is called a groove. Say the outline, where it is, and how deep it goes.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)
depth = 6

with BuildPart() as part:
    Box(50, 34, 10, align=low)
    with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):     # sketch on the top face
        RectangleRounded(30, 18, 3)
    extrude(amount=-depth, mode=Mode.SUBTRACT)              # cut down, but not through
```

Code note: Sketch on the face, then extrude by a negative amount with mode=Mode.SUBTRACT. The negative amount cuts into the part.

Printing: A pocket that opens upward prints cleanly. One that opens downward has a roof that must be bridged: keep it narrow, or turn the part over.

Not the same as Through hole and blind hole: A blind hole is round and made for a screw or pin. A pocket can have any outline.

Not the same as Slot: A slot goes right through the material. A pocket stops part of the way and has a floor.

Not the same as Shell: Shell hollows the whole part and leaves thin walls. A pocket removes one chosen area.

### Cutout

Also called: opening, port, window, aperture, connector opening.

A cutout is an opening cut through a wall so that something can pass through or be reached: a USB plug, a display, a button, a cable. To place one, the agent needs four facts: which wall, the size of the opening, where its centre is, and how much room to leave around the thing that goes through it.

```python
wall = 2
port_w, port_h = 9.0, 3.3       # the USB-C socket on the board
gap = 0.5                       # room around it, on every side
port_z = 7                      # centre of the socket above the outside bottom
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    Box(40, 30, 16, align=low)
    offset(amount=-wall, openings=case.faces().sort_by(Axis.Z)[-1])   # open box
    with BuildSketch(Plane.XZ.offset(15)):          # the outside of the front wall
        with Locations((0, port_z)):
            SlotOverall(port_w + 2 * gap, port_h + 2 * gap)
    extrude(amount=-wall, mode=Mode.SUBTRACT)       # cut through that one wall
```

Code note: Plane.XZ.offset(15) is a plane 15 mm in front of the origin, on the front wall of a part that deep. In a sketch there, X is left to right and the second coordinate is the height. A negative extrude then cuts into the wall.

Printing: The flat top of an opening in a standing wall is a bridge, which is fine up to about 20 to 30 mm. Rounded ends or a 45° chamfered top print more cleanly than a wide flat top.

Not the same as Pocket: A cutout goes right through a wall. A pocket stops part of the way and has a floor.

Not the same as Slot: A slot is a long hole with round ends that lets a screw move. A cutout is shaped to fit one particular thing.

### Keyhole slot

Also called: keyhole, keyhole hanger, wall-mount slot, hanging slot.

A keyhole slot is a round hole, large enough for a screw head, joined to a narrow slot that fits only the shank of the screw. You push the part over the screw head and let it drop. The head is then behind the narrow slot and cannot pull out. It lets you hang a box on a wall and lift it off again without tools.

```python
head = 8.5        # round entry: the screw head passes through
shank = 4.5       # narrow slot: only the shank of the screw fits
travel = 8        # how far the part drops onto the screw
thick = 3

with BuildPart() as plate:
    Box(30, 36, thick, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with BuildSketch(Plane.XY.offset(thick)):
        Circle(head / 2)
        with Locations((0, travel / 2)):
            SlotCenterToCenter(travel, shank, rotation=90)
    extrude(amount=-thick, mode=Mode.SUBTRACT)
```

Code note: A keyhole is a Circle and a SlotCenterToCenter in the same sketch, cut through together.

Printing: Printed flat on the bed, a keyhole in a back plate needs no support. The rim of the narrow slot carries the whole weight, so keep the plate at least 2.5 mm thick there.

Good to know: Measure your screws first. The round entry must be a little larger than the head. The slot must be a little wider than the shank and clearly narrower than the head.

Not the same as Slot: A slot is the same width all along. A keyhole slot has one wide end for the screw head to pass through.

### Vent slots

Also called: vents, grille, louvres, air slots, ventilation holes.

Vents are a row or grid of narrow openings that let air move through a wall. They cool the electronics, and they let a temperature, humidity or gas sensor feel the air of the room. The openings are kept narrow so that fingers and tools cannot reach inside. A grille is a larger area filled with such openings. A louvre is a vent with angled slats, so that nothing can see or drip straight in.

```python
slot_w = 2.4        # narrow: keeps fingers and screwdrivers out
strip = 3.6         # solid material left between two slots
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as wall:
    Box(46, 2, 34, align=low)                         # a standing side wall
    with BuildSketch(Plane.XZ.offset(1)):             # its front face
        with Locations((0, 17)):
            with GridLocations(slot_w + strip, 0, 6, 1):
                SlotOverall(20, slot_w, rotation=90)  # tall, narrow slots
    extrude(amount=-2, mode=Mode.SUBTRACT)
```

Code note: Put SlotOverall inside GridLocations in one sketch, then cut the whole sketch through the wall with a single extrude.

Printing: In a standing wall, make the slots tall and narrow: only the small round top of each one hangs in the air. Slots that run sideways each need a bridge as long as the slot. In a flat lid, either direction prints well.

Not the same as Pattern: A pattern is the tool that repeats a feature. Vents are one thing you make with it.

Not the same as Cutout: A cutout is one opening sized for one thing. Vents are many small openings for air.

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

Good to know: M3 is the usual choice for small printed cases. M2.5 fits the mounting holes of a Raspberry Pi. M2 suits very small boards and sensors. The length of a countersunk (flat-head) screw includes its head, because the head sits inside the part.

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

### Hinge

Also called: pin hinge, barrel hinge, knuckle hinge, pivot.

A hinge lets one part swing against another about a fixed line, the hinge axis. In the usual pin hinge each part carries a row of short tubes called knuckles. The knuckles of the two parts alternate along the axis, and a pin pushed through all of them holds the parts together while letting them turn. The pin can be a piece of filament, a metal rod or a long screw.

```python
pin = 3.0           # pin diameter
knuckle = 7.0       # outside diameter of the barrel around the pin
gap = 0.3           # between knuckles, and around the pin
length = 30         # along the hinge axis (Y)
seg = (length - 4 * gap) / 5        # five knuckles with four gaps between them
low = (Align.CENTER, Align.CENTER, Align.MIN)


def leaf(side, mine):
    """side: -1 is the left leaf, +1 the right. mine: the knuckles it owns."""
    with BuildPart() as part:
        with Locations((side * 14, 0, 0)):
            Box(20, length, 3, align=low)                           # the flat leaf
        for i in mine:
            y = -length / 2 + seg / 2 + i * (seg + gap)
            with Locations((0, y, knuckle / 2)):
                Cylinder(knuckle / 2, seg, rotation=(90, 0, 0))     # one knuckle
            with Locations((side * 2.25, y, 0)):
                Box(4.5, seg, 3, align=low)                         # joins it to the leaf
        with Locations((0, 0, knuckle / 2)):                        # hole for the pin
            Cylinder(pin / 2 + gap, length, rotation=(90, 0, 0), mode=Mode.SUBTRACT)
    return part.part


left = leaf(-1, (0, 2, 4))      # the knuckles alternate
right = leaf(+1, (1, 3))
```

Code note: Model both halves in the closed position. To show the hinge open, rotate one half about the hinge axis: move the axis to the origin, rotate, and move it back.

Printing: Leave 0.3 mm between neighbouring knuckles and around the pin, or they fuse together. A hinge printed already assembled, with the pin as part of one half, is called print-in-place and needs 0.3 to 0.4 mm gaps everywhere.

Not the same as Living hinge: A living hinge has no pin. It is a thin strip of plastic that bends, printed as part of both halves. It needs a tough material such as PETG or TPU, and it wears out sooner.

Not the same as Snap fit: A hinge lets a lid swing. A snap fit holds it shut. A hinged lid usually needs both.

Not the same as Joint (mate): A hinge is the physical part. A revolute joint is how an assembly describes the same turning movement.

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

Not the same as Sketch and profile: A plane is the invisible sheet. A sketch is what you draw on it.

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

### Origin and datum

Also called: origin, datum, reference point, zero point, measured from.

The origin is the point where X, Y and Z are all zero. Every position in the model is a distance from it. A datum is the more general idea: any point, edge or face that you choose to measure from, such as the bottom-left corner of a circuit board. The same hole has different numbers depending on the datum, so always say what a position is measured from.

```python
board_w, board_h, thick = 60, 30, 1.6
# hole positions as the drawing gives them: measured from the bottom-left corner
holes = [(4, 4), (56, 4), (4, 26), (40, 20)]

with BuildPart() as board:
    # put that same corner at the origin, so the numbers can be used as they are
    Box(board_w, board_h, thick, align=(Align.MIN, Align.MIN, Align.MIN))
    with Locations((0, 0, thick)):          # on the top face
        with Locations(*holes):
            Hole(radius=1.6)
```

Code note: align=(Align.MIN, Align.MIN, Align.MIN) puts the corner of a Box at the origin, so positions from a drawing can be typed in unchanged. Locations inside Locations add up, which moves a whole set of positions at once.

Good to know: Board drawings often measure from one corner, and some count Y downward. Check which corner, and which way Y points, before you copy the numbers.

Not the same as Align: The origin is where zero is. Align decides which point of a new shape is put there.

Not the same as Directions and axes: Directions say which way is positive. The origin says where the counting starts.

### Rotation

Also called: rotate, turn, angle, tilt, orientation.

A rotation turns a shape about an axis by an angle in degrees. Three things must be said: which axis, which point the axis passes through, and which way. A positive angle about Z is counter-clockwise when you look down from above. The same rule holds for X and Y, looking from the positive end of the axis back toward the origin. Unless told otherwise, a shape turns about the origin, not about its own middle.

```python
arm = Box(30, 8, 4, align=(Align.MIN, Align.CENTER, Align.MIN))     # starts at the origin, points along +X

turned = Rot(Z=30) * arm            # +30° about the Z axis: turns around the origin
back = Rot(Z=-30) * arm             # a negative angle turns the other way

# to turn it around its own middle: move the middle to the origin, turn, move back
on_the_spot = Pos(15, 0, 0) * Rot(Z=30) * Pos(-15, 0, 0) * arm
```

Code note: Rot(Z=30) turns a shape about the Z axis through the origin. To turn about another point, move that point to the origin, rotate, and move back: Pos(15, 0, 0) * Rot(Z=30) * Pos(-15, 0, 0) * shape. The moves are applied from right to left.

Not the same as Mirror: A rotation turns a shape and keeps it the same. A mirror flips it into its reflection, which no rotation can produce.

Not the same as Align: Align chooses which point of a shape sits at a location. Rotation chooses which way the shape faces there.

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

Not the same as Origin and datum: Align decides which point of a shape is placed. The origin is where that point lands when no other location is given.

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

### Tangent

Also called: tangential, smooth transition, blends smoothly.

A line is tangent to a circle when it just touches it at one point and does not cross it. Two curves are tangent where they meet and carry on in the same direction, so the join is smooth and has no corner. A fillet is tangent to both faces it connects, which is why it feels smooth. Asking for tangent joins is how you get an outline that flows, and does not look like separate pieces stuck together.

```python
with BuildLine() as smooth:
    start = Line((0, 0), (30, 0))
    bend = TangentArc(start @ 1, (45, 15), tangent=start % 1)   # leaves the line in the same direction
    Line(bend @ 1, (45, 35))

with BuildLine() as kinked:
    Line((0, 0), (30, 0))
    ThreePointArc((30, 0), (36.5, 8.5), (45, 15))               # an arc, but not a tangent one
    Line((45, 15), (45, 35))
```

Code note: TangentArc starts in the direction of the line before it. line @ 1 is the end point of a line and line % 1 is its direction there.

Printing: A smooth, tangent outline also prints better: the nozzle does not have to stop and turn sharply, which leaves a mark at every corner.

Not the same as Concentric: Tangent circles touch at exactly one point. Concentric circles share a centre and never touch.

Not the same as Fillet: Tangent describes how two curves meet. A fillet is a feature that makes such a smooth meeting along an edge.

### Parallel, perpendicular, normal

Also called: square to, at right angles, 90 degrees, normal direction, face normal.

Two lines or faces are parallel when they point the same way and stay the same distance apart. They are perpendicular when they meet at 90°. The normal of a face is the direction pointing straight out of it, perpendicular to the surface. On a sloped face, a hole made along the normal goes in square to the slope, which is not the same as straight down.

```python
with BuildPart() as part:
    with BuildSketch(Plane.XZ):                     # side view: a block with a sloped top
        Polygon((0, 0), (40, 0), (40, 10), (0, 26), align=None)
    extrude(amount=12, both=True)

    slope = part.faces().sort_by(Axis.Z)[-1]        # the sloped face
    normal = slope.normal_at()                      # the direction pointing straight out of it

    with Locations(slope):                          # a location on the face, facing along its normal
        Hole(radius=3, depth=8)                     # so the hole goes in at 90° to the slope
```

Code note: face.normal_at() gives the direction pointing out of a face. Locations(face) places things at the centre of the face, turned to match it, so a Hole made there follows the normal.

Printing: A hole along the normal of a sloped face is tilted in the printer too, so the upper side of its inside is an overhang. Up to about 45° of tilt this prints without support.

Not the same as Tangent: Perpendicular lines cross at 90°. A tangent line only touches a curve and runs along it.

Not the same as Plane: A plane is a flat surface. Its normal is the one direction that points straight out of it.

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

### Spacing and pitch

Also called: centre to centre, center to center, pitch, hole spacing, c-c.

Spacing is the distance between two features. For holes and pins it is almost always measured from the centre of one to the centre of the next, because that number stays the same whatever size the holes are. Measured edge to edge, the same two holes give a smaller number. Pitch is the spacing of a row of identical things, such as the 2.54 mm between the pins of a header.

```python
spacing_x, spacing_y = 58, 23       # centre to centre, as board drawings give it

with BuildPart() as plate:
    Box(66, 31, 2)
    with GridLocations(spacing_x, spacing_y, 2, 2):     # the spacing is between centres
        Hole(radius=1.4)

pitch = 2.54                        # the spacing of a row of equal things: header pins
with BuildPart() as header:
    Box(8 * pitch, pitch, 2.5)
    with GridLocations(pitch, 0, 8, 1):
        Box(0.64, 0.64, 8.5)
```

Code note: GridLocations takes centre-to-centre spacing and centres the whole pattern on the current location.

Good to know: 2.54 mm is one tenth of an inch, the standard pitch of breadboards and most header pins. A row of 8 pins measures 7 × 2.54 = 17.78 mm from the first pin centre to the last.

Not the same as Pattern: A pattern is the operation that repeats a feature. Spacing is the number you give it.

Not the same as Clearance: Spacing is the distance between two features of one part. Clearance is the gap between two different parts.

### Bounding box

Also called: overall size, overall dimensions, envelope, extents, outer size.

The bounding box of a part is the smallest box, lined up with the X, Y and Z axes, that contains all of it. Its three sides are the overall length, width and height of the part. It is the quick way to check that a part came out the size you expected, that it fits on the printer, and that it fits in the space you have for it.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as part:
    Box(50, 30, 4, align=low)
    with Locations((-23, 0, 4)):
        Box(4, 30, 26, align=low)
    with Locations((8, 0, 4)):
        Cylinder(radius=9, height=10, align=low)

size = part.part.bounding_box().size
print(f"{size.X:.0f} × {size.Y:.0f} × {size.Z:.0f} mm")         # 50 × 30 × 30 mm

bed_x, bed_y, bed_z = 220, 220, 250                             # the build volume of your printer
fits = size.X <= bed_x and size.Y <= bed_y and size.Z <= bed_z
```

Code note: part.bounding_box().size gives the three overall sizes as .X, .Y and .Z. The box always follows the axes, so turning a part can change it.

Printing: Compare the bounding box with the build volume of your printer before anything else, and leave a few millimetres spare at the edges of the bed.

Not the same as Keep-out zone: A bounding box measures the space a part takes up. A keep-out zone is space you reserve, which parts must stay out of.

### Keep-out zone

Also called: keep-out, clearance zone, reserved space, no-go zone.

A keep-out zone is a volume you reserve, which no part of the design may enter. Typical ones are the space for a battery, the room a plug and its cable need outside a connector, the area around an antenna, and the path of a screwdriver to a screw. Give the zone as a box with a size and a position, and the agent can test it. A request to leave some room cannot be tested.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    Box(46, 34, 14, align=low)
    offset(amount=-2, openings=case.faces().sort_by(Axis.Z)[-1])
    with Locations((17, 11, 2)):
        Cylinder(radius=3, height=8, align=low)             # a screw boss

# keep-out zone: the space the battery needs, with 1 mm to spare all round
battery_zone = Pos(-4, 0, 2) * Box(32, 22, 9, align=low)

overlap = case.part & battery_zone
print(overlap.volume)                                       # 0: nothing is in the zone
```

Code note: Model the zone as its own solid and intersect it with the part: (part & zone).volume must be 0. Show it see-through in the viewer, and never join it to the part.

Good to know: Tall components on a board need a zone too. Say the height of the tallest one, so the lid and any ribs stay clear of it.

Not the same as Clearance: Clearance is a small gap between two parts that fit together. A keep-out zone is a whole volume left empty for something else.

Not the same as Interference check: A keep-out zone is the rule. An interference check is how you test that the rule is kept.

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

### Exploded view

Also called: exploded drawing, explode, assembly drawing.

An exploded view shows the parts of an assembly moved apart from each other, each along the direction in which it is put on. The parts stay lined up, so you can see what goes where and in what order. Nothing in the design changes: it is only a way of looking at it.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as base:
    Box(44, 32, 14, align=low)
    offset(amount=-2, openings=base.faces().sort_by(Axis.Z)[-1])
    with Locations((0, 0, 2)), GridLocations(34, 22, 2, 2):
        Cylinder(radius=3, height=12, align=low)            # corner posts
    with Locations((0, 0, 14)), GridLocations(34, 22, 2, 2):
        Hole(radius=1.25, depth=8)

with BuildPart() as lid:
    Box(44, 32, 2, align=low)
    with Locations((0, 0, 2)), GridLocations(34, 22, 2, 2):
        Hole(radius=1.7)

gap = 14                                        # how far to pull the parts apart
lid_placed = Pos(0, 0, 14) * lid.part           # where the lid really sits
lid_exploded = Pos(0, 0, 14 + gap) * lid.part   # moved along Z, the way it goes on
```

Code note: Keep the real positions in the assembly and add the extra gap only for the picture. The OCP viewer can also pull the parts of an assembly apart for you, with its Explode tool.

Not the same as Section view: A section view cuts parts open to show the inside. An exploded view moves whole parts apart and cuts nothing.

Not the same as Assembly: The assembly is the parts in their real positions. An exploded view is a picture of it with the parts moved apart.

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

Not the same as Interference check: An interference fit is a squeeze you design on purpose. An interference check looks for overlaps you did not intend.

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

### Splitting a part

Also called: split, cut in two, parting line, divide into pieces.

Splitting means cutting a finished part into two or more pieces along a plane. You do it when the part is too large for the printer, or when one piece would print much better in a different orientation. The pieces are joined again with glue or screws, and small pins or keys across the cut make them line up exactly.

```python
with BuildPart() as rail:
    Box(90, 16, 10)
    with GridLocations(30, 0, 3, 1):
        Hole(radius=2.2)

cut = Plane.YZ                          # the cutting plane: across the middle, facing +X
right = split(rail.part, bisect_by=cut, keep=Keep.TOP)       # the side the plane faces
left = split(rail.part, bisect_by=cut, keep=Keep.BOTTOM)     # the other side

# two 3 mm pins line the halves up again: each hole goes 5 mm into both halves
pin_holes = [Pos(0, y, 0) * Cylinder(1.6, 10, rotation=(0, 90, 0)) for y in (-5, 5)]
left -= pin_holes
right -= pin_holes
```

Code note: split(part, bisect_by=plane, keep=Keep.TOP) keeps the piece on the side the plane faces. Keep.BOTTOM keeps the other piece, and Keep.BOTH returns both.

Printing: Glue alone on a flat cut is weak. Add pins, a lap joint or screws across the split, and put it where the part carries the least load.

Not the same as Section view: A section view only looks at a cut. Splitting really divides the part into pieces.

Not the same as Lap joint: Splitting divides the part. A lap joint is one good way to put the pieces back together.

## Assemblies and bought parts

Putting several parts together, and designing around parts you buy: screws, motors, bearings and aluminium frame.

### Assembly

Also called: assembly model, sub-assembly, multi-part design.

An assembly is a set of separate parts shown together, in the positions they have in the finished product. Each part stays its own solid. It is modelled on its own, and printed or bought on its own. The assembly only records which parts there are and where each one sits. A group of parts inside a larger assembly is called a sub-assembly.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

# each part is modelled on its own, around its own origin
with BuildPart() as base_builder:
    Box(44, 32, 12, align=low)
    offset(amount=-2, openings=base_builder.faces().sort_by(Axis.Z)[-1])
    with Locations((0, 0, 2)), GridLocations(30, 18, 2, 2):
        Cylinder(radius=2.5, height=3, align=low)           # posts for the board

base = base_builder.part
board = Box(36, 24, 1.6, align=low)
lid = Box(44, 32, 2, align=low)
base.label, board.label, lid.label = "base", "board", "lid"

# the assembly only says where each part goes
node = Compound(label="sensor node", children=[
    base,
    Pos(0, 0, 5) * board,           # on the posts, 3 mm above the floor
    Pos(0, 0, 12) * lid,            # on top of the walls
])

for part in node.children:
    print(part.label, part.location.position)
```

Code note: Compound(label=..., children=[...]) groups placed parts without joining them. Give every part a label, and the OCP viewer lists the assembly as a tree with those names.

Good to know: Seeing everything together is how you find the mistakes that no single part shows: a lid that does not reach, a screw that hits a wall, a plug that cannot go in.

Not the same as Boolean operations: A union melts solids into one piece. An assembly keeps every part separate and only places it.

Not the same as Exploded view: The assembly has the parts in their real positions. An exploded view is a picture of it with the parts moved apart.

### Joint (mate)

Also called: mate, constraint, connection point, rigid joint, revolute joint.

A joint is a named point on a part, with a direction, where another part connects. Connecting a joint on one part to a joint on another moves the second part into place, so nobody has to work out its coordinates. The kind of joint says what movement is left: a rigid joint allows none, a revolute joint allows turning about one axis like a hinge, and a linear joint allows sliding along one line. Other CAD programs call the same idea a mate.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

base = Box(40, 30, 6, align=low) + Pos(-10, 0, 6) * Cylinder(3, 5, align=low)     # a plate with a pin
arm = Pos(13, 0, 0) * Box(36, 10, 4, align=low) - Cylinder(3.2, 4, align=low)     # a bar with a hole at its origin

# a joint is a named point on a part: where it connects, and how it may move
RevoluteJoint("pin", base, axis=Axis((-10, 0, 6), (0, 0, 1)))      # may turn about the pin
RigidJoint("hole", arm, Location((0, 0, 0)))                       # the underside of the hole

# connecting the two joints moves the arm into place: no coordinates to work out
base.joints["pin"].connect_to(arm.joints["hole"], angle=0)
```

Code note: RigidJoint(label, part, Location(...)) marks a fixed point. RevoluteJoint(label, part, axis=Axis(...)) marks a turning axis. a.joints["x"].connect_to(b.joints["y"]) moves part b into place, and a revolute joint also takes angle=.

Good to know: Joints only place parts. They do not stop parts from overlapping, so run an interference check after connecting them.

Not the same as Hinge: A hinge is a physical part with knuckles and a pin. A revolute joint only describes the turning movement in the model.

Not the same as Align: Align places a new shape at a point. A joint places a whole part against another part, and can do it again at any angle.

### Interference check

Also called: collision check, clash, overlap check, clash detection.

Two real parts cannot be in the same place, but two modelled parts can overlap with no warning at all. An interference check finds those overlaps. It intersects each pair of parts and measures the volume they share: zero means they are clear, and anything more is a clash that must be fixed. Run it every time parts are moved or changed.

```python
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as case:
    Box(44, 32, 12, align=low)
    offset(amount=-2, openings=case.faces().sort_by(Axis.Z)[-1])

board = Pos(3, 0, 4) * Box(38, 24, 1.6, align=low)      # placed 3 mm too far to the right

overlap = case.part & board                             # the volume both parts claim
print(f"{overlap.volume:.1f} mm³")                      # 76.8 mm³: the board is inside the wall

moved = Pos(0, 0, 4) * Box(38, 24, 1.6, align=low)
print(f"{(case.part & moved).volume:.1f} mm³")          # 0.0 mm³: the parts are clear
```

Code note: (a & b).volume is the volume two parts share: 0 means no overlap. Parts that only touch share a face but no volume, so they pass.

Good to know: Passing the check does not mean the parts fit in real life. They also need clearance, because no printer is exact.

Not the same as Clearance: An interference fit is an overlap you design on purpose, for a press fit. An interference check looks for overlaps you did not intend.

Not the same as Boolean operations: The check uses the intersect operation, but only to measure. It does not change the parts.

### Bought part

Also called: off-the-shelf part, COTS, purchased part, vitamin, reference part, stand-in.

A bought part is anything in the design that you do not make: screws, nuts, motors, bearings, batteries, circuit boards, aluminium profile. It goes into the model as reference geometry, so that the printed parts can be shaped around it and checked against it. Its size is fixed by its maker, so it is never changed and never printed. People who 3D print often call these parts vitamins.

```python
# the bought part: an 18650 battery cell, with the largest sizes its datasheet allows.
# It is modelled only to check the fit. It is never changed and never printed.
cell_d, cell_len = 18.4, 65.2
gap = 0.4                               # room around the cell
floor = 2
axis_z = floor + gap + cell_d / 2       # height of the middle of the cell

cell = Pos(0, 0, axis_z) * Cylinder(cell_d / 2, cell_len, rotation=(0, 90, 0))
cell.label = "18650 cell (bought)"

# the printed part is designed around it
with BuildPart() as cradle:
    Box(cell_len + 8, cell_d + 6, axis_z, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with Locations((0, 0, axis_z)):
        Cylinder(cell_d / 2 + gap, cell_len + 2 * gap, rotation=(0, 90, 0), mode=Mode.SUBTRACT)
cradle.part.label = "cradle (printed)"
```

Code note: Keep each bought part in its own function or file and give it a label. Use import_step() when the maker offers a STEP file. Otherwise a few Box and Cylinder shapes with the right outside sizes and hole positions are enough.

Good to know: Use the largest size the datasheet allows, not the typical one, and measure the part you actually have. Cheap parts often differ from their drawing.

Not the same as Keep-out zone: A bought part is a real object with a fixed shape. A keep-out zone is empty space you reserve, often around a bought part.

Not the same as STEP, STL and 3MF: A STEP file is how the exact shape of a bought part usually reaches you. The bought part is the object itself.

### STEP, STL and 3MF

Also called: STEP file, STL file, 3MF file, export, import, file formats.

A STEP file (.step or .stp) stores the exact shape of a part: true flat faces, cylinders and curves. Any CAD program can open it and keep working on it, so it is the format for sharing designs, and for the models that makers publish of their motors, bearings and connectors. An STL file stores only a skin of small flat triangles, which is all a slicer needs for printing. 3MF is a newer format for the slicer that also stores the units, colours and several parts in one file.

```python
with BuildPart() as knob:
    Cylinder(radius=14, height=12, align=(Align.CENTER, Align.CENTER, Align.MIN))
    fillet(knob.edges().sort_by(Axis.Z)[-1], radius=5)

export_step(knob.part, "knob.step")     # the exact shape: for other CAD programs, and to share
export_stl(knob.part, "knob.stl")       # triangles only: for the slicer

loaded = import_step("knob.step")       # read one back: also how you load a motor from its maker
```

Code note: export_step(part, "name.step") and import_step("name.step") keep the exact shape. export_stl(part, "name.stl") makes triangles: a smaller tolerance= gives smoother curves and a larger file. For 3MF, use the Mesher class.

Printing: The slicer needs STL or 3MF. Keep the Python script as the real source of the design, and use STEP for sharing. An STL cannot be turned back into a clean model that you can edit.

Not the same as Bought part: A STEP file is a file. A bought part is the real object, whose shape often comes to you as a STEP file.

Not the same as G-code: STL and 3MF describe a shape. G-code is the list of movements that the slicer writes from that shape, for one particular printer.

### Aluminium extrusion

Also called: aluminum extrusion, 2020 profile, T-slot, V-slot, aluminium frame, aluminium profile.

Aluminium extrusion is a bar with the same cross-section along its whole length, bought by the metre and cut to length. The common 2020 profile is 20 × 20 mm, with a T-shaped slot running down each of its four sides. A T-nut slides into a slot and turns it into a threaded hole anywhere along the bar, so printed parts can be bolted on and moved later. Bars are joined to each other with corner brackets.

```python
slot = 6.0              # width of the slot opening of a 2020 profile
screw = 5.5             # clearance hole for an M5 screw
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as bracket:
    Box(20, 30, 4, align=low)                       # lies flat on one face of the profile
    # a key that drops into the slot, so the part cannot turn
    Box(slot - 0.3, 30, 1.2, align=(Align.CENTER, Align.CENTER, Align.MAX))
    with Locations((0, 0, 4)):
        Hole(radius=screw / 2)                      # for an M5 screw into a T-nut in the slot
```

Code note: The profile is one sketch extruded to the length of the bar. A simple stand-in with the 20 mm square, the four slots and the centre hole is enough to design against.

Printing: Print a bracket so that the layers run along its arms, not across the bend. M5 screws pull hard: make the plastic under the head at least 4 mm thick, or add a washer.

Good to know: On a 2020 profile the slot opening is about 6 mm wide and about 6 mm deep, and the usual screw is M5. V-slot is the same idea with slanted slot edges for wheels to run on. Larger profiles such as 3030 and 4040 have wider slots and take larger screws: check the seller's drawing.

Not the same as Extrude: Extrude is the CAD operation. An extrusion is a real metal bar, made in a factory by pushing aluminium through a shaped opening: the same idea in real life.

Not the same as Nut trap: A nut trap is a pocket you print for an ordinary nut. A T-nut slides in the slot of the metal bar.

### Motor mount

Also called: NEMA 17 mount, stepper mount, motor bracket, motor plate, servo mount.

A motor mount is the part a motor is screwed to. Its holes must match the pattern on the face of the motor exactly, so the numbers come from the motor's drawing. A stepper motor is named by the size of its square face: a NEMA 17 has a 42.3 mm face, four M3 threaded holes on a 31 mm square, and a raised ring around the shaft called the boss or pilot. A hole for that ring in the mount centres the motor.

```python
face = 42.3             # NEMA 17: width of the square motor face
hole_spacing = 31.0     # between the four M3 screw holes, centre to centre
boss = 22.0             # the raised ring around the shaft
plate = 4

with BuildPart() as mount:
    Box(face + 8, face + 8, plate, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with Locations((0, 0, plate)):
        Hole(radius=boss / 2 + 0.25)                # 22.5 mm: the boss fits in and centres the motor
        with GridLocations(hole_spacing, hole_spacing, 2, 2):
            Hole(radius=3.4 / 2)                    # clearance holes for M3 screws
```

Stepper motor faces, in mm:

| Motor | Face | Hole spacing | Screws | Boss | Shaft |
|---|---|---|---|---|---|
| NEMA 14 | 35.2 | 26 | M3 | 22 | 5 |
| NEMA 17 | 42.3 | 31 | M3 | 22 | 5 |
| NEMA 23 | 56.4 | 47.1 | M4 or M5 | 38.1 | 6.35 or 8 |

Hole spacing is centre to centre, along the sides of a square. NEMA 14 and 17 have threaded holes in the motor. NEMA 23 has plain holes through its flange, so the screws need nuts or a thread in your part. Make the hole for the boss about 0.5 mm larger than the boss. The length of the body and of the shaft differ from model to model: take them from the datasheet.

Printing: A working motor gets warm, often 50 to 70 °C, and PLA softens at about 60 °C. Print motor mounts in PETG, ABS or ASA.

Not the same as Boss and standoff: On a motor, the boss is the raised ring around the shaft that centres it. On a printed part, a boss is a raised post around a screw hole.

Not the same as Shaft and hub: The mount holds the body of the motor still. The hub is the part that goes on the turning shaft.

### Shaft and hub

Also called: D-shaft, axle, bore, set screw, grub screw, coupling.

A shaft is the rod that a motor turns. The hub is the centre of whatever goes on the shaft: a wheel, gear, pulley or knob. The hole through the hub is called the bore. A round shaft in a round bore just slips, so something must lock the two together. Many small shafts have one flat side, which makes a D shape, and a D-shaped bore cannot turn on it. A set screw through the side of the hub, pressing on the flat, stops the hub from sliding off.

```python
shaft = 5.0         # shaft diameter
across = 4.5        # measured across the flat of the D
gap = 0.1           # per side: the hub slides on, but does not wobble
low = (Align.CENTER, Align.CENTER, Align.MIN)

with BuildPart() as hub:
    Cylinder(radius=9, height=10, align=low)
    with BuildSketch():                                     # the D-shaped hole
        Circle(shaft / 2 + gap)
        with Locations((0, across - shaft / 2 + gap)):      # everything beyond the flat
            Rectangle(shaft + 2, shaft, align=(Align.CENTER, Align.MIN), mode=Mode.SUBTRACT)
    extrude(amount=10, mode=Mode.SUBTRACT)
    with Locations((0, 5.5, 5)):                            # set screw hole, aimed at the flat
        Cylinder(radius=1.25, height=7, rotation=(90, 0, 0), mode=Mode.SUBTRACT)
```

Code note: A D-shaped bore is a circle with a rectangle subtracted from it in the same sketch, then cut through the hub.

Printing: Print the hub with the bore pointing up, so the bore is round and the layers are rings around the shaft. Start with 0.1 mm of clearance per side and test: a bore that is too tight splits the hub, and one that is too loose wobbles.

Not the same as Bearing seat: A hub is fixed to the shaft and turns with it. A bearing lets the shaft turn inside a part that stays still.

### Bearing seat

Also called: bearing pocket, bearing housing, bearing bore, 608 bearing.

A ball bearing has an outer ring, an inner ring and balls between them, so the two rings turn against each other with almost no friction. A bearing seat is the round pocket in your part that holds the outer ring. It is as deep as the bearing is wide and very slightly tight, so the bearing presses in and stays. At the bottom is a ledge called a shoulder, which only the outer ring rests on. The inner ring and the shaft must touch nothing, so that they can turn.

```python
bore, outside, width = 8, 22, 7     # a 608 bearing: bore × outside diameter × width
fit = 0.1                           # added to the diameter: tune it with a test print
shoulder = 3                        # width of the ledge the outer ring rests on

with BuildPart() as housing:
    Cylinder(radius=16, height=11, align=(Align.CENTER, Align.CENTER, Align.MIN))
    with Locations((0, 0, 11)):
        CounterBoreHole(
            radius=outside / 2 - shoulder,              # through hole: clears the inner ring
            counter_bore_radius=(outside + fit) / 2,    # the seat the bearing presses into
            counter_bore_depth=width,
        )
```

Code note: A bearing seat is a counterbore: CounterBoreHole with the seat as the wide part and the through hole as the narrow part.

Common small ball bearings, in mm:

| Bearing | Bore | Outside diameter | Width |
|---|---|---|---|
| 623 | 3 | 10 | 4 |
| MR105 | 5 | 10 | 4 |
| 625 | 5 | 16 | 5 |
| 608 | 8 | 22 | 7 |
| 6001 | 12 | 28 | 8 |

The bore is the hole for the shaft. Make the seat as wide as the outside diameter plus a small allowance for your printer, usually 0 to 0.2 mm: test it. The 608 is the bearing in skateboard wheels, and the cheapest to buy.

Printing: Print the seat with its opening facing up, so it comes out round. Printed holes come out small, so a seat modelled at exactly the size of the bearing is often a press fit already. Test with a thin ring before you print the whole part.

Not the same as Counterbore: The shape is the same. A counterbore hides a screw head. A bearing seat holds a bearing and must fit it closely.

Not the same as Shaft and hub: A bearing lets a shaft turn freely. A hub is locked to the shaft and turns with it.
