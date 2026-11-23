// The words on the guide pages: example prompts, setup steps and the
// reasons for build123d. The pictures and code of each example are built by
// generate/examples/*.py into data/models/ex-*.json.

/** Rules for the agent, meant to be saved as CLAUDE.md in a CAD project. */
export const RULES = `# CAD rules for this project

- Model every part in build123d (Python). Do not use CadQuery, OpenSCAD or any other CAD tool.
- After every geometric change, run the script so that show() from ocp_vscode pushes the new shape to the OCP CAD Viewer. Make one change at a time. Do not start the next change until the viewer shows this one.
- Run scripts with: uv run python <file>
- Units are millimetres. Z is up. Front is the side facing -Y, right is +X. A part sits on the XY plane with its bottom at z = 0, centred in X and Y, unless I say otherwise.
- A size I give for a hole, pin or cylinder is a diameter unless I say radius. Clearance is per side.
- Put every dimension in a named variable at the top of the script, and work out all positions from those variables.
- One part per file. A part's file shows only that part when it is run. Parts are put together in assembly.py, which imports them and never copies their geometry.
- Bought parts (screws, motors, aluminium profile) are reference models. Never change them and never export them for printing.
- If a dimension, a position or a side is missing, ask me. Do not guess silently. List every assumption you made.
- After each step, tell me the overall size, and anything you changed that I did not ask for.`;

/** The two sentences every first prompt should carry, even without CLAUDE.md. */
export const OPENING =
  'Use build123d. After every geometric change, run the script and push the result to the OCP viewer with show(), then stop so I can look.';

/** A fill-in prompt for any bought part. {Marked values} are meant to be changed. */
export const BOUGHT_TEMPLATE = `I am using a bought part: {NEMA 17 stepper motor, model 17HS4401}.
It is reference only. Never change it and never export it for printing.
Use build123d, in {motor.py}.
Shape: {the maker's STEP file is at vendor/nema17.step. Import it, do not rebuild it.}
Its origin should be {the centre of its mounting face}.
It is fixed by {four M3 screws on a 31 mm square. The threads are 4.5 mm deep.}
Keep free: {the shaft, and the cable at the back}.
First push it to the OCP viewer with show() on its own, and tell me its measured size and where its origin is. Then wait for me.`;

export const BOUGHT_FACTS = {
  caption: 'What to tell the agent about a bought part',
  columns: ['Bought part', 'Facts the agent needs from you'],
  rows: [
    ['Screws', 'Thread and length (M3 × 10), head type (socket, flat, button), and what the hole is: clearance, thread-in or insert. A flat-head screw is measured with its head, the others under the head.'],
    ['Nuts and inserts', 'Thread size. For a nut: width across the flats and thickness. For a heat-set insert: length and the hole diameter from its datasheet.'],
    ['Aluminium frame', 'Series (2020, 3030, 4040), slot opening, screw size (M5 for 2020), the length, and which face of which profile the printed part sits on.'],
    ['Stepper motor', 'Frame size (NEMA 17), body length, hole spacing, boss diameter, shaft diameter and length, thread depth in the face. A STEP file if the maker has one.'],
    ['Servo', 'Case size, tab span and thickness, height of the tabs, tab hole spacing, where the shaft is, and the circle its arm sweeps.'],
    ['DC gear motor', 'Body cross-section and length, shaft diameter, whether the shaft has a flat (D-shaft), and where the mounting holes are, if it has any.'],
    ['Solenoid or linear actuator', 'Body size, mounting holes, the stroke (how far it moves), which way it moves, and its size both pulled in and pushed out.'],
    ['Bearing', 'Bore × outside diameter × width (608 is 8 × 22 × 7), and which ring your part may touch.'],
    ['Rod, rail or shaft', 'Diameter and length, how it is held (clamp, set screw, press fit), and what slides or turns on it.'],
    ['Circuit board, display, sensor', 'Outline, thickness, mounting hole positions measured from one corner, height of the tallest component, and where each connector is and how big.'],
    ['Battery', 'Size, where the wires leave, and extra room: a lithium cell must not be squeezed.'],
    ['Plug and cable', 'Size of the plug body, not only of the socket, and the room the cable needs behind it to bend.'],
  ],
  note: 'For every bought part, also say: it is reference only, where its origin should be, and what must stay free around it.',
};

export const GROUPS = [
  { id: 'one-part', name: 'One part, step by step', blurb: 'One change per prompt. The agent pushes each change to the viewer and waits for you.' },
  { id: 'assembly', name: 'Separate parts, then an assembly', blurb: 'Each part in its own file, checked on its own, and only then put together.' },
  { id: 'bought', name: 'Around bought parts', blurb: 'Screws, aluminium frame, motors and servos: parts you buy, and design your printed parts around.' },
];

const LEGEND_BOUGHT = { steel: 'bought part (not printed)', brass: 'bought nut or insert', section: 'cut surface' };

