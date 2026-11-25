// Pads and footprints: where parts are soldered on.

import { arc } from '../pic.mjs';

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/** The dashed box of a courtyard. */
const courtyard = (p, x, y, w, h) => p.rect(x, y, w, h, 'f-none s-white dash', { sw: 0.3 });

/** A two-pad footprint and an eight-pin footprint, bare or with their parts on. */
function twoFootprints(p, withParts) {
  p.board(...B);
  courtyard(p, 19.5, 44.5, 13, 17);
  p.silk([[21.6, 51.4], [21.6, 54.6]]).silk([[30.4, 51.4], [30.4, 54.6]]);
  p.chip(26, 53, { rot: 90, body: withParts });
  courtyard(p, 59, 39, 30, 28);
  p.silk([[68.8, 43], [79.2, 43], [79.2, 63], [68.8, 63]], { close: true });
  p.circle(63.9, 41.4, 0.9, 'f-silk');
  p.soic(74, 53, { body: withParts });
  p.silkText(26, 41.5, 'R1', { size: 3.6 });
  p.silkText(74, 35, 'U1', { size: 3.6 });
}

/** A small three-leg package (SOT-23), seen from above. */
function sot23(p, x, y) {
  for (const [dx, dy] of [[-6.2, -3.6], [-6.2, 3.6], [6.2, 0]]) {
    p.pad(x + dx, y + dy, 4.4, 2.2, { r: 0.4 });
    p.rect(dx < 0 ? x + dx : x + 3.5, y + dy - 0.65, 2.7, 1.3, 'lead');
  }
  p.rect(x - 4, y - 6, 8, 12, 'body', { r: 0.8 });
  p.circle(x - 2.2, y - 4.2, 0.7, 'mark');
}

