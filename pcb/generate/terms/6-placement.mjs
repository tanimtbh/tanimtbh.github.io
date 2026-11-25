// Placement: where parts go on the board, and how to say it.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/** A dashed box on the board that marks a zone or a group. */
function zone(p, x, y, w, h) {
  p.rect(x, y, w, h, 'f-glow s-white dash', { r: 2, sw: 0.4 });
}

/**
 * A small six-pin part turned by `deg` degrees, counter-clockwise as seen on the screen.
 * At 0° pin 1 is at the top left, as tscircuit places it.
 */
function turned(p, cx, cy, deg) {
  const t = (deg * Math.PI) / 180;
  const at = (x, y) => [cx + x * Math.cos(t) + y * Math.sin(t), cy - x * Math.sin(t) + y * Math.cos(t)];
  const box = (x, y, w, h) => [at(x - w / 2, y - h / 2), at(x + w / 2, y - h / 2), at(x + w / 2, y + h / 2), at(x - w / 2, y + h / 2)];
  for (const side of [-1, 1]) for (const y of [-5, 0, 5]) p.area(box(side * 8.2, y, 5, 2.6), 'pad');
  p.area(box(0, 0, 12, 16), 'body');
  const [dx, dy] = at(-3.4, -5.4);
  p.circle(dx, dy, 1.1, 'mark');
  return at(-8.2, -5); // the centre of pad 1
}

/** A curved arrow around (cx, cy), from the right, counter-clockwise by `deg` degrees. */
function turnArrow(p, cx, cy, r, deg) {
  const t = (deg * Math.PI) / 180;
  const end = [cx + r * Math.cos(t), cy - r * Math.sin(t)];
  p.path(`M${cx + r} ${cy}A${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${end[0].toFixed(2)} ${end[1].toFixed(2)}`, 'f-none s-white', [cx - r, cy - r, cx + r, cy + r]);
  // the head points along the circle, the way the part turns
  const [ux, uy] = [-Math.sin(t), -Math.cos(t)];
  const tip = [end[0] + ux * 2.4, end[1] + uy * 2.4];
  p.area([tip, [end[0] - uy * 1.5, end[1] + ux * 1.5], [end[0] + uy * 1.5, end[1] - ux * 1.5]], 'f-white');
}