export const EXAMPLES = [
  {
    id: 'ex-sensor-case',
    group: 'one-part',
    title: 'A case for a sensor board',
    summary: 'An open case built in five prompts: box, standoffs, USB opening, vents, chamfer.',
    intro: 'One printed part, built one feature at a time. Each prompt asks for one geometric change and says where it goes. After each one, the agent runs the script and the OCP viewer shows the new shape.',
    steps: [
      {
        title: 'Open box',
        state: 0,
        prompt: `Use build123d, in a new file sensor_case.py. After every geometric change, run the script and push the result to the OCP viewer with show(), then stop so I can look.

Start with an open box for a 52 × 28 mm circuit board:
- leave 1 mm of room around the board on every side
- walls and floor 2 mm thick, inside height 14 mm
- round the four vertical outside corners with a 3 mm radius
- the top face is open
Put every dimension in a named variable at the top of the script.`,
        reply: 'Done, and it is in the viewer. The box is 58 × 34 × 16 mm outside: 52 + 2 × 1 + 2 × 2 long. I made a solid block, rounded the four vertical edges, then hollowed it with 2 mm walls and removed the top face. Assumption: the 14 mm inside height is measured from the top of the floor.',
      },
      {
        title: 'Standoffs',
        state: 1,
        prompt: `Add four standoffs for the board. Its mounting holes are 2.5 mm in from each edge of the board. Each standoff is 6 mm in diameter and 4 mm tall, with a 2.1 mm hole, 4 mm deep, for an M2.5 screw to thread into. Push it to the viewer.`,
        reply: 'Done. The hole centres form a 47 × 23 mm rectangle, centred in the case. The standoffs stand on the floor, so their tops are 6 mm above the print bed. The posts and the holes use the same four locations, so each hole is concentric with its post.',
      },
      {
        title: 'USB opening',
        state: 2,
        prompt: `Cut an opening for the USB-C plug in the left wall, the one facing −X. Make it a slot shape, 10 mm wide and 4.5 mm tall, centred on the wall in Y. The centre of the connector is 1.6 mm above the top face of the board. The board is 1.6 mm thick and sits on the standoffs. Push it to the viewer.`,
        reply: 'Done. The centre of the opening is 9.2 mm above the bed: 2 floor + 4 standoff + 1.6 board + 1.6. It goes right through the 2 mm wall. The flat top of the opening is a 5.5 mm bridge, which prints without support.',
      },
      {
        title: 'Vent slots',
        state: 3,
        prompt: `Add ventilation to the back wall, the one facing +Y: a row of six vertical slots, each 2 mm wide and 8 mm tall, 5 mm from centre to centre. Centre the row on the wall, at half the inside height. Push it to the viewer.`,
        reply: 'Done. Six slots, 5 mm from centre to centre, so 3 mm of wall stays between two slots. The row is 27 mm wide and centred on the wall. The slot centres are 9 mm above the bed.',
      },
      {
        title: 'Chamfer and check',
        state: 4,
        prompt: `Chamfer the bottom outside edge by 0.6 mm, so the squashed first layer does not stick out. Push it to the viewer. Then check the whole part for printing with the open side up: tell me the overall size, the thinnest wall, and anything that needs support.`,
        reply: 'Done. The overall size is still 58 × 34 × 16 mm. The thinnest wall is 1.95 mm, around the hole in each standoff. Nothing needs support: the only overhangs are the tops of the openings, and the longest of them is the 5.5 mm bridge over the USB opening.',
      },
    ],
    why: [
      'One change per prompt. You see at once which step went wrong, and it is fixed before anything is built on top of it.',
      'Every side is named twice: “the left wall, the one facing −X”. A word alone can be read the wrong way round.',
      'Positions are given from something real: “in from each edge of the board”, “above the top face of the board”. The agent works out the number and shows the sum, so you can check it.',
      'The last prompt asks for a check, and the answer is numbers you can compare with your own.',
    ],
    terms: ['shell', 'fillet', 'boss-standoff', 'cutout', 'vent', 'slot', 'chamfer', 'directions', 'parameter', 'bridge'],
  },
  {
    id: 'ex-box-lid',
    group: 'assembly',
    title: 'A box and its lid',
    summary: 'Shared sizes first, then the base alone, the lid alone, and an assembly that checks they fit.',
    intro: 'Two printed parts that must fit each other. The sizes they share are agreed first. Then each part is designed and checked in its own file, and only at the end are they put together.',
    steps: [
      {
        title: 'Plan and shared sizes',
        state: null,
        prompt: `We are making a box in two printed parts, a base and a lid. Use build123d. Work like this for the whole project:
- one file per part: base.py and lid.py, each with one function that returns the part
- shared sizes live in params.py and nowhere else
- each part has its own origin: the centre of its underside
- when I run a part's file on its own, it shows only that part in the OCP viewer
- after every geometric change, run the file and push the result to the viewer with show()
- assembly.py comes last. It imports the parts and places them. It never copies geometry.

Sizes: outside 70 × 50 mm, base 24 mm tall, walls 2 mm, outside corner radius 4 mm, lid 4 mm thick. The lid is held by four M3 flat-head screws into heat-set inserts.

Do not model anything yet. Write params.py and show me the list of parameters.`,
        reply: 'Here is params.py. Besides your sizes, it holds the values both parts must agree on: a lip 1 mm thick and 2 mm tall, 0.2 mm clearance per side, the positions of the corner posts, and the hole sizes for M3 (3.4 mm clearance, 6.3 mm countersink, 4.0 × 6.7 mm insert hole). Tell me if any of these should change before I start the base.',
      },
      {
        title: 'The base, alone',
        state: 0,
        prompt: `Now base.py only. An open box from the sizes in params.py. Add a round post in each inside corner, 8 mm in diameter, centred 4.5 mm in from the outside faces and as tall as the walls, with the insert hole in its top. Add a lip around the top of the wall, on the inner half of it. Push each change to the viewer.`,
        reply: 'Done in four pushes: box, posts, lip, insert holes. The base is 70 × 50 × 26 mm with the lip, 24 mm without it. Each post merges into the corner walls, and each insert has 2 mm of plastic around it. Nothing in base.py refers to the lid.',
      },
      {
        title: 'The lid, alone',
        state: 1,
        prompt: `Now lid.py only. A flat plate with the same outline as the base. Underneath, cut a groove that the lip fits into, with the clearance from params.py on every side. Add four countersunk holes for M3 flat-head screws above the posts, with a 90° countersink. Push each change to the viewer, and show me the underside.`,
        reply: 'Done. The lid is 70 × 50 × 4 mm. The groove is 1.4 mm wide and 2.2 mm deep: the lip plus 0.2 mm on each side and above it. 1.8 mm of lid is left over the groove. The countersinks are 90°, not the 82° that build123d uses by default.',
      },
      {
        title: 'Assemble and check',
        state: 2,
        prompt: `Now assembly.py. Import both parts and put the lid on the base. Check that they do not overlap anywhere, and print the overlapping volume. Show both in the viewer as one assembly, with a name for each part. Add an explode value I can change to lift the lid.`,
        reply: 'Done. The origin of the lid is placed at z = 24, the top of the walls of the base. The overlap is 0.000 mm³, so the groove clears the lip. The check is an assert line: if a later change makes the parts collide, the script stops and says so.',
      },
      {
        title: 'Exploded view',
        state: 3,
        prompt: `Set explode to 15 and push it to the viewer.`,
        reply: 'Done. The lid is lifted 15 mm, straight up, the way it comes off.',
      },
      {
        title: 'Look inside',
        state: 4,
        prompt: `Close it again. Cut the assembly open through the middle and show me how the lip sits in its groove. Do not keep the cut in assembly.py.`,
        reply: 'Here is the cut. The lip sits in the groove with 0.2 mm on both sides and above it. The lid rests on the outer half of the wall and on the four posts. The cut was made only for this picture and is not saved.',
      },
    ],
    why: [
      'The first prompt sets the way of working and asks for no geometry. Agreeing on the shared sizes first is what makes separate parts fit.',
      '“Now base.py only” keeps the agent in one file. A part that is finished and checked is not touched again.',
      'Both parts read the same params.py, so the lip and its groove cannot drift apart. Change the clearance once and both follow.',
      'Each part has its own origin. The assembly decides where a part goes. The part file does not.',
      'The assembly prompt asks for a number, the overlapping volume. An agent can check a number without seeing the picture.',
    ],
    terms: ['assembly', 'parameter', 'origin-datum', 'lip-and-groove', 'boss-standoff', 'heat-set-insert', 'countersink', 'clearance', 'interference', 'exploded-view', 'section-view'],
  },
  {
    id: 'ex-box-hardware',
    group: 'bought',
    title: 'Screws and inserts for the lid',
    summary: 'Bought screws and brass inserts added to the box, with checks on thread length and a list of parts to buy.',
    intro: 'This continues the box and its lid. The screws and inserts are bought, so they are modelled only as simple stand-ins, to check the fit and to count what to order.',
    legend: { ...LEGEND_BOUGHT, steel: 'bought screw', brass: 'bought brass insert', mate: 'lid' },
    steps: [
      {
        title: 'Add the bought parts',
        state: 0,
        prompt: `The lid is held by bought parts: four M3 × 10 flat-head screws (ISO 10642, 90° head, 6 mm head diameter) and four M3 heat-set inserts, 5.7 mm long, in 4.0 mm holes. Add them to the assembly, in build123d.
- put them in hardware.py, as simple stand-ins without threads. They are reference parts: never printed, never changed.
- the length of a flat-head screw includes its head
- model each insert at the size of its hole, because it melts into the plastic
- place one screw and one insert at each post
Push the result to the OCP viewer with show(), exploded by 15 mm.`,
        reply: 'Done. hardware.py has flat_head_screw() and heat_set_insert(). Both are plain shapes: a cone and a cylinder for the screw, a tube for the insert. They are placed at the same four locations as the posts, so they stay concentric with the holes.',
      },
      {
        title: 'Check the fit with numbers',
        state: 1,
        prompt: `Close the assembly. Check the fit with numbers, not by eye: each screw must engage at least 4 mm of thread, must not reach the bottom of its hole, and its head must not stand proud of the lid. No screw may overlap a printed part. Make the script stop with an error if a check fails. Push it to the viewer.`,
        reply: 'All checks pass. A 10 mm screw goes through the 4 mm lid and 6.0 mm into the post. The insert is 5.7 mm long, so 5.7 mm of thread is engaged. The hole is 6.7 mm deep, which leaves 0.7 mm below the screw. The head is 6.0 mm wide in a 6.3 mm countersink, so it sits just below the surface. The checks are assert lines in assembly.py: make the lid 7 mm thick later and the script stops, because only 3 mm of thread would be left.',
      },
      {
        title: 'Look inside, and list what to buy',
        state: 2,
        prompt: `Cut it open through one screw and show me. Then print the list of parts I need to buy.`,
        reply: 'Here is the cut through the front pair of posts. Parts to buy: 4 × M3 × 10 flat-head screw (ISO 10642), and 4 × M3 heat-set insert, 5.7 mm long.',
      },
    ],
    why: [
      'A bought part is named the way a shop names it: thread, length, head type, standard. “M3 × 10 flat-head, ISO 10642” leaves nothing to guess.',
      'The prompt says the part is reference only. Without that, an agent may fix a clash by changing the screw.',
      'It gives the facts that the name does not carry: how the length is measured, and the hole size from the datasheet of the insert.',
      'The checks are asked for as numbers and as assert lines. They stay in the script and run again after every later change.',
    ],
    terms: ['bought-part', 'screw-sizes', 'countersink', 'heat-set-insert', 'concentric', 'flush-proud-recessed', 'interference', 'exploded-view'],
  },
  {
    id: 'ex-frame-bracket',
    group: 'bought',
    title: 'A bracket on aluminium frame',
    summary: 'A reference model of 2020 extrusion, then a printed bracket that keys into its slot and bolts on with T-nuts.',
    intro: 'The frame is bought aluminium extrusion. It goes into the model first, as a reference part, so the printed bracket can be designed against it and checked against it.',
    legend: { ...LEGEND_BOUGHT, steel: 'bought: frame and screws', brass: 'bought T-nut' },
    steps: [
      {
        title: 'The frame, as a reference part',
        state: 0,
        prompt: `The frame of my machine is 2020 aluminium T-slot extrusion. It is a bought part: we will not print it and must not change it. Use build123d. Make a reference model of it in frame.py:
- a 20 × 20 mm section with a slot in each of the four faces. The slot opening is 6.2 mm wide.
- it takes M5 screws and T-nuts
- I only need the outside and the slots to be right. Simplify the inside.
- a function that takes the length. The profile runs along X and lies on the XY plane.
Push a 120 mm piece to the OCP viewer with show().`,
        reply: 'Done. make_extrusion(120) is in the viewer: 20 × 20 × 120 mm, with its top face at z = 20. The slot opening is 6.2 mm. The space under the lips is simplified to a 9 × 3 mm rectangle, enough to place a T-nut. Assumptions: lips 1.8 mm thick and a 4.2 mm centre hole, which are typical for 2020. Measure your profile if those two matter.',
      },
      {
        title: 'The printed bracket',
        state: 1,
        prompt: `Now the printed part, in bracket.py: a bracket that sits on the top face of the profile and holds a sensor. Push each change to the viewer.
- a foot, 50 × 20 mm and 6 mm thick, lying on the profile
- under the foot, a key that drops into the slot so the bracket cannot turn: as long as the foot, 1.5 mm tall, and 0.2 mm narrower than the slot on each side
- two M5 clearance holes in the foot, 30 mm apart, centred on the slot
- an upright plate along the back edge (+Y), 4 mm thick and 30 mm tall
- a triangular gusset at each end, between the foot and the upright, 3 mm thick
- a slot through the upright for an M3 screw, 20 mm long, so I can move the sensor sideways
Take the slot width from frame.py. Do not type it again.`,
        reply: 'Done in six pushes. The bracket is 50 × 20 × 37.5 mm, including the 1.5 mm key. The key is 5.8 mm wide, worked out from slot_w in frame.py, so it follows if you change the profile. The gussets are 14 mm along each short side and sit outside the screw heads. Printed with the back of the upright on the bed, it needs no support.',
      },
      {
        title: 'Bolt it on and check',
        state: 2,
        prompt: `Now assembly.py. Put the bracket on a 120 mm piece of frame, in the middle. Add the bought hardware as simple stand-ins in hardware.py: two M5 × 10 socket-head screws, and two M5 T-nuts under the lips of the slot. Check with numbers that the bracket and the frame do not overlap, that each screw has at least 2 mm of thread in its nut, and that no screw reaches the bottom of the slot. Push it to the viewer.`,
        reply: 'Done. The overlap between bracket and frame is 0.000 mm³. Each screw goes 4.0 mm below the top of the profile: 1.8 mm through the lips and 2.2 mm into the T-nut. The slot is 4.8 mm deep, so 0.8 mm is spare. An M5 × 12 would hit the bottom of the slot, so stay with 10 mm for a 6 mm foot.',
      },
      {
        title: 'Look inside',
        state: 3,
        prompt: `Cut it open across the profile, through one screw, and show me the key and the T-nut.`,
        reply: 'Here is the cut at the right-hand screw. The key sits in the slot opening with 0.2 mm on each side. The T-nut is pulled up against the underside of the lips, and that is what clamps the bracket to the frame.',
      },
    ],
    why: [
      'The bought part comes first. With the frame in the model, the agent can design against it and check against it.',
      'The prompt says what must be exact (the outside and the slots) and what may be simplified. Without that, an agent can spend a long time on detail nobody needs.',
      '“Take the slot width from frame.py” ties the printed part to the bought part by a name, not by a copied number.',
      'The screw fit is asked for as numbers. The reply then tells you which screw length works, and which does not.',
    ],
    terms: ['aluminium-extrusion', 'bought-part', 'rib', 'slot', 'clearance', 'assembly', 'interference', 'screw-sizes', 'section-view'],
  },
  {
    id: 'ex-motor-bracket',
    group: 'bought',
    title: 'A bracket for a stepper motor',
    summary: 'Import the maker’s STEP file, measure it, then design the bracket and check the screws.',
    intro: 'Most motors come with a STEP file from the maker. The agent imports it, measures it, and compares it with the datasheet before a single printed feature is designed.',
    aside: 'On this page the motor is a simple model saved as a STEP file. With a real file from a maker, the prompts stay the same.',
    legend: { ...LEGEND_BOUGHT, steel: 'bought: motor and screws' },
    steps: [
      {
        title: 'Import and measure the motor',
        state: 0,
        prompt: `I bought a NEMA 17 stepper motor. The maker's STEP file is at vendor/nema17.step. Use build123d. In motor.py, import the file as a reference part. Do not change it and do not rebuild it.

Before we design anything, measure it and tell me:
- its overall size, and where its origin is
- the spacing of the four screw holes in its face
- the diameters of the centring boss and of the shaft
My datasheet says: 42.3 mm square, holes 31 mm apart, boss 22 mm, shaft 5 mm. Tell me if the file disagrees. Then push the motor to the OCP viewer with show().`,
        reply: 'The file agrees with the datasheet. Size: 42.3 × 42.3 × 64.0 mm. The origin is at the centre of the mounting face: the body goes 40 mm below it and the shaft reaches 24 mm above it, along +Z. Four M3 holes, 31.0 mm apart. Boss 22.0 mm, shaft 5.0 mm. The motor is in the viewer.',
      },
      {
        title: 'The printed bracket',
        state: 1,
        prompt: `Now the printed bracket, in motor_bracket.py. Push each change to the viewer.
- an upright plate, 52 mm wide and 5 mm thick. The motor bolts to its back, with the shaft pointing to the front (−Y).
- through the plate: four M3 clearance holes on the 31 mm square, and a 22.5 mm hole for the boss
- a foot under the motor, 46 mm deep and 5 mm thick, with two M5 clearance holes to bolt it down
- leave 7 mm between the foot and the motor, for the heads of the M5 screws
- a gusset on each side, outside the motor, 3 mm thick, from the top of the plate to the back of the foot
Work out the height of the shaft from these numbers and tell me what it is.`,
        reply: 'Done. The shaft is 33.15 mm above the underside: 5 foot + 7 gap + 21.15, which is half the motor face. The plate is 54.3 mm tall, level with the top of the motor. The bracket is 52 × 46 × 54.3 mm. There are 46 mm between the gussets, so the motor has 1.85 mm of room on each side.',
      },
      {
        title: 'Mount the motor and check',
        state: 2,
        prompt: `Now assembly.py. Place the motor on the bracket: turn it so the shaft points to −Y, and put its face against the back of the plate. Add four M3 × 8 socket-head screws from the front. The threads in the motor face are 4.5 mm deep. Check that the motor and the bracket do not overlap, and that each screw goes at least 3 mm into the motor but no deeper than the thread. Push it to the viewer.`,
        reply: 'Done. The overlap is 0.000 mm³: the 22 mm boss sits in its 22.5 mm hole. Each screw goes 3.0 mm into the motor, inside the 4.5 mm of thread. An M3 × 10 would go in 5 mm and hit the bottom of the thread, so M3 × 8 is right for a 5 mm plate. One note: bolt the bracket down before you fit the motor, because the M5 heads end up under it.',
      },
      {
        title: 'Look inside',
        state: 3,
        prompt: `Cut it open down the middle and show me the gap under the motor.`,
        reply: 'Here is the cut. The motor body ends 7 mm above the foot. An M5 socket head is 5 mm tall, so it fits with 2 mm to spare.',
      },
    ],
    why: [
      'A STEP file from the maker beats any description. Look for it first, on the website of the maker or of the shop.',
      '“Measure it and compare with the datasheet” catches a wrong file, wrong units or an origin in an odd place, before anything is designed around it.',
      'The numbers of the motor (31 mm, 22 mm) are in the prompt, so the agent does not work from memory.',
      'Facts a STEP file cannot hold, such as the depth of a thread, are given in words.',
    ],
    terms: ['motor-mount', 'step-file', 'bought-part', 'origin-datum', 'spacing-pitch', 'rotation', 'rib', 'interference'],
  },
  {
    id: 'ex-servo-holder',
    group: 'bought',
    title: 'A holder for a servo',
    summary: 'No STEP file: a stand-in from datasheet numbers, a keep-out zone for the arm, then the holder.',
    intro: 'Small actuators often come with only a drawing. A simple stand-in made from a handful of datasheet numbers is enough to design a holder, and a keep-out zone protects the space where the arm moves.',
    legend: { ...LEGEND_BOUGHT, steel: 'bought servo' },
    steps: [
      {
        title: 'A stand-in for the servo',
        state: 0,
        prompt: `I have an SG90 micro servo and no STEP file, only the datasheet. Use build123d. In servo.py, make a simple stand-in from these numbers. It is a bought part: reference only.
- case 22.8 × 12.6 mm seen from above, and 26.7 mm tall
- two mounting tabs, 32.5 mm from end to end and 2.5 mm thick. Their underside is 16 mm above the bottom of the case.
- one 2 mm hole in each tab, 27.8 mm apart
- output shaft 4.8 mm in diameter, 5.1 mm off-centre toward +X. Its top is 34.5 mm above the bottom of the case.
Put the origin at the centre of the underside of the tabs, because that is the face the servo rests on.

Also make a keep-out zone for the arm on the shaft: a 40 mm circle around the shaft, from the top of the case upward. Push both to the OCP viewer with show(), the zone see-through.`,
        reply: 'Done. The stand-in is 32.5 × 12.6 × 34.5 mm. Its origin is at the centre of the underside of the tabs, so the case hangs 16 mm below z = 0. The keep-out zone is a 40 mm cylinder around the shaft. I added a round cover under the shaft, as a guess at the gear housing. Tell me if you want it removed.',
      },
      {
        title: 'The printed holder',
        state: 1,
        prompt: `Now the printed holder, in servo_holder.py. Read the sizes of the servo from servo.py. Push each change to the viewer.
- a block with a pocket that the case drops into from above, with 0.2 mm clearance per side
- the tabs rest on the top of the block. Leave 0.5 mm spare under the case.
- side walls 3 mm, floor 2 mm
- a 1.6 mm pilot hole, 8 mm deep, under each tab hole, for the screws that come with the servo
- a window for the plug and cable through the end wall facing −X, at the bottom of the pocket: 9 mm wide and 4 mm tall
- a mounting ear at each end, 10 mm long and 3 mm thick, with an M3 slot 7 mm long`,
        reply: 'Done. The holder is 56.5 × 19 × 18.5 mm. The pocket is 23.2 × 13.0 mm and 16.5 mm deep. Between the pocket and each pilot hole, 1.5 mm of plastic is left. That is on the thin side: tell me if you want the block longer.',
      },
      {
        title: 'Put it together and check',
        state: 2,
        prompt: `Now assembly.py. Put the servo in the holder, with its tabs on the top face. Check that the servo and the holder do not overlap, and that no part of the holder is inside the keep-out zone. Push all three to the viewer.`,
        reply: 'Done. Servo and holder overlap: 0.000 mm³. Holder inside the keep-out zone: 0.000 mm³. The zone starts 10.7 mm above the top of the holder, so the arm is free to turn.',
      },
      {
        title: 'Look inside',
        state: 3,
        prompt: `Cut it open along the middle and show me how the servo sits.`,
        reply: 'Here is the cut. The servo hangs on its tabs, with 0.5 mm of air under the case. The window for the cable is at the bottom of the left end wall.',
      },
    ],
    why: [
      'With no STEP file, a stand-in from five or six datasheet numbers is enough. Give the numbers. Do not ask the agent to remember them.',
      'Each number says what it is measured from: “above the bottom of the case”, “from end to end”.',
      'The origin is put where the part touches its neighbour. Placing it in the assembly is then one line.',
      'A keep-out zone turns “leave room for the arm” into something that can be checked.',
    ],
    terms: ['bought-part', 'keep-out', 'pocket', 'clearance', 'origin-datum', 'cutout', 'slot', 'interference', 'section-view'],
  },
];