/** A chip with solder balls underneath (BGA). The balls are drawn as if the chip were glass. */
function bga(p, x, y, size = 15) {
  p.rect(x - size / 2, y - size / 2, size, size, 'body', { r: 0.8 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) p.circle(x - 4.8 + i * 3.2, y - 4.8 + j * 3.2, 1, 'f-solder');
  p.circle(x - size / 2 + 1.2, y - size / 2 + 1.2, 0.5, 'mark');
}

export default [
  {
    id: 'footprint',
    name: 'Footprint',
    category: 'pads',
    aka: ['land pattern', 'pad layout', 'package outline'],
    keywords: 'pads pattern shape part library datasheet recommended layout decal',
    summary: 'The pattern of pads and markings that one part needs on the board.',
    definition: 'A footprint is everything a part needs on the board: one pad for each of its pins, in exactly the right places, plus an outline and a pin 1 mark printed in silkscreen. The part must match its footprint, or it cannot be soldered. Every part has a footprint, and many parts share one: all 0603 resistors use the same two pads. The datasheet of a part shows its recommended footprint.',
    say: [
      { for: 'Name it', text: 'Use the {SOIC-8} footprint for {U1} and {0603} for every resistor and capacitor.' },
      { for: 'From the datasheet', text: 'There is no standard footprint for {SW1}. Draw it from the datasheet: {two pads, 1.6 × 1.0 mm, 4 mm apart, centre to centre}.' },
      { for: 'Check it', text: 'Compare the footprint of {U2} with its datasheet: number of pads, pitch, pad size and the distance between the two rows. Tell me every difference.' },
      { for: 'Do not guess', text: 'If you do not know the package of {the regulator}, ask me for the part number. Do not pick a footprint that only looks similar.' },
    ],
    code: `export default () => (
  <board width="20mm" height="12mm">
    <resistor name="R1" resistance="10k" footprint="0402" pcbX={-6} pcbY={0} />
    <chip
      name="U1"
      pcbX={4}
      pcbY={0}
      footprint={
        <footprint>
          <smtpad portHints={["pin1"]} shape="rect" width="1.2mm" height="0.8mm" pcbX={-1.5} pcbY={0} />
          <smtpad portHints={["pin2"]} shape="rect" width="1.2mm" height="0.8mm" pcbX={1.5} pcbY={0} />
          <silkscreenpath route={[{ x: -2.4, y: 0.8 }, { x: 2.4, y: 0.8 }]} />
        </footprint>
      }
    />
    <trace from="R1.pin2" to="U1.pin1" />
  </board>
)`,
    codeNote: 'A standard footprint is one short string: "0402", "soic8", "qfn32", "sot23". Options follow the name after an underscore, such as "tssop16_p0.65mm" for the pitch. A string that tscircuit does not know is reported as an error that starts with "Invalid footprint prop". For a part with no standard footprint, give a <footprint> with one <smtpad> or <platedhole> for each pin. portHints says which pin a pad belongs to, and positions are measured from the centre of the part.',
    fabTip: 'A footprint that is slightly wrong is the most common reason a new board cannot be assembled. Print the board on paper at full size and lay the real parts on it before you order.',
    confusedWith: [
      { id: 'pad', diff: 'A pad is one piece of bare copper. A footprint is the whole set of pads for one part, with its outline.' },
      { id: 'ic-packages', diff: 'The package is the body of the part itself. The footprint is the copper pattern on the board that the package sits on.' },
      { id: 'courtyard', diff: 'The footprint is where the part is soldered. The courtyard is the extra room around it that other parts must stay out of.' },
    ],
    pictures: [
      {
        label: 'Bare footprint',
        draw(p) {
          twoFootprints(p, false);
          p.leader(LX, 22, 64.8, 41, 'pin 1 mark');
          p.leader(LX, 38, 86, 45.5, 'pad');
          p.leader(LX, 54, 79.5, 55, 'silkscreen outline');
          p.leader(LX, 70, 89, 66, 'courtyard');
          p.caption('What the board carries for each part');
        },
      },
      {
        label: 'With the parts',
        draw(p) {
          twoFootprints(p, true);
          p.leader(LX, 30, 85.5, 50.5, 'a leg on its pad');
          p.leader(LX, 50, 77, 56, 'body of the chip');
          p.leader(LX, 70, 89, 66, 'room around it');
          p.caption('Each part covers its own footprint');
        },
      },
    ],
  },

  {
    id: 'pad',
    name: 'Pad',
    category: 'pads',
    aka: ['SMD pad', 'SMT pad', 'land', 'surface-mount pad'],
    keywords: 'copper solder bare exposed surface mount smd smt pin connect',
    summary: 'A piece of bare copper that one pin of a part is soldered to.',
    definition: 'A pad is a small area of copper with no solder mask on it, so that solder can stick. One pin of a part is soldered to one pad. A pad for a surface-mount part lies on one side of the board and has no hole. Traces connect to pads, and the solder joint on a pad both holds the part and carries the current.',
    say: [
      { for: 'Give the size', text: 'Make the pads of {SW1} {1.6 mm} wide and {1.0 mm} tall, {4 mm} apart, centre to centre.' },
      { for: 'Easier to solder', text: 'I will solder this board by hand. Make the pads of {the 0603 parts} a little longer than the standard ones.' },
      { for: 'Enter it properly', text: 'Bring each trace into the middle of its pad, not across a corner.' },
    ],
    code: `export default () => (
  <board width="12mm" height="8mm">
    <chip
      name="SW1"
      footprint={
        <footprint>
          <smtpad portHints={["pin1"]} shape="rect" width="1.6mm" height="1mm" pcbX={-2} pcbY={0} />
          <smtpad portHints={["pin2"]} shape="rect" width="1.6mm" height="1mm" pcbX={2} pcbY={0} />
        </footprint>
      }
    />
  </board>
)`,
    render: false,
    codeNote: 'You rarely write <smtpad> yourself: a footprint string such as "0603" makes the pads. When you do, width is the size along X and height the size along Y, before the part is rotated. tscircuit adds the opening in the solder mask and the solder paste for each pad by itself.',
    fabTip: 'Two pads of one small part should have the same size and the same amount of copper joined to them. If one heats up faster than the other in the oven, the part can lift on one end.',
    confusedWith: [
      { id: 'through-hole', diff: 'A pad lies on the surface and has no hole. A plated through hole goes through the board and takes a leg.' },
      { id: 'footprint', diff: 'A pad is for one pin. A footprint is all the pads of one part.' },
      { id: 'test-point', diff: 'A pad holds a part. A test point is a pad that holds nothing: it is there to be touched with a probe.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[14, 53], [38, 53]], { w: 3 });
          p.trace([[82, 53], [106, 53]], { w: 3 });
          p.rect(29, 37, 20, 32, 'f-shade', { r: 1 }).rect(71, 37, 20, 32, 'f-shade', { r: 1 });
          p.pad(39, 53, 16, 28).pad(81, 53, 16, 28);
          p.rect(43, 41, 34, 24, 'f-none s-white dash', { sw: 0.35 });
          p.leader(LX, 24, 90.2, 39, 'opening in the mask');
          p.leader(LX, 42, 86, 50, 'pad: bare copper');
          p.leader(LX, 60, 102, 53.5, 'trace, under mask');
          p.leader(LX, 78, 60, 65, 'the part sits here');
          p.caption('Two pads for one small part');
        },
      },
      {
        label: 'Cut through',
        draw(p) {
          p.rect(16, 70, 128, 22, 'f-fr4 s-soft');
          p.rect(16, 66, 20, 4, 'f-cu').rect(124, 66, 20, 4, 'f-cu');
          p.rect(36, 66, 28, 4, 'f-pad').rect(96, 66, 28, 4, 'f-pad');
          p.rect(16, 62, 17, 4, 'f-mask').rect(127, 62, 17, 4, 'f-mask').rect(66, 66, 28, 4, 'f-mask');
          p.area([[38, 66], [52, 66], [52, 53]], 'f-solder').area([[122, 66], [108, 66], [108, 53]], 'f-solder');
          p.rect(50, 64, 12, 2, 'f-solder').rect(98, 64, 12, 2, 'f-solder');
          p.rect(52, 50, 56, 14, 'f-body s-soft', { sw: 0.3 });
          p.rect(52, 50, 9, 14, 'f-lead').rect(99, 50, 9, 14, 'f-lead');
          p.leader(80, 34, 80, 50.5, 'part', { anchor: 'middle' });
          p.leader(36, 40, 46, 61, 'solder joint', { anchor: 'end' });
          p.leader(128, 40, 117, 67.5, 'pad');
          p.leader(22, 104, 24.5, 64, 'solder mask', { anchor: 'middle' });
          p.leader(136, 104, 135.5, 68, 'trace', { anchor: 'middle' });
          p.label(80, 83.5, 'board', { anchor: 'middle', cls: 'lbl-dark' });
          p.caption('A part soldered to its pads. Not to scale');
        },
      },
    ],
  },

  {
    id: 'through-hole',
    name: 'Plated through hole',
    category: 'pads',
    aka: ['PTH', 'through-hole pad', 'THT', 'plated hole'],
    keywords: 'leg lead pin hole drill barrel header connector strong dip wave solder',
    summary: 'A hole with copper on its wall, for the leg of a part.',
    definition: 'A plated through hole is a drilled hole with copper plated on its wall and a ring of copper around it on both sides. The leg of a part goes through the hole and is soldered in. This joint is much stronger than a surface-mount joint, so it is used for parts that are pushed and pulled: connectors, pin headers, switches and large capacitors. It takes space on every layer of the board, and it is slower to assemble.',
    say: [
      { for: 'Give the sizes', text: 'The legs of {J1} are {0.64 mm} square. Use plated holes of {1.0 mm} with {1.8 mm} of copper around them.' },
      { for: 'Choose the kind', text: 'Use a through-hole part for {the power connector}, so it does not tear off the board. Everything else is surface mount.' },
      { for: 'Mark pin 1', text: 'Give pin 1 of {every header} a square pad, and the other pins round ones.' },
    ],
    code: `export default () => (
  <board width="16mm" height="10mm">
    <chip
      name="J1"
      footprint={
        <footprint>
          <platedhole portHints={["pin1"]} shape="circle" holeDiameter="1mm" outerDiameter="1.8mm" pcbX={-2.54} pcbY={0} />
          <platedhole portHints={["pin2"]} shape="circle" holeDiameter="1mm" outerDiameter="1.8mm" pcbX={0} pcbY={0} />
          <platedhole portHints={["pin3"]} shape="circle" holeDiameter="1mm" outerDiameter="1.8mm" pcbX={2.54} pcbY={0} />
        </footprint>
      }
    />
  </board>
)`,
    codeNote: 'A <platedhole> needs holeDiameter and outerDiameter, the hole and the copper around it. Through-hole parts make their own holes: <pinheader>, or a footprint string such as "dip8". A <hole> is different: it has no copper and connects to nothing.',
    fabTip: 'Make the hole 0.2 to 0.3 mm wider than the leg, or the leg will not go in. A square leg is measured across its corners. Holes are drilled before they are plated, so the size you give is the finished one.',
    confusedWith: [
      { id: 'via', diff: 'A through hole holds the leg of a part. A via is smaller, holds nothing, and only joins layers.' },
      { id: 'pad', diff: 'A through hole goes through the board and is seen on both sides. A surface-mount pad lies on one side only.' },
      { id: 'mounting-hole', diff: 'A plated through hole is part of the circuit. A mounting hole is for a screw and usually has no copper.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          p.rect(16, 50, 128, 26, 'f-fr4 s-soft');
          p.rect(62, 46, 36, 4, 'f-pad').rect(62, 76, 36, 4, 'f-pad').rect(72, 46, 16, 34, 'f-pad');
          p.rect(74, 46, 12, 34, 'f-solder');
          p.area([[64, 80], [96, 80], [82.5, 92], [77.5, 92]], 'f-solder');
          p.area([[68, 46], [92, 46], [82.5, 40], [77.5, 40]], 'f-solder');
          p.rect(77.5, 30, 5, 64, 'f-lead s-soft', { sw: 0.25 });
          p.rect(40, 16, 80, 14, 'f-body s-soft', { sw: 0.3 });
          p.leader(128, 36, 116, 26, 'part');
          p.leader(60, 38, 77.5, 36, 'leg', { anchor: 'end' });
          p.leader(40, 44, 72.8, 60, 'plated wall', { anchor: 'end' });
          p.leader(112, 100, 90, 84.5, 'solder');
          p.leader(48, 100, 66, 78.2, 'pad, on both sides', { anchor: 'end' });
          p.label(122, 65, 'board', { anchor: 'middle', cls: 'lbl-dark' });
          p.caption('A leg soldered into a plated hole');
        },
      },
      {
        label: 'Two ways to mount',
        draw(p) {
          p.rect(10, 62, 140, 14, 'f-fr4 s-soft');
          for (const x of [24, 64]) {
            p.rect(x - 6, 60, 12, 2, 'f-pad').rect(x - 6, 76, 12, 2, 'f-pad').rect(x - 2.5, 60, 5, 18, 'f-pad');
            p.area([[x - 5, 78], [x + 5, 78], [x + 1, 86], [x - 1, 86]], 'f-solder');
            p.rect(x - 1, 43, 2, 45, 'f-lead');
          }
          p.rect(24, 42, 10, 2, 'f-lead').rect(54, 42, 10, 2, 'f-lead');
          p.rect(32, 36, 24, 14, 'body body-c', { r: 3 });
          p.rect(96, 60, 12, 2, 'f-pad').rect(116, 60, 12, 2, 'f-pad');
          p.area([[97, 60], [103, 60], [103, 52]], 'f-solder').area([[127, 60], [121, 60], [121, 52]], 'f-solder');
          p.rect(103, 50, 18, 10, 'f-body s-soft', { sw: 0.3 });
          p.rect(103, 50, 4, 10, 'f-lead').rect(117, 50, 4, 10, 'f-lead');
          p.label(44, 98, 'through-hole', { anchor: 'middle' });
          p.label(44, 103.5, 'legs go through the board', { anchor: 'middle', size: 3.5 });
          p.label(112, 98, 'surface mount', { anchor: 'middle' });
          p.label(112, 103.5, 'sits on pads, on one side', { anchor: 'middle', size: 3.5 });
          p.caption('Two ways to fix a part to the board');
        },
      },
    ],
  },

  {
    id: 'annular-ring',
    name: 'Annular ring',
    category: 'pads',
    aka: ['ring', 'pad ring', 'breakout'],
    keywords: 'copper around hole drill via pad diameter width minimum off-centre registration',
    summary: 'The ring of copper that is left around a drilled hole.',
    definition: 'The annular ring is the copper that remains around a hole after it is drilled. Its width is half the difference between the copper diameter and the hole diameter: a 0.6 mm via with a 0.3 mm hole has a ring of 0.15 mm. The drill never lands exactly in the centre, so the ring must be wide enough to stay whole when the hole is a little off. If the hole breaks out of the copper, the connection can fail.',
    say: [
      { for: 'A rule', text: 'Keep an annular ring of at least {0.15 mm} on every via and {0.25 mm} on every through-hole pad.' },
      { for: 'Work it out', text: 'For a {1.0 mm} hole, what copper diameter gives a ring of {0.4 mm}? Use that for {J1}.' },
      { for: 'Check it', text: 'List every via and plated hole with its hole size, copper size and ring width, smallest ring first.' },
    ],
    code: `export default () => (
  <board width="12mm" height="8mm">
    <via pcbX={-2} pcbY={0} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" />
    <platedhole pcbX={2} pcbY={0} shape="circle" holeDiameter="1mm" outerDiameter="1.8mm" />
  </board>
)`,
    render: false,
    codeNote: 'tscircuit has no prop called annular ring. You set it through two numbers: holeDiameter and outerDiameter, on <via> and on <platedhole>. Here the via has a ring of (0.6 − 0.3) / 2 = 0.15 mm, and the plated hole has (1.8 − 1.0) / 2 = 0.4 mm.',
    fabTip: 'Low-cost factories ask for a ring of about 0.13 mm or more. Through-hole pads that are soldered by hand are easier to work with when the ring is 0.3 mm or wider.',
    confusedWith: [
      { id: 'clearance', diff: 'The annular ring is copper around a hole. Clearance is the empty gap between two pieces of copper.' },
      { id: 'via', diff: 'A via is the whole thing: hole, plating and copper. The annular ring is only the width of the copper around the hole.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.circle(38, 50, 21, 'pad').circle(38, 50, 10, 'hole');
          p.circle(88, 50, 14, 'pad').circle(94.5, 50, 7, 'hole');
          p.dim([28, 50], [48, 50], 'hole', { off: 27, side: -1 });
          p.dim([17, 50], [59, 50], 'copper', { off: 27 });
          p.dim([48, 50], [59, 50], '');
          p.leader(LX, 24, 53.5, 49.5, 'annular ring');
          p.leader(LX, 54, 101.8, 50, 'drill off-centre:');
          p.label(LX, 59.5, 'the ring gets thin');
          p.caption('Ring = (copper − hole) ÷ 2');
        },
      },
    ],
  },

  {
    id: 'pitch',
    name: 'Pitch',
    category: 'pads',
    aka: ['pin pitch', 'lead pitch', 'pin spacing', 'fine pitch'],
    keywords: 'distance between pins centre center spacing 2.54 1.27 0.5 mil header grid',
    summary: 'The distance from the centre of one pin to the centre of the next.',
    definition: 'Pitch is the distance between two neighbouring pins of a part, measured from centre to centre. It is not the gap between the pads. Pitch tells you how hard a part is to solder and to route: a 2.54 mm header is easy, and a 0.5 mm chip needs a steady hand and thin traces. A chip with a pitch of 0.5 mm or less is called fine pitch.',
    say: [
      { for: 'A header', text: 'Add a {6}-pin header with {2.54 mm} pitch on the {left} edge.' },
      { for: 'Choose a package', text: 'I solder by hand. For {U1}, pick a package with a pitch of {0.65 mm} or more.' },
      { for: 'Be exact', text: 'The pitch of {U3} is {0.65 mm}, not 0.5 mm. Check the footprint against that number.' },
    ],
    table: {
      caption: 'Common pitches',
      columns: ['Pitch', 'Where you find it', 'By hand'],
      rows: [
        ['2.54 mm', 'Pin headers, DIP chips, breadboards (0.1 inch)', 'Easy'],
        ['1.27 mm', 'SOIC chips, small headers', 'Easy'],
        ['1.0 mm', 'Small cable connectors', 'Fine'],
        ['0.8 mm', 'Large QFP chips, larger BGA', 'With care'],
        ['0.65 mm', 'TSSOP chips', 'With care'],
        ['0.5 mm', 'QFN and small QFP chips, USB-C', 'Hard'],
        ['0.4 mm', 'Very small QFN and BGA, phone parts', 'Not by hand'],
      ],
      note: 'The inch sizes come from 0.1 inch = 2.54 mm. A footprint drawn at 2.5 mm when the part is 2.54 mm will not fit a long connector.',
    },
    code: `export default () => (
  <board width="20mm" height="8mm">
    <pinheader name="J1" pinCount={6} pitch="2.54mm" />
  </board>
)`,
    codeNote: 'pitch is a prop of <pinheader>. In a footprint string the pitch is the p option: "tssop16_p0.65mm". Be careful with defaults: in the version this page was built with, "tssop16" alone gives a pitch of 0.5 mm, not the usual 0.65 mm.',
    fabTip: 'Below 0.5 mm pitch, the strip of solder mask between two pads becomes too thin for many factories to make, and solder bridges are more likely.',
    confusedWith: [
      { id: 'clearance', diff: 'Pitch is measured from centre to centre. Clearance is measured from edge to edge.' },
      { id: 'passive-sizes', diff: 'Pitch is the spacing of the pins of one part. A size such as 0603 is the length and width of the whole part.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          [22, 38, 54, 70, 86].forEach((x, i) => p.pth(x, 30, { d: 9, hole: 4.5, square: i === 0 }));
          p.dim([22, 30], [38, 30], '', { off: 12, side: -1 });
          p.dim([58.5, 30], [65.5, 30], '', { off: 10 });
          for (let i = 0; i < 9; i++) p.pad(24 + i * 7, 72, 3.2, 14, { r: 0.5 });
          p.dim([45, 72], [52, 72], '', { off: 12, side: -1 });
          p.label(54, 49.5, 'pin header: 2.54 mm', { anchor: 'middle', size: 3.6, cls: 'lbl-on' });
          p.label(52, 88, 'chip: 0.5 mm', { anchor: 'middle', size: 3.6, cls: 'lbl-on' });
          p.leader(LX, 22, 30, 18, 'pitch: centre to');
          p.label(LX, 27.5, 'centre');
          p.leader(LX, 44, 62, 40, 'gap: edge to edge');
          p.leader(LX, 62, 48.5, 60, 'pitch again');
          p.caption('Pitch is measured between centres');
        },
      },
    ],
  },

  {
    id: 'passive-sizes',
    name: 'Passive sizes',
    category: 'pads',
    aka: ['0402', '0603', '0805', '1206', 'chip size', 'case size', 'imperial code', 'metric code'],
    keywords: 'resistor capacitor small size code inch metric 1005 1608 2012 hand solder tiny',
    summary: 'The four-digit codes, such as 0603, that give the size of small resistors and capacitors.',
    definition: 'Small resistors, capacitors and LEDs come in a few standard sizes, each named by a four-digit code. The code is the length and the width in hundredths of an inch: 0603 is 0.06 by 0.03 inch, which is 1.6 by 0.8 mm. A smaller part saves space but is harder to solder by hand, and it can handle less power and less voltage. There is also a metric code for every size, and the two look alike: metric 0603 is a much smaller part than imperial 0603.',
    say: [
      { for: 'A default', text: 'Use {0603} for every resistor and capacitor unless I say otherwise.' },
      { for: 'Say which system', text: 'All size codes I give are imperial: 0603 means 1.6 × 0.8 mm.' },
      { for: 'When it must be bigger', text: '{C5} is {22 µF}. Use {0805 or 1206} for it, and tell me which you chose.' },
      { for: 'Save space', text: 'The board is crowded near {U1}. Change the decoupling capacitors there from 0603 to {0402}.' },
    ],
    table: {
      caption: 'Common sizes',
      columns: ['Code (imperial)', 'Metric code', 'Length × width', 'By hand'],
      rows: [
        ['0201', '0603', '0.6 × 0.3 mm', 'Machine only'],
        ['0402', '1005', '1.0 × 0.5 mm', 'Hard'],
        ['0603', '1608', '1.6 × 0.8 mm', 'Fine, with practice'],
        ['0805', '2012', '2.0 × 1.25 mm', 'Easy'],
        ['1206', '3216', '3.2 × 1.6 mm', 'Easy'],
        ['1210', '3225', '3.2 × 2.5 mm', 'Easy'],
      ],
      note: 'Shops and tscircuit use the imperial code. The metric code appears in some datasheets, so check the millimetres when a part looks far too small or too big.',
    },
    code: `export default () => (
  <board width="24mm" height="8mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-9} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={-5} />
    <resistor name="R3" resistance="1k" footprint="0805" pcbX={0} />
    <resistor name="R4" resistance="1k" footprint="1206" pcbX={6} />
  </board>
)`,
    codeNote: 'The footprint string of a resistor, capacitor or LED is its imperial size code: footprint="0603".',
    fabTip: '0603 and 0402 are the cheapest sizes to have assembled, because factories keep them loaded in their machines. A large capacitor value may not exist in a small size: 10 µF is common in 0805 and rare in 0402.',
    confusedWith: [
      { id: 'ic-packages', diff: 'A size code describes a small part with two ends. A package name such as SOIC-8 describes a chip with many pins.' },
      { id: 'pitch', diff: 'A size code is the outside of the part. Pitch is the distance between its pins.' },
    ],
    pictures: [
      {
        label: 'Same scale',
        draw(p) {
          p.board(8, 10, 144, 62);
          const sizes = [['0201', 0.6, 0.3], ['0402', 1.0, 0.5], ['0603', 1.6, 0.8], ['0805', 2.0, 1.25], ['1206', 3.2, 1.6], ['1210', 3.2, 2.5]];
          const scale = 7; // canvas units for one millimetre
          let x = 21.9;
          for (const [name, length, width] of sizes) {
            const len = length * scale;
            x += len / 2;
            p.chip(x, 40, { len, wid: width * scale });
            p.label(x, 82, name, { anchor: 'middle' });
            x += len / 2 + 7;
          }
          p.line([[16, 66], [23, 66]], 's-white', { w: 0.6 });
          p.label(27, 67.2, '1 mm', { size: 3.4, cls: 'lbl-on' });
          p.label(80, 90, 'imperial codes: 0603 is 1.6 × 0.8 mm', { anchor: 'middle', size: 3.6 });
          p.caption('Six common sizes, at the same scale');
        },
      },
    ],
  },

  {
    id: 'ic-packages',
    name: 'Chip packages',
    category: 'pads',
    aka: ['IC package', 'SOT-23', 'SOIC', 'TSSOP', 'QFP', 'QFN', 'BGA', 'DIP'],
    keywords: 'body housing legs leads pins gull wing no leads balls package type chip case',
    summary: 'The standard body shapes that chips are sold in, such as SOIC, QFN and BGA.',
    definition: 'A package is the plastic body of a chip, with its pins. The same chip is often sold in several packages. Some have legs that stick out at the sides, which are easy to solder and easy to inspect: SOT-23, SOIC, TSSOP and QFP. A QFN has no legs, only flat pads under its edges. A BGA has a grid of solder balls under the whole body, and nothing can be seen once it is soldered. The package decides the footprint, so the full part number matters, not only the name of the chip.',
    say: [
      { for: 'Name it fully', text: '{U1} is an {ATtiny85 in SOIC-8, part number ATTINY85-20SU}. Use the footprint for that package.' },
      { for: 'Choose for hand soldering', text: 'I solder by hand with an iron. Pick packages with legs for every chip: no QFN and no BGA.' },
      { for: 'Check it', text: 'For each chip, tell me its package, its pitch, and the footprint string you used.' },
    ],
    table: {
      caption: 'Common packages',
      columns: ['Package', 'Pins', 'Usual pitch', 'By hand', 'tscircuit footprint'],
      rows: [
        ['SOT-23', '3 to 6 legs, on two sides', '0.95 mm', 'Easy', '"sot23", "sot23_5"'],
        ['SOIC', 'Legs on two sides', '1.27 mm', 'Easy', '"soic8"'],
        ['TSSOP', 'Legs on two sides', '0.65 mm', 'With care', '"tssop16_p0.65mm"'],
        ['QFP (TQFP, LQFP)', 'Legs on four sides', '0.8 or 0.5 mm', 'With care', '"tqfp32", "lqfp48"'],
        ['QFN', 'Pads under four edges, no legs', '0.5 mm', 'Hard: hot air', '"qfn16", "qfn32"'],
        ['BGA', 'Balls under the whole body', '0.8 mm or less', 'No: needs an oven', '"bga64"'],
        ['DIP', 'Legs through the board', '2.54 mm', 'Very easy', '"dip8"'],
      ],
      note: 'The number in a footprint string is the pin count. Every string here was built with tscircuit before it was listed. The pitch of a package can differ between chips, so compare the footprint with the datasheet.',
    },
    code: `export default () => (
  <board width="50mm" height="16mm">
    <chip name="U1" footprint="sot23" pcbX={-21} />
    <chip name="U2" footprint="soic8" pcbX={-14} />
    <chip name="U3" footprint="tssop16_p0.65mm" pcbX={-5} />
    <chip name="U4" footprint="tqfp32" pcbX={6} />
    <chip name="U5" footprint="qfn16" pcbX={16} />
    <chip name="U6" footprint="bga16" pcbX={21.5} />
  </board>
)`,
    codeNote: 'A footprint string is the package name and the pin count, in lower case and without a dash: "soic8", "qfn32". Options follow after underscores: "tssop16_p0.65mm" sets the pitch, "qfn16_thermalpad" adds the large centre pad.',
    fabTip: 'A QFN or BGA cannot be checked by eye after soldering. If the board is assembled by a factory this is not a problem. If you assemble it yourself, a package with legs saves hours.',
    confusedWith: [
      { id: 'footprint', diff: 'The package is the part you buy. The footprint is the copper pattern on the board that fits it.' },
      { id: 'passive-sizes', diff: 'Packages are for chips with many pins. Size codes such as 0603 are for small parts with two ends.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(8, 10, 144, 62);
          const y = 41;
          sot23(p, 20, y);
          p.soic(42, y, { pitch: 4, bodyW: 9, padW: 4.5, padH: 2 });
          p.soic(64, y, { pins: 14, pitch: 2.4, bodyW: 8, padW: 4, padH: 1.3 });
          p.quad(90, y, { perSide: 6, pitch: 2.6, size: 16, legs: true, padL: 3.4, padW: 1.3 });
          p.quad(115, y, { perSide: 4, pitch: 3, size: 15, padL: 3, padW: 1.5 });
          bga(p, 138, y);
          const names = [[20, 'SOT-23', 'legs'], [42, 'SOIC', 'legs'], [64, 'TSSOP', 'legs'], [90, 'QFP', 'legs, 4 sides'], [115, 'QFN', 'no legs'], [138, 'BGA', 'balls under']];
          for (const [x, name, kind] of names) {
            p.label(x, 82, name, { anchor: 'middle' });
            p.label(x, 87.5, kind, { anchor: 'middle', size: 3.3 });
          }
          p.caption('Six common chip packages');
        },
      },
    ],
  },

  {
    id: 'pin-1',
    name: 'Pin 1 and polarity',
    category: 'pads',
    aka: ['pin one', 'pin 1 mark', 'orientation', 'polarity mark', 'cathode mark', 'anode'],
    keywords: 'dot notch direction which way round backwards reversed diode led plus minus capacitor numbering',
    summary: 'The marks that show which way round a part goes.',
    definition: 'Most parts work only one way round. A chip has a dot or a notch next to pin 1, and its pins are numbered counter-clockwise from there, seen from above. A diode or an LED has a bar at its cathode, the side the current leaves by. A polarised capacitor has a mark at its plus or its minus side. The board repeats these marks in silkscreen, so the person or machine placing the part can match them.',
    say: [
      { for: 'Mark it', text: 'Print a dot in silkscreen next to pin 1 of every chip, outside the body so it stays visible after soldering.' },
      { for: 'Diodes', text: 'Mark the cathode of every diode and LED with a bar in silkscreen.' },
      { for: 'Say the direction', text: 'Place {D1} with its cathode toward {the top edge of the board}.' },
      { for: 'Check it', text: 'For each chip, tell me where pin 1 is: which corner, seen from the top side.' },
    ],
    code: `export default () => (
  <board width="20mm" height="12mm">
    <chip
      name="U1"
      footprint="soic8"
      pcbX={-4}
      pinLabels={{ pin1: "VCC", pin4: "GND", pin8: "OUT" }}
    />
    <led name="D1" color="red" footprint="0603" pcbX={6} pcbY={0} />
    <trace from="U1.OUT" to="D1.anode" />
    <trace from="D1.cathode" to="U1.GND" />
  </board>
)`,
    codeNote: 'With no rotation, pin 1 of a chip footprint is at the top left, and the numbers run down the left side and back up the right. On <led> and <diode>, pin1 is the anode, on the left, and pin2 is the cathode. Write D1.anode and D1.cathode, not the numbers, so the direction cannot be mixed up.',
    fabTip: 'A reel of LEDs can be loaded either way, and makers do not agree on which end is pin 1. If a factory assembles the board, check the rotation of every polarised part in its preview before you approve it.',
    confusedWith: [
      { id: 'rotation', diff: 'The pin 1 mark shows how the part is turned. Rotation is the number you give to turn it.' },
      { id: 'reference-designator', diff: 'The pin 1 mark says which way round the part goes. The reference designator says which part it is.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          const pins = p.soic(40, 50);
          pins.forEach(([x, y], i) => p.label(i < 4 ? 24.5 : 55.5, y + 1.3, String(i + 1), { anchor: i < 4 ? 'end' : 'start', size: 3.6, cls: 'lbl-on' }));
          p.label(40, 74, 'numbers go round', { anchor: 'middle', size: 3.4, cls: 'lbl-on' });
          p.label(40, 78.5, 'counter-clockwise', { anchor: 'middle', size: 3.4, cls: 'lbl-on' });
          p.chip(86, 44);
          p.rect(87.2, 41.4, 1, 5.2, 'mark');
          p.chip(86, 70, { kind: 'c', len: 14, wid: 7 });
          p.silk([[76, 65.5], [76, 68.5]]).silk([[74.5, 67], [77.5, 67]]);
          p.leader(LX, 24, 36.3, 42.3, 'pin 1 mark');
          p.leader(LX, 44, 87.8, 42, 'bar: the cathode');
          p.leader(LX, 64, 77.5, 66.5, 'plus mark');
          p.caption('Marks that show which way round');
        },
      },
    ],
  },

  {
    id: 'reference-designator',
    name: 'Reference designator',
    category: 'pads',
    aka: ['refdes', 'designator', 'part name', 'R1', 'C1', 'U1'],
    keywords: 'name label letter number resistor capacitor chip connector silkscreen identify',
    summary: 'The short name of each part, such as R1 or U3: a letter for its kind and a number.',
    definition: 'A reference designator is the name of one part on the board. It is a letter for the kind of part and a number that makes it unique: R1 is the first resistor, C4 the fourth capacitor, U2 the second chip. The same name is used in the schematic, in the layout, in the bill of materials and printed on the board. It is how you, the agent and the factory point at the same part.',
    say: [
      { for: 'Name everything', text: 'Give every part a reference designator with the usual letter: R for resistors, C for capacitors, U for chips, J for connectors.' },
      { for: 'Point with it', text: 'Move {C3} next to {pin 8 of U1}.' },
      { for: 'Keep names stable', text: 'Do not renumber parts that already exist. Give new parts the next free number.' },
      { for: 'Print it', text: 'Print the designator of every part in silkscreen, next to the part and not under it.' },
    ],
    table: {
      caption: 'The usual letters',
      columns: ['Letter', 'Kind of part'],
      rows: [
        ['R', 'Resistor'],
        ['C', 'Capacitor'],
        ['L', 'Inductor'],
        ['D', 'Diode, LED'],
        ['Q', 'Transistor, MOSFET'],
        ['U', 'Chip (integrated circuit)'],
        ['J', 'Connector, pin header'],
        ['SW', 'Switch, push button'],
        ['Y', 'Crystal, oscillator'],
        ['F', 'Fuse'],
        ['TP', 'Test point'],
        ['FID', 'Fiducial'],
      ],
      note: 'These are habits, not laws. Some people write IC for chips, X for crystals, LED for LEDs and P or CN for connectors.',
    },
    code: `export default () => (
  <board width="22mm" height="12mm">
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={-7} pcbY={3} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={-7} pcbY={-3} />
    <led name="D1" color="red" footprint="0603" pcbX={7} pcbY={3} />
    <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={7} pcbY={-3} />
  </board>
)`,
    codeNote: 'The reference designator is the name prop. Every part needs one of its own, and every selector uses it: "U1.pin1", "R1.pin2". tscircuit prints it in silkscreen beside the part by itself.',
    confusedWith: [
      { id: 'net', diff: 'A reference designator names a part. A net name, such as GND, names a connection.' },
      { id: 'silkscreen', diff: 'The designator is the name. Silkscreen is the ink that prints it on the board.' },
      { id: 'pin-selector', diff: 'R1 is the part. R1.pin1 is one pin of it.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.soic(54, 52);
          p.chip(24, 32);
          p.chip(24, 74, { kind: 'c' });
          p.chip(90, 32, { kind: 'led' });
          [82, 90, 98].forEach((x, i) => p.pth(x, 74, { square: i === 0 }));
          p.silkText(54, 37, 'U1');
          p.silkText(24, 26, 'R1');
          p.silkText(24, 68, 'C1');
          p.silkText(90, 26, 'D1');
          p.silkText(90, 66, 'J1');
          p.leader(LX, 24, 94.5, 24.5, 'D: a diode or LED');
          p.leader(LX, 46, 58.5, 35.5, 'U: a chip');
          p.leader(LX, 68, 94.5, 64.5, 'J: a connector');
          p.caption('Every part has a name on the board');
        },
      },
    ],
  },

  {
    id: 'courtyard',
    name: 'Courtyard',
    category: 'pads',
    aka: ['component courtyard', 'placement boundary', 'component clearance'],
    keywords: 'space around part room overlap too close collide placement nozzle rework',
    summary: 'The area a part needs for itself. Courtyards of two parts must not overlap.',
    definition: 'A courtyard is a box drawn around a part, a little larger than the part and its pads. It marks the room the part needs: for its body, for the solder, and for the tool that places it. The rule is simple: the courtyards of two parts must not overlap. It is a quick way to know that parts are not too close, without measuring every pair of pads. The courtyard is not printed on the board. It exists only in the design.',
    say: [
      { for: 'The rule', text: 'No two courtyards may overlap. Tell me every pair that does.' },
      { for: 'More room', text: 'I will solder by hand. Leave at least {1 mm} between the courtyards of neighbouring parts.' },
      { for: 'Pack tightly', text: 'Place {C1 to C4} as close to {U1} as their courtyards allow.' },
      { for: 'Show them', text: 'Show me the board with the courtyards drawn.' },
    ],
    code: `export default () => (
  <board width="16mm" height="10mm">
    <resistor name="R1" resistance="1k" footprint="0805" pcbX={-3} pcbY={0} />
    <resistor name="R2" resistance="1k" footprint="0805" pcbX={3} pcbY={0} />
  </board>
)`,
    renderOptions: { showCourtyards: true },
    codeNote: 'Every standard footprint brings its own courtyard: for an 0805 it is a box of 3.36 × 1.9 mm. If two parts are too close, the build reports pcb_footprint_overlap_error, with a message such as "R1 overlaps R2: 1 footprint overlap, 1 pad clearance violation, 1 courtyard conflict. Move the components apart." To see the courtyards, add --show-courtyards to tsci snapshot or to tsci export -f pcb-svg. A footprint you draw yourself has no courtyard, and the build warns about it.',
    fabTip: 'Courtyards keep parts apart on the board, but they know nothing about height. A tall capacitor beside a connector can still block the plug. Check tall parts yourself.',
    confusedWith: [
      { id: 'clearance', diff: 'A courtyard keeps whole parts apart. Clearance keeps pieces of copper apart.' },
      { id: 'keepout', diff: 'A courtyard belongs to a part and moves with it. A keep-out is an area of the board that you close off.' },
      { id: 'footprint', diff: 'The footprint is the pads the part is soldered to. The courtyard is the empty room around them.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          courtyard(p, 20, 23, 20, 14);
          courtyard(p, 50, 23, 20, 14);
          p.chip(30, 30);
          p.chip(60, 30);
          p.rect(49, 67, 4, 14, 'f-hi');
          courtyard(p, 33, 67, 20, 14);
          courtyard(p, 49, 67, 20, 14);
          p.chip(43, 74);
          p.chip(59, 74);
          p.badge(92, 30, 'ok').badge(92, 74, 'no');
          p.leader(LX, 24, 70, 26, 'courtyard: the room');
          p.label(LX, 29.5, 'one part needs');
          p.leader(LX, 62, 52, 70, 'overlap: these two');
          p.label(LX, 67.5, 'are too close');
          p.caption('Courtyards must not overlap');
        },
      },
    ],
  },

  {
    id: 'exposed-pad',
    name: 'Exposed pad and thermal vias',
    category: 'pads',
    aka: ['thermal pad', 'EP', 'centre pad', 'die pad', 'heat slug', 'thermal via'],
    keywords: 'heat hot cooling qfn regulator ground under chip vias spread temperature power',
    summary: 'A large pad under a chip that carries its heat into the board.',
    definition: 'Many chips that get warm have a large metal pad on their underside, called the exposed pad. It is soldered to a matching pad on the board, and heat flows out of the chip through it. Thermal vias are a group of vias inside that pad. They carry the heat to a large copper area on the other side of the board, which spreads it. The exposed pad is usually also the ground pin of the chip, so it must be connected, not only soldered.',
    say: [
      { for: 'Add it', text: '{U1} has an exposed pad. Add the centre pad to its footprint and connect it to {GND}.' },
      { for: 'Thermal vias', text: 'Put a {3 × 3} grid of vias in the exposed pad of {U1}, {0.3 mm} holes, {1 mm} apart, down to a ground pour on the bottom layer.' },
      { for: 'Keep the copper', text: 'Keep the bottom layer under {U1} as solid copper. Do not route traces through it.' },
      { for: 'Check the datasheet', text: 'Read the datasheet of {U1} and tell me what its exposed pad must be connected to.' },
    ],
    code: `export default () => (
  <board width="14mm" height="14mm" isViaInPadAllowed>
    <chip name="U1" footprint="qfn16_thermalpad" />
    <via pcbX={-0.5} pcbY={0.5} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" connectsTo="net.GND" />
    <via pcbX={0.5} pcbY={0.5} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" connectsTo="net.GND" />
    <via pcbX={-0.5} pcbY={-0.5} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" connectsTo="net.GND" />
    <via pcbX={0.5} pcbY={-0.5} fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" connectsTo="net.GND" />
    <trace from="U1.thermalpad" to="net.GND" />
    <copperpour layer="bottom" connectsTo="net.GND" />
  </board>
)`,
    codeNote: 'Adding _thermalpad to a QFN footprint string adds the centre pad. It becomes one more pin, after the last numbered one, and it also answers to the name thermalpad. A via inside a pad is a placement error unless <board> has isViaInPadAllowed.',
    fabTip: 'Solder can run down an open via and leave the pad with too little. Keep thermal vias small, about 0.3 mm, or ask the factory to fill them. Too much solder paste on a big pad makes the chip float, so the paste there is often printed as a few small squares.',
    confusedWith: [
      { id: 'thermal-relief', diff: 'Thermal vias help heat leave a chip. A thermal relief does the opposite job: it keeps heat in a pad while you solder it.' },
      { id: 'via-stitching', diff: 'Thermal vias sit under one chip to move heat. Stitching vias are spread over the board to tie copper areas together.' },
      { id: 'tented-via', diff: 'A via in a pad cannot be tented: it is open to the solder. That is why via-in-pad needs care.' },
    ],
    pictures: [
      {
        label: 'Under the chip',
        draw(p) {
          p.board(...B);
          p.quad(58, 53, { perSide: 5, pitch: 5, size: 34, padL: 5, padW: 2.4, body: false });
          p.pad(58, 53, 18, 18, { r: 1 });
          for (const dx of [-5.5, 0, 5.5]) for (const dy of [-5.5, 0, 5.5]) p.via(58 + dx, 53 + dy, { d: 3.4, hole: 1.5, cls: 'f-cu s-pad' });
          p.rect(41, 36, 34, 34, 'f-none s-white dash', { sw: 0.35 });
          p.leader(LX, 24, 73, 43, 'pad for a pin');
          p.leader(LX, 44, 65.5, 50.5, 'exposed pad');
          p.leader(LX, 62, 64.6, 58.5, 'thermal via');
          p.leader(LX, 80, 75, 66, 'outline of the chip');
          p.caption('The footprint of a chip with an exposed pad');
        },
      },
      {
        label: 'Cut through',
        draw(p) {
          p.rect(24, 60, 112, 20, 'f-fr4 s-soft');
          p.rect(24, 80, 112, 3.5, 'f-cub');
          p.rect(60, 57, 40, 3, 'f-pad').rect(38, 57, 10, 3, 'f-pad').rect(112, 57, 10, 3, 'f-pad');
          for (const x of [66, 75, 85, 94]) p.rect(x - 1.6, 57, 3.2, 26.5, 'f-pad s-pad', { sw: 0.2 });
          p.rect(62, 54, 36, 3, 'f-solder').rect(40, 54, 6, 3, 'f-solder').rect(114, 54, 6, 3, 'f-solder');
          p.rect(40, 34, 80, 20, 'f-body s-soft', { sw: 0.3 });
          p.rect(62, 51.5, 36, 2.5, 'f-lead').rect(40, 50, 6, 4, 'f-lead').rect(114, 50, 6, 4, 'f-lead');
          for (const x of [70.5, 80, 89.5]) p.arrow([x, 42], [x, 78], 'arw-hi');
          p.leader(80, 22, 80, 35, 'chip, getting warm', { anchor: 'middle' });
          p.leader(42, 102, 61.5, 58.5, 'exposed pad', { anchor: 'middle' });
          p.leader(86, 102, 94, 72, 'thermal via', { anchor: 'middle' });
          p.leader(130, 102, 126, 82, 'bottom copper', { anchor: 'middle' });
          p.caption('Heat leaves the chip and spreads in the board');
        },
      },
    ],
  },

  {
    id: 'castellated-hole',
    name: 'Castellated holes',
    category: 'pads',
    aka: ['castellation', 'half hole', 'plated half-hole', 'edge plating', 'module pads'],
    keywords: 'module edge esp32 solder down board on board daughter stamp half cut',
    summary: 'Plated half holes on the edge of a small board, so it can be soldered flat onto a bigger one.',
    definition: 'A castellated hole is a plated hole that the edge of the board cuts in half. A row of them along the edge turns a small board into a part: it can be laid flat on a larger board and soldered down, edge to pad. Radio modules such as the ESP32 are made this way. On the larger board, each half hole needs a pad that reaches out from under the module, so the solder can be seen and touched with an iron.',
    say: [
      { for: 'Make a module', text: 'This board is a module. Put castellated holes along the {left and right} edges, {2.54 mm} apart, one for each signal: {GND, 3V3, SDA, SCL}.' },
      { for: 'Carry a module', text: '{U1} is an {ESP32-WROOM} module with castellated edges. Use the footprint from its datasheet, with pads that reach {1 mm} out from under it.' },
      { for: 'Keep clear', text: 'Keep parts and other copper at least {1 mm} away from the castellated edge.' },
    ],
    code: `export default () => (
  <board
    outline={[
      { x: -6, y: -5 },
      { x: 6, y: -5 },
      { x: 6, y: -2.54, isCastellatedHole: true, holeDiameter: "0.8mm", padDiameter: "1.4mm", connectsTo: "net.GND" },
      { x: 6, y: 0, isCastellatedHole: true, holeDiameter: "0.8mm", padDiameter: "1.4mm", connectsTo: "net.V3_3" },
      { x: 6, y: 2.54, isCastellatedHole: true, holeDiameter: "0.8mm", padDiameter: "1.4mm", connectsTo: "net.SDA" },
      { x: 6, y: 5 },
      { x: -6, y: 5 },
    ]}
  >
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={-1} pcbY={2} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={-1} pcbY={-2} />
    <trace from="R1.pin1" to="net.V3_3" />
    <trace from="R1.pin2" to="net.SDA" />
    <trace from="C1.pin1" to="net.V3_3" />
    <trace from="C1.pin2" to="net.GND" />
  </board>
)`,
    codeNote: 'Castellated holes are points of the board outline. Give a point isCastellatedHole, a holeDiameter, a padDiameter and the net it connectsTo, and a plated hole is centred on that point of the edge. The board then needs an outline, a list of corner points, in place of width and height.',
    fabTip: 'Castellated holes are a special order at most factories and cost extra. Many ask for holes of 0.5 or 0.6 mm at least. Check before you design the module around them.',
    confusedWith: [
      { id: 'through-hole', diff: 'A through hole is whole and takes a leg. A castellated hole is half a hole on the edge, and takes only solder.' },
      { id: 'board-outline', diff: 'The outline is the edge of the board. Castellated holes are plated holes that the edge runs through.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          const ys = [30, 53, 76];
          const edge = [[14, 12], [96, 12]];
          for (const y of ys) edge.push([96, y - 5], ...arc(96, y, 5, -90, -270), [96, y + 5]);
          edge.push([96, 94], [14, 94]);
          p.area(edge, 'brd');
          for (const y of ys) {
            p.trace([[87, y], [58, y]], { w: 2 });
            p.area([...arc(96, y, 9, -90, -270), ...arc(96, y, 5, -270, -90)], 'pad');
          }
          p.soic(40, 53);
          p.leader(LX, 26, 89.5, 25.5, 'half hole, plated');
          p.leader(LX, 46, 96, 41.5, 'edge of the board');
          p.leader(LX, 51.5 + 14, 72, 53.5, 'trace to the hole');
          p.caption('Half holes along the edge of a module');
        },
      },
      {
        label: 'Soldered down',
        draw(p) {
          p.rect(12, 74, 136, 16, 'f-fr4 s-soft');
          p.rect(86, 71, 34, 3, 'f-pad');
          p.rect(26, 53, 74, 16, 'f-fr4 s-soft');
          p.rect(86, 69, 14, 2, 'f-pad').rect(86, 51, 14, 2, 'f-pad').rect(97.5, 51, 2.5, 20, 'f-pad');
          p.area([[100, 54], [100, 71], [117, 71]], 'f-solder');
          p.rect(40, 41, 30, 10, 'f-body s-soft', { sw: 0.3 });
          p.rect(38, 51, 6, 2, 'f-pad').rect(66, 51, 6, 2, 'f-pad');
          p.leader(56, 28, 56, 41.5, 'module', { anchor: 'middle' });
          p.leader(126, 40, 99, 58, 'plated edge');
          p.leader(132, 58, 108, 65, 'solder');
          p.leader(132, 104, 117, 72.5, 'pad of the main board', { anchor: 'middle', size: 4 });
          p.label(46, 84, 'main board', { anchor: 'middle', cls: 'lbl-dark' });
          p.caption('A module soldered flat onto a board');
        },
      },
    ],
  },
];