export default [
  {
    id: 'placement',
    name: 'Placement',
    category: 'placement',
    aka: ['component placement', 'floor plan', 'layout', 'positioning'],
    keywords: 'where position place parts arrange zones floorplan pcbX pcbY before routing',
    summary: 'Deciding where each part goes on the board, before any trace is drawn.',
    definition: 'Placement is deciding where each part sits on the board. It comes before routing, and it decides how well routing will go. Start with the parts whose place is fixed: connectors on the edge, mounting holes, buttons, anything that must line up with a case. Then put the main chip in the middle and the parts that serve it close around it. Arrange the rest in zones that follow the signal: where it comes in, where it is processed, where it goes out.',
    say: [
      { for: 'Fixed parts first', text: 'Place {the USB connector} on the {left} edge, centred, with its opening facing out. Do not move it after that.' },
      { for: 'Give a position', text: 'Place {U1} at x = {0}, y = {2 mm}, measured from the centre of the board.' },
      { for: 'By its neighbours', text: 'Place {C1} within {2 mm} of {pin 8 of U1}, and {R3} right next to {LED1}.' },
      { for: 'Stop and look', text: 'Place all the parts but do not route yet. Show me the board and wait for my answer.' },
    ],
    code: `export default () => (
  <board width="30mm" height="20mm">
    <pinheader name="J1" pinCount={4} pitch="2.54mm" pcbX={-12} pcbY={0} pcbRotation={90} />
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={0} pcbY={5} />
    <led name="LED1" color="green" footprint="0603" pcbX={10} pcbY={4} />
    <resistor name="R1" resistance="330" footprint="0603" pcbX={10} pcbY={-4} />
  </board>
)`,
    codeNote: 'pcbX and pcbY give the centre of a part in millimetres, measured from the centre of the board. +X is right and +Y is up. A part with no pcbX and pcbY is placed for you: tscircuit puts it next to the pin it is connected to.',
    note: 'A good placement shows in the ratsnest: the lines are short and few of them cross. If routing fails, move parts before you change any rule.',
    confusedWith: [
      { id: 'autorouter', diff: 'Placement puts the parts down. The autorouter then draws the traces between them. A bad placement cannot be fixed by routing.' },
      { id: 'origin-coordinates', diff: 'Placement is the decision. Coordinates are the numbers you use to write it down.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          zone(p, 24, 16, 30, 28);
          zone(p, 60, 20, 46, 46);
          zone(p, 24, 62, 40, 28);
          p.rect(3, 42, 17, 20, 'f-lead s-soft', { r: 1 });
          p.rect(31, 24, 9, 12, 'body', { r: 0.6 });
          p.chip(47, 30, { kind: 'c', rot: 90, len: 9, wid: 4.4 });
          p.quad(83, 43);
          p.soic(44, 76, { pins: 6, pitch: 5, bodyW: 9, padW: 5 });
          p.arrow([21, 44], [27, 38], 'arw-on');
          p.arrow([54, 32], [63, 37], 'arw-on');
          p.arrow([66, 62], [58, 70], 'arw-on');
          p.leader(40, 7, 40, 16, 'power, next to the connector', { anchor: 'middle' });
          p.leader(LX, 40, 106, 40, 'main chip, in');
          p.label(LX, 45.5, 'the middle');
          p.leader(24, 104, 9, 62.6, 'connector on the edge', { anchor: 'middle' });
          p.leader(92, 104, 64, 86, 'sensor, away from heat', { anchor: 'middle' });
          p.caption('Place in zones that follow the signal');
        },
      },
    ],
  },

  {
    id: 'rotation',
    name: 'Rotation',
    category: 'placement',
    aka: ['orientation', 'angle', 'pcbRotation'],
    keywords: 'rotate turn angle degrees 90 180 270 orientation counter clockwise pin 1 direction',
    summary: 'The angle a part is turned by, counter-clockwise, seen from the top.',
    definition: 'Rotation is the angle by which a part is turned on the board. It is given in degrees and counted counter-clockwise, seen from the top side. At 0° the part sits the way its footprint was drawn: for most chips that puts pin 1 at the top left. Rotation is used to point a connector outward, to bring a pin closer to what it connects to, and to make polarised parts all face the same way.',
    say: [
      { for: 'By angle', text: 'Rotate {U1} by {90°} counter-clockwise.' },
      { for: 'By where pin 1 goes', text: 'Turn {U1} so that pin 1 is at the {bottom left}.' },
      { for: 'By what it faces', text: 'Turn {J1} so its opening faces the {left} edge of the board.' },
      { for: 'Keep them alike', text: 'Give all {the LEDs} the same rotation, with the cathode toward the {top} of the board.' },
    ],
    table: {
      caption: 'Where pin 1 goes',
      columns: ['pcbRotation', 'Pin 1 of a chip'],
      rows: [
        ['0', 'Top left'],
        ['90', 'Bottom left'],
        ['180', 'Bottom right'],
        ['270', 'Top right'],
      ],
      note: 'For a part whose footprint has pin 1 at the top left, such as soic8. Seen from the top side.',
    },
    code: `export default () => (
  <board width="40mm" height="14mm">
    <chip name="U1" footprint="soic8" pcbX={-14} pcbY={0} />
    <chip name="U2" footprint="soic8" pcbX={-4} pcbY={0} pcbRotation={90} />
    <chip name="U3" footprint="soic8" pcbX={6} pcbY={0} pcbRotation={180} />
    <chip name="U4" footprint="soic8" pcbX={15} pcbY={0} pcbRotation={270} />
  </board>
)`,
    codeNote: 'pcbRotation is in degrees and turns the part counter-clockwise. A two-pin part such as a resistor lies flat at 0, with pin 1 on the left. On a <group>, pcbRotation turns all the parts of the group together, around the centre of the group.',
    fabTip: 'The assembly machine has its own idea of 0° for each kind of part, and it does not always agree with the footprint. That is why a factory shows you a picture of the placed parts before it builds. Check the polarised parts in it: diodes, LEDs, chips and electrolytic capacitors.',
    confusedWith: [
      { id: 'top-bottom-side', diff: 'Rotation turns a part while it stays on the same side. Moving a part to the bottom side flips it over.' },
      { id: 'pin-1', diff: 'Pin 1 is a mark on the part. Rotation decides which corner of the board that mark points to.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(8, 14, 144, 62);
          const angles = [0, 90, 180, 270];
          const places = ['top left', 'bottom left', 'bottom right', 'top right'];
          let first = null;
          angles.forEach((deg, i) => {
            const x = 28 + i * 35;
            const pin1 = turned(p, x, 45, deg);
            if (i === 0) first = pin1;
            if (deg) turnArrow(p, x, 45, 15, deg);
            p.label(x, 85, `${deg}°`, { anchor: 'middle', size: 5 });
            p.label(x, 91, `pin 1: ${places[i]}`, { anchor: 'middle', size: 3.5 });
          });
          p.leader(20, 9, first[0], first[1] - 0.6, 'pin 1', { anchor: 'middle' });
          p.caption('Rotation is counted counter-clockwise');
        },
      },
    ],
  },

  {
    id: 'group',
    name: 'Group and subcircuit',
    category: 'placement',
    aka: ['module', 'block', 'sub-circuit', 'reusable block'],
    keywords: 'group together block module reuse move as one subcircuit function component copy',
    summary: 'Parts that belong together and are placed and moved as one block.',
    definition: 'A group is a set of parts that belong together, such as a regulator with its capacitors, or a sensor with its pull-up resistors. Inside the group, each part has a position measured from the centre of the group. Move the group, and all its parts move with it. A subcircuit is a group that keeps its part names to itself: the same block can be used several times on one board without the names clashing.',
    say: [
      { for: 'Make a block', text: 'Put {U2, C3, C4 and L1} in one group called {power}. Place them compactly, then place the group at the {top left} of the board.' },
      { for: 'Move it', text: 'Move the whole {power} group {5 mm} to the right. Do not change anything inside it.' },
      { for: 'Reuse it', text: 'Make the {LED driver} a subcircuit in its own file, and use it {4} times in a row, {8 mm} apart.' },
    ],
    code: `export default () => (
  <board width="30mm" height="16mm">
    <group name="FILTER" pcbX={-8} pcbY={2}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={2} />
      <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={0} pcbY={-2} />
      <trace from="R1.pin2" to="C1.pin2" />
    </group>
    <group name="DIVIDER" pcbX={8} pcbY={-2}>
      <resistor name="R2" resistance="10k" footprint="0603" pcbX={0} pcbY={2} />
      <resistor name="R3" resistance="10k" footprint="0603" pcbX={0} pcbY={-2} />
      <trace from="R2.pin2" to="R3.pin2" />
    </group>
  </board>
)`,
    codeNote: 'Inside a <group>, pcbX and pcbY are measured from the centre of the group, not from the centre of the board. Here R1 is at 0, 2 in a group at −8, 2, so it lands at −8, 4 on the board. In a <subcircuit> the names are local: two copies can each have their own R1.',
    note: 'In tscircuit a subcircuit is usually a small function in its own file. That file is the natural unit to ask an agent for: one block, built and checked on its own, then placed on the board.',
    confusedWith: [
      { id: 'auto-layout', diff: 'A group says which parts belong together. Automatic layout is one way to arrange the parts inside it.' },
      { id: 'footprint', diff: 'A footprint is the copper pattern of one part. A group is several parts placed together.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          for (const x of [34, 82]) {
            zone(p, x - 18, 24, 36, 58);
            p.trace([[x + 3.74, 38], [x + 10, 38], [x + 10, 54], [x + 3.74, 54]], { w: 1.4 });
            p.trace([[x - 3.74, 54], [x - 10, 54], [x - 10, 70], [x - 3.74, 70]], { w: 1.4 });
            p.chip(x, 38);
            p.chip(x, 54, { kind: 'c' });
            p.chip(x, 70, { kind: 'led' });
          }
          p.silkText(18, 21.5, 'A', { size: 3.8, anchor: 'start' });
          p.silkText(66, 21.5, 'B', { size: 3.8, anchor: 'start' });
          p.leader(LX, 28, 100, 30, 'group: parts that');
          p.label(LX, 33.5, 'belong together');
          p.leader(LX, 52, 92, 54, 'the same block,');
          p.label(LX, 57.5, 'used a second time');
          p.label(LX, 78, 'move a group and');
          p.label(LX, 83.5, 'its parts move too');
          p.caption('Parts placed and moved as one block');
        },
      },
    ],
  },

  {
    id: 'auto-layout',
    name: 'Automatic layout',
    category: 'placement',
    aka: ['auto-placement', 'pack', 'flex', 'grid', 'pcbPack', 'pcbFlex', 'pcbGrid'],
    keywords: 'automatic arrange row column grid rows columns gap pack flex spacing evenly placement without coordinates',
    summary: 'Letting tscircuit arrange parts: packed by their connections, in a line, or in a grid.',
    definition: 'Automatic layout arranges parts for you, so you do not have to give every position. There are three ways. Pack puts each part next to the pin it is connected to. Flex puts parts in one row or one column with an equal gap. Grid puts them in rows and columns. They are good for a first placement and for regular patterns such as a row of LEDs. For the few parts whose place really matters, give the position yourself.',
    say: [
      { for: 'A first placement', text: 'Do not give positions yet. Let the parts pack around {U1}, and show me the result.' },
      { for: 'A row', text: 'Place {R1 to R8} in one row, {1.5 mm} apart, along the {bottom} edge.' },
      { for: 'A grid', text: 'Arrange the {12 LEDs} in a grid of {4} columns and {3} rows, {5 mm} from centre to centre.' },
      { for: 'Then fix it', text: 'Keep the positions the automatic layout chose, and write them into the code as pcbX and pcbY.' },
    ],
    table: {
      caption: 'Three ways to arrange a group',
      columns: ['Prop on the group', 'What it does', 'Its gap'],
      rows: [
        ['pcbPack', 'Each part goes next to the pin it connects to', 'pcbPackGap'],
        ['pcbFlex', 'One row or one column: pcbFlexDirection="row" or "column"', 'pcbGap'],
        ['pcbGrid', 'Rows and columns: pcbGridCols={3}', 'pcbGridGap, or pcbGridRowGap and pcbGridColumnGap'],
      ],
      note: 'A gap is the free space between two parts, not the distance between their centres.',
    },
    code: `export default () => (
  <board width="40mm" height="20mm">
    <group name="LEDS" pcbX={-10} pcbY={0} pcbGrid pcbGridCols={3} pcbGridGap="2mm">
      <led name="LED1" color="red" footprint="0603" />
      <led name="LED2" color="red" footprint="0603" />
      <led name="LED3" color="red" footprint="0603" />
      <led name="LED4" color="red" footprint="0603" />
      <led name="LED5" color="red" footprint="0603" />
      <led name="LED6" color="red" footprint="0603" />
    </group>
    <group name="RES" pcbX={10} pcbY={0} pcbFlex pcbFlexDirection="column" pcbGap="1.5mm">
      <resistor name="R1" resistance="330" footprint="0603" />
      <resistor name="R2" resistance="330" footprint="0603" />
      <resistor name="R3" resistance="330" footprint="0603" />
    </group>
  </board>
)`,
    codeNote: 'The layout props go on a <group>, and the group itself is placed with pcbX and pcbY. A grid fills row by row, starting at the top left. Packing is also what happens to any part that has no position: it is put beside the pin it connects to. Parts with no connections are packed in a column, which can run off a small board, so read the errors after building.',
    confusedWith: [
      { id: 'placement', diff: 'Placement is the decision of where parts go. Automatic layout is a tool that makes part of that decision for you.' },
      { id: 'autorouter', diff: 'Automatic layout arranges the parts. The autorouter draws the traces.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(8, 10, 144, 72);
          p.line([[56, 15], [56, 77]], 's-white dash faint');
          p.line([[104, 15], [104, 77]], 's-white dash faint');
          // pack: parts sit next to the pins they connect to
          const small = { len: 8.5, wid: 4.2 };
          p.trace([[17.4, 38.5], [23.4, 38.5]], { w: 1.1 });
          p.trace([[40.6, 38.5], [46.6, 38.5]], { w: 1.1 });
          p.trace([[40.6, 53.5], [46.6, 53.5]], { w: 1.1 });
          p.soic(32, 46, { bodyW: 11, padW: 5 });
          p.chip(14.6, 38.5, small);
          p.chip(49.4, 38.5, small);
          p.chip(49.4, 53.5, { ...small, kind: 'c' });
          // flex: one row, equal gaps
          for (const x of [65, 75, 85, 95]) p.chip(x, 46, { ...small, rot: 90 });
          for (const x of [65, 75, 85]) p.dim([x + 2.6, 56], [x + 7.4, 56], '');
          // grid: rows and columns
          for (const y of [38, 54]) for (const x of [115, 128, 141]) p.chip(x, y, { ...small, kind: 'led' });
          [[32, 'pcbPack', 'each part beside its pin'], [80, 'pcbFlex', 'one row, equal gaps'], [128, 'pcbGrid', 'rows and columns']].forEach(([x, name, what]) => {
            p.label(x, 91, name, { anchor: 'middle' });
            p.label(x, 96.5, what, { anchor: 'middle', size: 3.5 });
          });
          p.caption('Three ways to let tscircuit arrange parts');
        },
      },
    ],
  },

  {
    id: 'keepout',
    name: 'Keep-out',
    category: 'placement',
    aka: ['keepout zone', 'keep-out area', 'exclusion zone', 'antenna keep-out'],
    keywords: 'no copper no parts forbidden area antenna zone exclude free clear restricted',
    summary: 'An area of the board that must stay free of copper, of parts, or of both.',
    definition: 'A keep-out is an area you close off. Nothing may be routed through it, nothing may be placed in it, and copper pours stay out of it. The most common one is under an antenna: copper near an antenna spoils its range, so the datasheet of every radio module shows an area to keep clear, on every layer. Keep-outs are also used under a part that must not touch copper, around a mounting screw, and next to high voltage.',
    say: [
      { for: 'Under an antenna', text: 'Add a keep-out under the antenna of {U1}: {18 × 6 mm}, on all layers. No copper, no traces and no parts.' },
      { for: 'Around a screw', text: 'Keep a circle of {3.5 mm} radius around each mounting hole free of parts and traces.' },
      { for: 'Only for parts', text: 'Keep the area under {the display} free of parts taller than {2 mm}. Traces are allowed there.' },
      { for: 'Check it', text: 'List everything that touches a keep-out.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm">
    <keepout shape="rect" pcbX={0} pcbY={5} width="12mm" height="4mm" />
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-9} pcbY={5} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={9} pcbY={5} />
    <trace from="R1.pin2" to="R2.pin1" />
    <trace from="R1.pin1" to="net.GND" />
    <copperpour layer="top" connectsTo="net.GND" />
  </board>
)`,
    codeNote: 'A <keepout> is a rect with width and height, or a circle with radius. The trace goes around it, the pour leaves a hole for it, and a part placed inside it is an error. It applies to the top layer only unless you add layers={["top", "bottom"]}: with the top layer alone, the autorouter is free to pass underneath on the bottom. allowTraces and allowPlacements each let one kind of thing back in.',
    fabTip: 'Take the size of an antenna keep-out from the datasheet of the module, not from a guess. Many modules are meant to hang over the edge of the board, so that the antenna has no board under it at all.',
    confusedWith: [
      { id: 'clearance', diff: 'Clearance is a small gap that every piece of copper keeps from its neighbours. A keep-out is one named area that you draw yourself.' },
      { id: 'courtyard', diff: 'A courtyard is the space one part needs for itself. A keep-out is an area that belongs to no part and stays empty.' },
      { id: 'cutout', diff: 'A keep-out leaves the board in place and keeps things off it. A cutout removes the board material.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[32, 44], [22, 44], [16, 50], [16, 84]], { w: 1.4 });
          p.trace([[32, 54], [26, 54], [22, 58], [22, 84]], { w: 1.4 });
          p.trace([[88, 49], [98, 49], [104, 55], [104, 84]], { w: 1.4 });
          p.rect(34, 12, 52, 58, 'f-body s-body', { r: 1, sw: 0.3 });
          p.line([[40, 26], [40, 16], [46, 16], [46, 25], [52, 25], [52, 16], [58, 16], [58, 25], [64, 25], [64, 16], [70, 16], [70, 25], [80, 25]], 'cu', { w: 1.3 });
          for (let y = 34; y <= 66; y += 5) p.pad(34, y, 4.4, 2.6, { r: 0.5 }).pad(86, y, 4.4, 2.6, { r: 0.5 });
          p.rect(39, 31, 42, 35, 'f-lead s-soft', { r: 1.2 });
          p.rect(24, 10.8, 72, 18.4, 'f-zone s-hi dash', { r: 1 });
          p.leader(LX, 18, 96, 20, 'keep-out: no copper');
          p.label(LX, 23.5, 'and no parts here');
          p.leader(LX, 40, 80.6, 25, 'antenna');
          p.leader(LX, 58, 81, 50, 'radio module');
          p.caption('A keep-out under an antenna');
        },
      },
    ],
  },
];
