// The groups of terms, in reading order, and the rules for the agent.
// The terms themselves are in terms/*.mjs, one file per group.

export const CATEGORIES = [
  { id: 'board', name: 'The board', icon: 'board', blurb: 'What a bare board is made of: its outline, layers, coatings and holes.' },
  { id: 'pads', name: 'Pads and footprints', icon: 'pad', blurb: 'Where parts are soldered on, and the pattern of copper each part needs.' },
  { id: 'nets', name: 'Nets and connections', icon: 'net', blurb: 'What is connected to what, before any copper is drawn.' },
  { id: 'routing', name: 'Routing', icon: 'route', blurb: 'Drawing the copper that makes the connections: traces, vias and the rules they follow.' },
  { id: 'power', name: 'Copper pours and power', icon: 'pour', blurb: 'Large copper areas, ground, and getting clean power to every chip.' },
  { id: 'placement', name: 'Placement', icon: 'place', blurb: 'Where parts go on the board, and how to say it.' },
  { id: 'checks', name: 'Rules and checks', icon: 'shield', blurb: 'What a factory can make, and the mistakes a check should catch.' },
  { id: 'making', name: 'Making the board', icon: 'factory', blurb: 'Files, soldering and assembly: turning the design into a real board.' },
];

/** Standing rules, printed at the top of pcb-terms.md. */
export const AGENT_RULES = [
  'All dimensions are in millimetres. In tscircuit a bare number is millimetres too: pcbX={5} means 5 mm.',
  'The origin (0, 0) is the centre of the board. Seen from the top side, +X is right and +Y is up. Left, right, top edge and bottom edge always mean the board seen from its top side.',
  'A rotation is in degrees, counter-clockwise, seen from the top side.',
  'A part is on the top side unless the person says bottom. The bottom side is seen mirrored left to right.',
  'Trace width, clearance and annular ring are measured edge to edge. Pitch and the distance between holes or parts are measured centre to centre.',
  'A hole size is the finished diameter. A via written as 0.6 / 0.3 mm means 0.6 mm of copper around a 0.3 mm hole.',
  'Give every part a reference designator (R1, C1, U1, J1) and every important net a name (GND, V3_3, SDA). Refer to a pin as U1.VCC, by its label, not by a guessed number.',
  'Never guess a pinout or a footprint. If the part number or its datasheet is missing, ask for it.',
  'Place first, then route. Do not start routing until the person has agreed to the placement.',
  'After every change, build the circuit and report every error and warning it prints, such as unrouted traces, overlaps and clearance problems. Never hide or silence one.',
  'If a size, a position, a side or a net is not stated, ask. Do not guess silently, and list any assumption you make.',
  'Use the rules of the factory that will make the board. If none are given, stay at or above 0.2 mm trace width, 0.2 mm clearance, and 0.6 / 0.3 mm vias.',
];