// ---- setup ------------------------------------------------------------------

export const HELLO = `from build123d import *
from ocp_vscode import show

with BuildPart() as part:
    Box(40, 30, 10)
    fillet(part.edges().filter_by(Axis.Z), radius=4)
    Hole(radius=5)

show(part)`;

export const SETUP = [
  {
    title: 'Install VS Code',
    body: [
      'VS Code is the editor everything else plugs into. Download it from code.visualstudio.com and install it with the default options.',
    ],
    links: [{ text: 'code.visualstudio.com', href: 'https://code.visualstudio.com/' }],
  },
  {
    title: 'Install uv',
    body: [
      'uv installs Python and Python packages, and keeps each project separate. You do not need to install Python yourself: uv downloads it when a project asks for it.',
      'Open a terminal (in Windows: PowerShell) and run one line:',
    ],
    commands: [
      { label: 'Windows (PowerShell)', code: 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"' },
      { label: 'macOS and Linux', code: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
    ],
    after: ['Close the terminal and open a new one. Then check that it works:'],
    commandsAfter: [{ code: 'uv --version' }],
    links: [{ text: 'uv installation guide', href: 'https://docs.astral.sh/uv/getting-started/installation/' }],
  },
  {
    title: 'Make a project with build123d',
    body: [
      'Each CAD project is a folder. These commands make one, add build123d and the Python half of the viewer to it, and open it in VS Code.',
    ],
    commands: [
      { code: 'mkdir my-cad-project\ncd my-cad-project\nuv init --python 3.12\nuv add build123d ocp-vscode\ncode .' },
    ],
    after: [
      'uv creates a folder called .venv inside the project. It holds Python and the two packages, for this project only.',
    ],
  },
  {
    title: 'Add three extensions to VS Code',
    body: [
      'In VS Code, open the Extensions view (Ctrl+Shift+X, or Cmd+Shift+X on a Mac). Search for each name and press Install.',
    ],
    list: [
      ['Python', 'from Microsoft. Lets VS Code run Python files.'],
      ['OCP CAD Viewer', 'from Bernhard Walter. The 3D viewer that shows your parts.'],
      ['Claude Code', 'from Anthropic. The AI agent, in a panel inside VS Code.'],
    ],
    after: ['Or install all three from the terminal:'],
    commandsAfter: [
      { code: 'code --install-extension ms-python.python\ncode --install-extension bernhard-42.ocp-cad-viewer\ncode --install-extension anthropic.claude-code' },
    ],
  },
  {
    title: 'Point VS Code at the project’s Python',
    body: [
      'Press Ctrl+Shift+P (Cmd+Shift+P on a Mac) to open the Command Palette. Type “Python: Select Interpreter” and choose the entry that contains .venv.',
      'This tells VS Code, and the viewer, to use the Python that has build123d in it.',
    ],
  },
  {
    title: 'Open the viewer and show a first part',
    body: [
      'Make a new file called hello.py in the project and paste this in:',
    ],
    code: HELLO,
    after: [
      'The viewer opens beside the code by itself when you open a Python file that imports ocp_vscode. If it does not, click in the Python file and press Ctrl+K then V (Cmd+K then V on a Mac), or run “OCP CAD Viewer: Open viewer” from the Command Palette.',
      'Now run the file, with the Run button at the top right of the editor or from the terminal:',
    ],
    commandsAfter: [{ code: 'uv run python hello.py' }],
    end: [
      'A rounded plate with a hole appears in the viewer. Drag to turn it. show() is what sent it there: the viewer listens on port 3939 and show() sends the shape to that port.',
    ],
  },
  {
    title: 'Sign in to Claude Code',
    body: [
      'Click the Claude icon, a small spark, in the bar on the left edge of VS Code. The first time, a sign-in screen appears: press Sign in and finish in your browser.',
      'You need a paid Claude plan (Pro, Max, Team or Enterprise) or a Claude Console account.',
      'You can also open the panel from the Command Palette with “Claude Code: Open in Side Bar”, or jump to its input box with Ctrl+Esc (Cmd+Esc on a Mac).',
    ],
    links: [{ text: 'Claude Code in VS Code', href: 'https://code.claude.com/docs/en/vs-code' }],
  },
  {
    title: 'Give the agent its standing rules',
    body: [
      'Make a file called CLAUDE.md in the project folder and paste the rules below into it. Claude Code reads this file at the start of every session, so you never have to repeat them.',
    ],
    rules: true,
    after: [
      'Other agents read a file called AGENTS.md in the same way. The same text works there.',
    ],
  },
  {
    title: 'Write your first prompt',
    body: [
      'Keep the viewer open, and arrange VS Code so you can see the chat and the viewer side by side. Then ask for one thing at a time.',
    ],
    next: true,
  },
];

export const TROUBLE = [
  ['The viewer stays empty after running a script', 'Check that the viewer is open, and that the script ends with show(...). Look at the terminal: show() prints a warning when it cannot reach the viewer.'],
  ['“No module named build123d”', 'The file was run with a different Python. Run it with uv run python yourfile.py, or select the .venv interpreter again (step 5).'],
  ['Ctrl+K V does nothing', 'The shortcut only works while the cursor is in a Python file. Click in the code first.'],
  ['The agent says it cannot see the model', 'It cannot see your screen. Ask it for numbers: overall size, hole diameters, overlap volume. It can also save a picture of the viewer with save_screenshot() from ocp_vscode and look at that.'],
  ['The agent writes code that fails with an unknown name', 'build123d is young and some names changed between versions. Tell the agent to read the error, check the function with help(), and fix it. Pin the version in the project with uv so it does not change under you.'],
];

// ---- why build123d ------------------------------------------------------------

export const WHY_POINTS = [
  {
    title: 'The model is a text file',
    text: 'A build123d part is a short Python script. An agent can read all of it, change one line, and see exactly what changed. You can read it too, compare two versions, and go back to yesterday’s. A file from a click-based CAD program is a closed box that only that program can open.',
  },
  {
    title: 'It is plain Python',
    text: 'Dimensions are variables. A part is a function. A pattern is a loop. Parts import each other. AI agents write Python very well, and they do not have to learn a special CAD language first.',
  },
  {
    title: 'The agent can measure its own work',
    text: 'After each change the agent runs the script and can ask for numbers: the overall size, a volume, how much two parts overlap. When something breaks, the error is ordinary Python text that it can read and fix. An agent that cannot see is still able to check.',
  },
  {
    title: 'You point at things with words',
    text: '“The top face” is faces().sort_by(Axis.Z)[-1]. “The vertical edges” is edges().filter_by(Axis.Z). The code picks faces and edges the way you describe them, not by a click or by a number that changes when the part changes.',
  },
  {
    title: 'The shapes are exact',
    text: 'build123d works on the same kind of geometry engine as professional CAD, so a fillet is a true curve and a hole is a true cylinder. It reads and writes STEP files, which means the maker’s model of a motor or a bearing drops straight into your design.',
  },
  {
    title: 'The viewer sits next to the code and the chat',
    text: 'One line, show(part), sends the shape to the OCP CAD Viewer inside VS Code. You can turn it, hide parts, cut it open and measure. Because it is so cheap, the agent can push every single change, and you watch the part grow.',
  },
  {
    title: 'Nothing else has to be running',
    text: 'There is no CAD program to keep open, no licence, no account, no cloud. Everything is files in a folder and one command in a terminal. That is why it works with Claude Code and with any other coding agent alike.',
  },
];

export const COMPARE = {
  caption: 'Four ways to let an AI agent make a part',
  columns: ['', 'build123d + OCP viewer', 'CadQuery', 'OpenSCAD', 'CAD program driven through MCP'],
  rows: [
    ['What the agent writes', 'Plain Python', 'Python, as long chains of method calls', 'Its own small language', 'Nothing: it sends commands to a running program'],
    ['Where the design lives', 'A text file', 'A text file', 'A text file', 'Inside the program’s own file'],
    ['Reading back the whole design', 'Read the file', 'Read the file', 'Read the file', 'Many questions to the program'],
    ['Picking a face or edge', 'By meaning, as Python lists', 'By meaning, as short code strings', 'Not possible', 'By the program’s own names or numbers'],
    ['Fillets and chamfers', 'Exact', 'Exact', 'Hard: no edges to pick', 'Exact'],
    ['STEP files of bought parts', 'Reads and writes', 'Reads and writes', 'Neither', 'Reads and writes'],
    ['Checking with numbers', 'Any Python check', 'Any Python check', 'Very limited', 'Only what the server offers'],
    ['What must be installed', 'Two Python packages and one extension', 'One Python package and a viewer', 'One program', 'The CAD program, a plug-in, and the server'],
  ],
};

export const VERSUS = [
  {
    title: 'Why not an MCP server for Fusion, FreeCAD or Blender?',
    text: [
      'An MCP server lets an agent press the buttons of a running CAD program. Each step is a separate command, and the design is kept inside that program. To know what it has built, the agent has to keep asking, and it cannot read the whole model the way it reads a file.',
      'Every command is a round trip. A part with thirty features is thirty or more calls, each one slower than running a script, and each one adding to what the agent has to keep in mind. If one step fails halfway, the model is left in a state that is hard to describe and hard to repeat.',
      'It also adds things that can break: the CAD program must be open, the plug-in must match its version, and the server must be connected. With build123d the agent needs only what every coding agent already has: it edits a file and runs a command.',
    ],
    fair: 'An MCP server is the right tool when the design already lives in such a program, or when you need something only that program has, such as simulation, toolpaths for a milling machine, or sculpted free-form shapes.',
  },
  {
    title: 'Why not CadQuery?',
    text: [
      'CadQuery and build123d stand on the same geometry engine, so their shapes are equally exact, and both work with the OCP viewer. The difference is in how the code reads.',
      'CadQuery code is one long chain of calls, and the chain carries hidden state: which face is selected now, and where the current drawing plane is. To change step four, the agent has to work out what the chain holds at step four. Faces and edges are picked with short code strings such as ">Z" and "|Z", a small language of its own.',
      'build123d uses ordinary Python objects. Each feature is one line that can be added, removed or moved. Faces and edges come back as normal lists that can be sorted, filtered and printed. Parts combine with +, − and &. Positions are written as Pos(x, y, z) * part. An agent makes fewer mistakes when nothing is hidden, and one line per change is exactly what “show me after every change” needs.',
    ],
    fair: 'CadQuery is older, so there are more examples of it for an agent to have learned from. build123d is younger and some names changed between versions, so an agent now and then writes a call that no longer exists. Because it runs the script after every change, it sees the error at once and can usually repair it in the same step.',
  },
  {
    title: 'Why not OpenSCAD?',
    text: [
      'OpenSCAD is also code, and it is fine for simple blocks and holes. But it has no faces or edges that can be picked, so “round the top edges” has no direct way to be written. It cannot read STEP files, so bought parts cannot be brought in. It has its own language, not Python, so there are no packages, and few ways to measure the result.',
    ],
  },
];

export const WHY_LIMITS = [
  'Free-form, sculpted shapes such as figures or organic handles are easier in a mesh tool like Blender.',
  'Motion studies, stress simulation and machining toolpaths need a full CAD program.',
  'You do not drag and click: every change goes through code. With an agent writing the code, that is the point, but it is a different way of working.',
];
