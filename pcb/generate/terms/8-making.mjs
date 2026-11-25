// Making the board: files, soldering and assembly.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/**
 * One layer of the board drawn as a tilted dark sheet. `draw` gets a function that
 * turns a place on the sheet (0 to 64 across, 0 to 36 down) into a place on the canvas.
 */
function sheet(p, y0, draw) {
  const at = (u, v) => [20 + u + (36 - v) * 0.5, y0 + v * 0.42];
  p.area([at(0, 0), at(64, 0), at(64, 36), at(0, 36)], 'f-body s-soft');
  const box = (u, v, w, h) => [at(u - w / 2, v - h / 2), at(u + w / 2, v - h / 2), at(u + w / 2, v + h / 2), at(u - w / 2, v + h / 2)];
  draw(at, box);
  return at(64, 18); // the middle of the right-hand edge, for a label
}

// the same small board on every sheet: two pads on the left, six on the right, two holes
const PADS = [[12, 12], [20, 12], [38, 9], [38, 17], [38, 25], [52, 9], [52, 17], [52, 25]];
const HOLES = [[8, 29], [58, 31]];

/** One step of soldering, seen from the side: a piece of board with two pads. */
function bench(p, x0) {
  p.rect(x0, 66, 40, 12, 'f-fr4 s-soft');
  p.rect(x0 + 5, 63, 10, 3, 'f-pad s-pad', { sw: 0.25 }).rect(x0 + 25, 63, 10, 3, 'f-pad s-pad', { sw: 0.25 });
}

/** A two-ended part seen from the side, resting with its underside at y. */
function partSide(p, x0, y) {
  p.rect(x0 + 9, y - 8, 22, 8, 'body');
  p.rect(x0 + 9, y - 8, 5, 8, 'f-lead').rect(x0 + 26, y - 8, 5, 8, 'f-lead');
}

export default [
  {
    id: 'gerber',
    name: 'Gerber files',
    category: 'making',
    aka: ['gerbers', 'fabrication files', 'manufacturing files', 'RS-274X', 'drill file', 'Excellon'],
    keywords: 'export files factory order zip layers gbr drl upload manufacture output production',
    summary: 'The set of files a factory makes the board from: one picture for each layer.',
    definition: 'Gerber files are what you send to a factory to have a board made. Each file is a flat picture of one layer: the copper of the top side, the copper of the bottom side, the solder mask, the silkscreen, the solder paste and the outline of the board. One more file, the drill file, lists every hole with its position and size. The files are packed in one zip. They hold only shapes: a Gerber file does not know what a net or a part is.',
    say: [
      { for: 'Export', text: 'Export the Gerber files of {index.circuit.tsx} and tell me the names of the files in the zip.' },
      { for: 'Before ordering', text: 'Before you export, build the board and show me every error and warning. Export only if there are none.' },
      { for: 'Check the export', text: 'Open the zip and check that it has a copper file for each of the {2} layers, an outline file and a drill file.' },
    ],
    table: {
      caption: 'The files in the zip',
      columns: ['File', 'What it holds'],
      rows: [
        ['F_Cu.gbr, B_Cu.gbr', 'Copper of the top and of the bottom layer'],
        ['F_Mask.gbr, B_Mask.gbr', 'Openings in the solder mask'],
        ['F_SilkScreen.gbr, B_SilkScreen.gbr', 'Silkscreen ink'],
        ['F_Paste.gbr, B_Paste.gbr', 'Openings in the solder paste stencil'],
        ['Edge_Cuts.gbr', 'The outline of the board'],
        ['drill-L1-L2.drl', 'Every drilled hole. Only there if the board has holes'],
        ['bom.csv', 'The bill of materials'],
        ['pick_and_place.csv', 'The position of every part'],
      ],
      note: 'These are the names tscircuit writes. F means front, the top side. B means back, the bottom side.',
    },
    cli: `# writes index.circuit-gerbers.zip next to the file
tsci export index.circuit.tsx -f gerbers

# a picture of the board, to look at before you order
tsci export index.circuit.tsx -f pcb-svg`,
    fabTip: 'Always look at the exported files in a Gerber viewer before you pay. Most factories show a preview when you upload the zip. Check the outline, the holes and that the text reads the right way round.',
    confusedWith: [
      { id: 'circuit-json', diff: 'Circuit JSON is the whole design: parts, nets, traces. Gerber files are only the finished shapes, made from it for the factory.' },
      { id: 'pick-and-place', diff: 'Gerber files are for making the bare board. The pick-and-place file is for putting the parts on it.' },
    ],
    pictures: [
      {
        label: 'The layers',
        draw(p) {
          const names = [];
          names.push(sheet(p, 10, (at, box) => {
            p.line([at(33, 4), at(57, 4), at(57, 30), at(33, 30), at(33, 4)], 'silk', { w: 0.6 });
            p.line([at(9, 8), at(23, 8), at(23, 16), at(9, 16), at(9, 8)], 'silk', { w: 0.6 });
            p.area(box(35.5, 6, 2, 1.6), 'f-silk');
          }));
          names.push(sheet(p, 28, (at, box) => {
            for (const [u, v] of PADS) p.area(box(u, v, 6.4, 5), 'f-mask');
          }));
          names.push(sheet(p, 46, (at, box) => {
            p.line([at(20, 12), at(30, 12), at(35, 17), at(38, 17)], 'cu', { w: 0.9 });
            p.line([at(52, 25), at(58, 25), at(58, 31)], 'cu', { w: 0.9 });
            p.line([at(12, 12), at(8, 16), at(8, 29)], 'cu', { w: 0.9 });
            for (const [u, v] of PADS) p.area(box(u, v, 5, 3.6), 'f-cu');
            for (const [u, v] of HOLES) p.circle(...at(u, v), 1.5, 'f-cu');
          }));
          names.push(sheet(p, 64, (at) => {
            for (const [u, v] of HOLES) p.circle(...at(u, v), 0.9, 'f-white');
          }));
          names.push(sheet(p, 82, (at) => {
            p.line([at(3, 3), at(61, 3), at(61, 33), at(3, 33), at(3, 3)], 's-white', { w: 0.6 });
          }));
          const text = [['silkscreen'], ['solder mask'], ['copper: one file', 'for each layer'], ['drill holes'], ['board outline']];
          names.forEach(([x, y], i) => {
            p.leader(110, y + 1.4, x - 1.5, y, text[i][0]);
            if (text[i][1]) p.label(110, y + 6.9, text[i][1]);
          });
          p.caption('One file for each layer of the board');
        },
      },
    ],
  },

  {
    id: 'bom',
    name: 'Bill of materials',
    category: 'making',
    aka: ['BOM', 'parts list', 'bom.csv'],
    keywords: 'parts list buy order quantity part number supplier lcsc jlcpcb digikey mouser value do not place dnp',
    summary: 'The list of every part on the board: what it is, and where to buy it.',
    definition: 'The bill of materials, or BOM, is the list of all the parts that go on the board. Each line gives the reference designators, the value, the footprint and a part number that someone can order. An assembly factory needs it together with the pick-and-place file. A value alone is not enough: "100 nF" matches thousands of parts. An exact part number from the supplier removes the guess. A part marked "do not place" keeps its pads on the board but is left out of the list.',
    say: [
      { for: 'Give a part number', text: 'Use JLCPCB part {C25804} for {R1}.' },
      { for: 'Choose parts', text: 'For every part without a part number, suggest one that {JLCPCB} has in stock as a basic part, and wait for my answer.' },
      { for: 'Leave one out', text: 'Mark {R7} as do not place. Keep its pads on the board.' },
      { for: 'Review it', text: 'Show me the BOM as a table: designators, value, footprint, part number and quantity.' },
    ],
    table: {
      caption: 'The columns of bom.csv',
      columns: ['Column', 'Example', 'Meaning'],
      rows: [
        ['Designator', 'R1', 'The name of the part on the board'],
        ['Comment', '10k', 'The value, or the manufacturer part number if you gave one'],
        ['Value', '10k', 'The value'],
        ['Footprint', 'res0603', 'The footprint'],
        ['JLCPCB Part #', 'C25804', 'The number to order by'],
      ],
      note: 'As tscircuit writes it into the Gerber zip. The column names follow the template of JLCPCB.',
    },
    code: `export default () => (
  <board width="24mm" height="12mm">
    <resistor
      name="R1" resistance="10k" footprint="0603" pcbX={-7} pcbY={0}
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
    />
    <capacitor
      name="C1" capacitance="100nF" footprint="0603" pcbX={0} pcbY={0}
      manufacturerPartNumber="CL10B104KB8NNNC"
    />
    <resistor name="R2" resistance="0" footprint="0603" pcbX={7} pcbY={0} doNotPlace />
  </board>
)`,
    render: false,
    codeNote: 'supplierPartNumbers names the part at one supplier. manufacturerPartNumber names it at its maker. doNotPlace keeps the pads on the board and takes the part out of bom.csv and pick_and_place.csv. When a part has no number at all, tscircuit can look for a matching part by itself, so read the numbers in the BOM before you order.',
    fabTip: 'Assembly services keep a list of common parts that they always have loaded, often called basic parts. Choosing from that list is cheaper and faster than asking for a part they must fetch.',
    confusedWith: [
      { id: 'pick-and-place', diff: 'The BOM says what each part is. The pick-and-place file says where each part goes.' },
      { id: 'reference-designator', diff: 'A reference designator names one part on the board. The BOM is the list of all of them.' },
    ],
    pictures: [
      {
        label: 'Board and list',
        draw(p) {
          p.board(8, 16, 68, 72);
          p.soic(46, 54, { bodyW: 11, padW: 5 });
          p.chip(22, 32);
          p.chip(22, 46);
          p.chip(22, 70, { kind: 'c' });
          p.chip(58, 80, { kind: 'led' });
          p.chip(56, 28, { body: false });
          p.silkText(22, 26.2, 'R1', { size: 3.2 });
          p.silkText(22, 54, 'R2', { size: 3.2 });
          p.silkText(22, 78, 'C1', { size: 3.2 });
          p.silkText(46, 41, 'U1', { size: 3.2 });
          p.silkText(44, 81.2, 'LED1', { size: 3.2 });
          p.silkText(56, 22.4, 'R3', { size: 3.2 });
          // the list
          p.rect(84, 16, 72, 46, 'f-stage s-soft', { r: 1.5, note: true });
          p.label(88, 22.5, 'BILL OF MATERIALS', { size: 3.3, cls: 'ttl' });
          const rows = [['R1 R2', '10 kΩ', '0603'], ['C1', '100 nF', '0603'], ['LED1', 'red', '0603'], ['U1', 'ATtiny85', 'SOIC-8']];
          rows.forEach(([ref, value, size], i) => {
            const y = 31 + i * 8;
            p.line([[86, y - 5.2], [154, y - 5.2]], 's-soft', { note: true });
            p.label(88, y, ref, { size: 3.5 });
            p.label(106, y, value, { size: 3.5 });
            p.label(131, y, size, { size: 3.5 });
          });
          p.leader(88, 76, 59.5, 30, 'R3: do not place.');
          p.label(88, 81.5, 'Its pads stay empty.');
          p.caption('Every part on the board, as a list');
        },
      },
    ],
  },

  {
    id: 'pick-and-place',
    name: 'Pick-and-place file',
    category: 'making',
    aka: ['centroid file', 'CPL', 'placement file', 'position file', 'XY file'],
    keywords: 'assembly machine position x y rotation side centre csv placement coordinates pcba',
    summary: 'The position, rotation and side of every part, for the assembly machine.',
    definition: 'A pick-and-place machine picks each part from a reel and puts it on the board. The pick-and-place file tells it where: one line for each part, with its reference designator, the X and Y position of its centre, its rotation, and whether it sits on the top or the bottom side. The factory needs this file and the bill of materials to assemble a board. It is made from the design, so you never write it by hand.',
    say: [
      { for: 'Export', text: 'Export the pick-and-place file and show me its first {10} lines.' },
      { for: 'Check rotation', text: 'List every polarised part with its rotation: {diodes, LEDs, chips and electrolytic capacitors}.' },
      { for: 'One side only', text: 'Keep every part on the top side, so the board needs only one pass through the machine.' },
    ],
    table: {
      caption: 'The columns of pick_and_place.csv',
      columns: ['Column', 'Example', 'Meaning'],
      rows: [
        ['Designator', 'C1', 'The name of the part'],
        ['Mid X', '-2.860', 'X of the centre of the part, in mm'],
        ['Mid Y', '0.000', 'Y of the centre of the part, in mm'],
        ['Layer', 'top', 'The side the part is on: top or bottom'],
        ['Rotation', '180', 'The angle in degrees, counter-clockwise'],
      ],
      note: 'As tscircuit writes it into the Gerber zip. Positions are measured from the origin of the board, the same as pcbX and pcbY.',
    },
    fabTip: 'The most common assembly fault is a part turned the wrong way, because the 0° of the footprint and the 0° of the part on its reel do not agree. The factory shows a picture of the placed parts before it builds. Look at pin 1 of every chip and at every diode in it.',
    confusedWith: [
      { id: 'bom', diff: 'The pick-and-place file says where each part goes. The BOM says what each part is.' },
      { id: 'gerber', diff: 'Gerber files describe the bare board. The pick-and-place file describes the parts on it.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.line([[54, 53], [66, 53]], 's-white').line([[60, 47], [60, 59]], 's-white');
          p.chip(88, 28, { kind: 'd', rot: 90, len: 15, wid: 7 });
          p.silkText(99, 29.4, 'D1', { size: 3.6 });
          p.dim([60, 53], [88, 53], '');
          p.dim([88, 53], [88, 28], '');
          p.label(74, 60, 'X', { anchor: 'middle', cls: 'lbl-on' });
          p.label(91, 45, 'Y', { cls: 'lbl-on' });
          p.circle(88, 28, 1.3, 'f-white s-ink', { note: true });
          p.leader(LX, 22, 89.4, 27.6, 'centre of the part');
          p.label(LX, 40, 'rotation: 90°');
          p.label(LX, 46.5, 'side: top');
          p.leader(LX, 66, 61, 54, 'origin of the board');
          p.caption('Where the machine puts one part');
        },
      },
    ],
  },

  {
    id: 'solder-paste',
    name: 'Solder paste and stencil',
    category: 'making',
    aka: ['paste', 'stencil', 'paste layer', 'solder stencil', 'aperture'],
    keywords: 'paste stencil steel sheet opening aperture print squeegee smd pads grey cream paste layer',
    summary: 'Paste of tiny solder balls, printed onto the pads through a thin steel stencil.',
    definition: 'Solder paste is a grey paste of tiny solder balls mixed with flux. A stencil is a thin sheet of steel with an opening over every surface-mount pad. The stencil is laid on the board, paste is wiped across it with a blade, and the stencil is lifted off. Each pad is left with a small block of paste, just the right amount to solder one pin. The paste layer of the design is the drawing of those openings.',
    say: [
      { for: 'Less paste', text: 'Make the paste openings of {U1} {0.05 mm} smaller than the pads on every side.' },
      { for: 'No paste', text: 'Put no solder paste on {the test points} and on {the pads of J3}, which I solder by hand.' },
      { for: 'A big pad', text: 'Split the paste on the centre pad of {U2} into a grid of {4} small squares.' },
    ],
    code: `export default () => (
  <board width="20mm" height="12mm">
    <chip
      name="U1" pcbX={0} pcbY={0}
      footprint={
        <footprint>
          <smtpad portHints={["pin1"]} shape="rect" width="2mm" height="2mm" pcbX={-4} pcbY={0} />
          <smtpad portHints={["pin2"]} shape="rect" width="2mm" height="2mm" pcbX={0} pcbY={0}
            solderPasteMargin="-0.3mm" />
          <smtpad portHints={["pin3"]} shape="rect" width="2mm" height="2mm" pcbX={4} pcbY={0}
            noSolderPaste />
        </footprint>
      }
    />
  </board>
)`,
    render: false,
    codeNote: 'Every <smtpad> gets a paste opening by itself. solderPasteMargin changes its size on each side: a negative number makes the opening smaller than the pad. noSolderPaste leaves the pad without paste. defaultSolderPasteMargin on <board> sets the margin for all pads at once.',
    fabTip: 'A stencil is about 0.1 to 0.15 mm thick, and that thickness sets how much paste every pad gets. Too much paste on fine pins joins them together. Too little gives a weak joint.',
    confusedWith: [
      { id: 'solder-mask', diff: 'Solder mask is the coating that stays on the board and keeps solder off. Solder paste is the solder itself, put on the pads just before assembly.' },
      { id: 'surface-finish', diff: 'The surface finish is a thin coating put on the pads when the board is made. Solder paste is added later, when the parts go on.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          p.rect(12, 72, 136, 18, 'f-fr4 s-soft');
          p.rect(12, 70, 136, 2, 'f-mask');
          p.rect(34, 68, 26, 4, 'f-pad s-pad', { sw: 0.25 }).rect(100, 68, 26, 4, 'f-pad s-pad', { sw: 0.25 });
          // left: the stencil is on the board and the blade wipes paste into the opening
          p.rect(12, 62, 23, 6, 'f-lead s-soft', { sw: 0.3 }).rect(59, 62, 23, 6, 'f-lead s-soft', { sw: 0.3 });
          p.rect(35, 62, 24, 6, 'f-paste');
          p.circle(61.5, 58.4, 3.6, 'f-paste');
          p.area([[65, 62], [70, 62], [84, 34], [79, 34]], 'f-soft');
          p.arrow([74, 28], [56, 28]);
          // right: the stencil is gone and the paste stays
          p.rect(101, 62, 24, 6, 'f-paste');
          p.leader(22, 48, 22, 62.6, 'stencil', { anchor: 'middle' });
          p.label(92, 39, 'blade');
          p.leader(113, 48, 113, 62.6, 'paste left on the pad', { anchor: 'middle' });
          p.leader(47, 102, 47, 66, 'paste fills the opening', { anchor: 'middle' });
          p.leader(113, 102, 113, 70.6, 'pad', { anchor: 'middle' });
          p.caption('Paste is printed through a stencil');
        },
      },
    ],
  },

  {
    id: 'reflow',
    name: 'Reflow soldering',
    category: 'making',
    aka: ['reflow', 'reflow oven', 'SMT assembly', 'PCBA', 'hot plate soldering'],
    keywords: 'oven heat melt paste assembly smd surface mount solder profile hot plate hot air wave hand iron',
    summary: 'Soldering all surface-mount parts at once: print paste, place the parts, heat the board.',
    definition: 'Reflow soldering solders every surface-mount part of a board in one go. First, solder paste is printed on the pads. Second, the parts are placed in the paste, which is sticky enough to hold them. Third, the whole board is heated in an oven until the paste melts and turns into solid joints. Melted solder pulls small parts straight onto their pads. Hand soldering with an iron does one joint at a time, and suits through-hole parts and repairs. Wave soldering passes the underside of the board over a wave of melted solder, for boards with many through-hole parts.',
    say: [
      { for: 'Design for the oven', text: 'This board will be reflow soldered. Keep all surface-mount parts on the top side.' },
      { for: 'Design for the iron', text: 'I will solder this board by hand. Use {0805} or larger parts and no packages with pads underneath.' },
      { for: 'Mixed', text: 'The surface-mount parts are assembled by the factory. I solder {the connectors} myself, so leave room for an iron around them.' },
    ],
    fabTip: 'Parts on both sides need two passes through the oven and cost more. Parts with pads underneath, such as QFN and BGA, can only be soldered by reflow or with hot air.',
    confusedWith: [
      { id: 'solder-paste', diff: 'Solder paste is the material. Reflow is the step that melts it.' },
      { id: 'tombstoning', diff: 'Reflow is the process. Tombstoning is one of the faults that can happen during it.' },
    ],
    pictures: [
      {
        label: 'Three steps',
        draw(p) {
          // 1: paste on the pads
          bench(p, 14);
          p.rect(20, 59, 8, 4, 'f-paste').rect(40, 59, 8, 4, 'f-paste');
          // 2: the part sits in the paste
          bench(p, 60);
          p.rect(65, 61, 10, 2, 'f-paste').rect(85, 61, 10, 2, 'f-paste');
          partSide(p, 60, 61);
          // 3: heated, the paste has become solder
          bench(p, 106);
          p.area([[110.5, 63], [115, 63], [115, 56.5]], 'f-solder');
          p.area([[141.5, 63], [137, 63], [137, 56.5]], 'f-solder');
          partSide(p, 106, 63);
          for (const x of [118, 126, 134]) p.path(`M${x} 50q2.4 -3 0 -6q-2.4 -3 0 -6q2.4 -3 0 -6`, 'f-none s-bad', [x - 2, 32, x + 2, 50]);
          p.arrow([55, 60], [59, 60]).arrow([101, 60], [105, 60]);
          [[34, '1  paste', 'printed on the pads'], [80, '2  place', 'the part sits in the paste'], [126, '3  heat', 'the paste melts into solder']].forEach(([x, name, what]) => {
            p.label(x, 89, name, { anchor: 'middle' });
            p.label(x, 94.5, what, { anchor: 'middle', size: 3.3 });
          });
          p.caption('Reflow soldering, step by step');
        },
      },
    ],
  },

  {
    id: 'surface-finish',
    name: 'Surface finish',
    category: 'making',
    aka: ['pad finish', 'plating', 'HASL', 'ENIG', 'OSP', 'immersion gold'],
    keywords: 'coating pads gold tin solder hasl enig osp lead free flat oxidise shelf life finish plating',
    summary: 'The thin coating a factory puts on the bare pads so they stay easy to solder.',
    definition: 'Bare copper turns dull in air within days, and solder does not stick to dull copper. So the factory covers every pad that the solder mask leaves open with a thin coating: the surface finish. You choose it when you order. HASL is a layer of solder and is the cheapest. ENIG is a very thin layer of gold over nickel: it is flat, which small and fine parts need. OSP is a thin clear film, flat and cheap, but it does not keep for long.',
    say: [
      { for: 'State it', text: 'The board will be ordered with {lead-free HASL}. Tell me if any part on it needs a flatter finish.' },
      { for: 'When to change', text: '{U1} is a {QFN with 0.4 mm pitch}. Note in the README that this board must be ordered with ENIG.' },
    ],
    table: {
      caption: 'Common surface finishes',
      columns: ['Finish', 'Surface', 'Cost', 'Use it for'],
      rows: [
        ['HASL, with lead', 'A little uneven', 'Lowest', 'Hand soldering and large parts. Not allowed in products sold in many countries'],
        ['HASL, lead-free', 'A little uneven', 'Low', 'Most boards with parts of 0.65 mm pitch or wider'],
        ['ENIG (gold)', 'Flat', 'Higher', 'Fine pitch, QFN and BGA, edge contacts, boards stored for a long time'],
        ['OSP', 'Flat', 'Low', 'Boards assembled by machine soon after they are made'],
      ],
      note: 'Prices and limits differ between factories. Check the order page of yours.',
    },
    fabTip: 'The finish is chosen on the order form, not in the design files. Write it down next to the design, so the next order uses the same one.',
    confusedWith: [
      { id: 'solder-mask', diff: 'Solder mask covers the copper you do not solder to. The surface finish covers the copper you do solder to.' },
      { id: 'copper-weight', diff: 'Copper weight is how thick the copper itself is. The surface finish is a far thinner coating on top of it.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          p.rect(12, 66, 136, 20, 'f-fr4 s-soft');
          for (const [x, w] of [[12, 10], [50, 16], [94, 16], [138, 10]]) p.rect(x, 62, w, 4, 'f-mask');
          for (const x of [22, 66, 110]) p.rect(x, 60, 28, 6, 'f-cu');
          p.path('M22 60Q36 49 50 60Z', 'f-solder', [22, 54, 50, 60]);
          p.rect(66, 58.2, 28, 1.8, 'f-gold s-pad', { sw: 0.2 });
          p.rect(110, 58.8, 28, 1.2, 'f-shade');
          p.leader(36, 40, 36, 55.6, 'HASL: solder', { anchor: 'middle' });
          p.leader(80, 40, 80, 58.6, 'ENIG: gold', { anchor: 'middle' });
          p.leader(124, 40, 124, 59, 'OSP: clear film', { anchor: 'middle' });
          p.label(36, 96, 'a little uneven', { anchor: 'middle', size: 3.7 });
          p.label(80, 96, 'flat', { anchor: 'middle', size: 3.7 });
          p.label(124, 96, 'flat, short life', { anchor: 'middle', size: 3.7 });
          p.label(80, 79, 'copper pads on the board', { anchor: 'middle', size: 3.8, cls: 'lbl-dark' });
          p.caption('Three coatings on a bare pad. Not to scale');
        },
      },
    ],
  },

  {
    id: 'panel',
    name: 'Panel',
    category: 'making',
    aka: ['panelization', 'array', 'mouse bites', 'V-score', 'V-cut', 'breakaway tab', 'rails'],
    keywords: 'several boards one sheet tabs mouse bites v score cut snap break rails tooling array multiple copies',
    summary: 'Several boards made as one sheet, and broken apart after assembly.',
    definition: 'A panel is one sheet that holds several boards. Factories and assembly machines handle one large sheet more easily than many small boards. The boards are held in the panel in one of two ways. With tab routing, a slot is cut around each board and small tabs are left to hold it. A row of small holes across each tab, called mouse bites, lets it snap off. With V-scoring, a V-shaped groove is cut along straight lines on both sides, and the boards break along it. Strips along the edges, called rails, give the machine something to hold.',
    say: [
      { for: 'Make a panel', text: 'Put {4} of these boards on a panel, {2 × 2}, with {2 mm} between them and {5 mm} rails on all sides.' },
      { for: 'How they separate', text: 'Hold the boards with tabs and mouse bites. Put no tab next to {the USB connector}.' },
      { for: 'Keep parts back', text: 'Keep parts and traces at least {1 mm} from any edge that has a tab or a V-score.' },
    ],
    code: `const Blinker = (props) => (
  <board name={props.name} width="20mm" height="12mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-4} pcbY={0} />
    <led name="LED1" color="red" footprint="0603" pcbX={4} pcbY={0} />
    <trace from="R1.pin2" to="LED1.anode" />
  </board>
)

export default () => (
  <panel
    layoutMode="grid" row={2} col={2}
    boardGap="2mm" edgePadding="5mm"
    panelizationMethod="tab-routing" mouseBites
  >
    <Blinker name="B1" />
    <Blinker name="B2" />
    <Blinker name="B3" />
    <Blinker name="B4" />
  </panel>
)`,
    codeNote: 'A <panel> holds several <board> elements. layoutMode="grid" with row and col arranges them: without it every board needs its own position. boardGap is the space between boards and edgePadding is the width of the rails. panelizationMethod="tab-routing" cuts the slots and leaves the tabs, and mouseBites adds the row of holes. Without panelizationMethod the boards are only placed side by side.',
    fabTip: 'Many factories make the panel for you if you ask, often for free. Build your own only when you need control over it. V-scores work only on straight lines that run right across the panel, so a board with a curved outline needs tabs.',
    confusedWith: [
      { id: 'board-outline', diff: 'The board outline is the shape of one board. A panel is the sheet that several boards are made in.' },
      { id: 'cutout', diff: 'A cutout is a hole that stays in the finished board. The slots of a panel are there only to let the boards come apart.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.rect(8, 10, 104, 86, 'brd', { r: 1.5 });
          // slots cut by a router around each board
          for (const y of [19, 51.5, 84]) p.rect(14, y, 92, 3, 'hole');
          for (const x of [14, 58.5, 103]) p.rect(x, 19, 3, 68, 'hole');
          // tabs that hold each board, with mouse bites
          for (const x of [37.75, 82.25]) {
            for (const y of [19, 51.5, 84]) {
              p.rect(x - 3, y, 6, 3, 'f-board');
              for (const dx of [-1.8, 0, 1.8]) p.circle(x + dx, y + 1.5, 0.55, 'hole');
            }
          }
          for (const y of [36.75, 69.25]) {
            for (const x of [14, 58.5, 103]) {
              p.rect(x, y - 3, 3, 6, 'f-board');
              for (const dy of [-1.8, 0, 1.8]) p.circle(x + 1.5, y + dy, 0.55, 'hole');
            }
          }
          // the four boards
          for (const bx of [17, 61.5]) {
            for (const by of [22, 54.5]) {
              p.chip(bx + 11, by + 9, { len: 8.5, wid: 4.2 });
              p.chip(bx + 11, by + 20, { len: 8.5, wid: 4.2, kind: 'c' });
              p.soic(bx + 29, by + 14.75, { pins: 6, pitch: 4.2, bodyW: 8, padW: 4, padH: 2.2 });
            }
          }
          // rails: holes for the machine
          for (const [x, y] of [[13, 14.5], [107, 14.5], [13, 91.5], [107, 91.5]]) p.hole(x, y, 3.2);
          p.leader(LX, 16, 100, 13.5, 'rail: the machine');
          p.label(LX, 21.5, 'holds the panel');
          p.leader(LX, 38, 104.5, 30, 'slot, cut around');
          p.label(LX, 43.5, 'each board');
          p.leader(LX, 60, 104.5, 69.25, 'tab, with mouse');
          p.label(LX, 65.5, 'bites: snaps here');
          p.leader(LX, 84, 96, 76, 'one board');
          p.caption('Four boards in one panel');
        },
      },
      {
        label: 'V-score',
        draw(p) {
          p.rect(16, 48, 128, 18, 'f-fr4 s-soft');
          p.rect(16, 45, 59, 3, 'f-mask').rect(85, 45, 59, 3, 'f-mask');
          p.rect(16, 66, 59, 3, 'f-mask').rect(85, 66, 59, 3, 'f-mask');
          p.area([[74, 47.6], [86, 47.6], [80, 55]], 'f-stage');
          p.area([[74, 66.4], [86, 66.4], [80, 59]], 'f-stage');
          p.rect(34, 37, 22, 8, 'body').rect(104, 37, 22, 8, 'body');
          p.leader(80, 28, 80, 51, 'V-score: a groove cut from both sides', { anchor: 'middle' });
          p.label(45, 59, 'board 1', { anchor: 'middle', cls: 'lbl-dark' });
          p.label(115, 59, 'board 2', { anchor: 'middle', cls: 'lbl-dark' });
          p.label(80, 84, 'a thin web is left, and the boards snap apart there', { anchor: 'middle', size: 3.8 });
          p.caption('Cut through a V-score. Not to scale');
        },
      },
    ],
  },

  {
    id: 'fiducial',
    name: 'Fiducial',
    category: 'making',
    aka: ['fiducial mark', 'fiducial marker', 'optical target', 'alignment mark'],
    keywords: 'camera machine align find position dot copper mark assembly reference corner optical',
    summary: 'A bare copper dot that the assembly machine uses to find the board.',
    definition: 'A fiducial is a small round dot of bare copper, about 1 mm across, with no solder mask and no other copper around it. The camera of the assembly machine looks for these dots to learn exactly where the board is and how it is turned. Then it can place every part in the right spot. A board needs three, in three corners. Three dots that do not form a symmetric pattern also tell the machine if the board was put in the wrong way round.',
    say: [
      { for: 'Add them', text: 'Add three fiducials, {1 mm} across, in three corners of the board, at least {3 mm} from the edge.' },
      { for: 'Keep them clear', text: 'Keep copper, silkscreen and solder mask {1 mm} away from each fiducial.' },
      { for: 'For a fine chip', text: 'Add two more fiducials at opposite corners of {U1}.' },
    ],
    code: `export default () => (
  <board width="24mm" height="16mm">
    <fiducial name="FID1" padDiameter="1mm" soldermaskPullback="1mm" pcbX={-10} pcbY={6} />
    <fiducial name="FID2" padDiameter="1mm" soldermaskPullback="1mm" pcbX={10} pcbY={6} />
    <fiducial name="FID3" padDiameter="1mm" soldermaskPullback="1mm" pcbX={-10} pcbY={-6} />
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
  </board>
)`,
    codeNote: 'padDiameter is the size of the copper dot. soldermaskPullback is how far the solder mask stays back from it on every side: 0.5 mm if you leave it out. A fiducial gets no solder paste.',
    fabTip: 'If the factory builds the panel, it often adds its own fiducials on the rails. Ask before you spend board space on them. For a board you assemble by hand, fiducials are not needed.',
    confusedWith: [
      { id: 'test-point', diff: 'A fiducial is for a camera and connects to nothing. A test point is for a probe and is part of a net.' },
      { id: 'mounting-hole', diff: 'A fiducial is a dot of copper that a camera reads. A mounting hole is a hole that a screw goes through.' },
      { id: 'via', diff: 'A via is a plated hole that joins layers. A fiducial is flat copper with no hole.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.soic(60, 53);
          for (const [x, y] of [[20, 22], [100, 22], [20, 84]]) {
            p.circle(x, y, 5, 'f-fr4');
            p.circle(x, y, 2.2, 'pad');
          }
          p.leader(LX, 18, 101, 21.6, 'fiducial: a bare');
          p.label(LX, 23.5, 'copper dot, 1 mm');
          p.leader(LX, 40, 103.6, 24.6, 'no solder mask');
          p.label(LX, 45.5, 'around it');
          p.leader(LX, 80, 22.2, 84, 'three of them, in');
          p.label(LX, 85.5, 'three corners');
          p.caption('Marks for the camera of the machine');
        },
      },
    ],
  },

  {
    id: 'test-point',
    name: 'Test point',
    category: 'making',
    aka: ['TP', 'test pad', 'probe point', 'probe pad'],
    keywords: 'measure probe multimeter oscilloscope debug pad access signal ground clip programming pogo pin',
    summary: 'A bare pad on a net, put there so a probe can touch it.',
    definition: 'A test point is a small bare pad or pin connected to one net, made so that you can touch it with the probe of a meter or an oscilloscope. Without test points, the only places to measure are the pins of the parts, and those are often tiny or hidden under the part. Give a test point to every power rail, to ground, and to each signal you will want to see while the board is being tested. Each one gets a name in the silkscreen.',
    say: [
      { for: 'The usual set', text: 'Add test points for {3V3, 5V and GND}, and for {SDA, SCL, TX and RX}. Name each one in silkscreen.' },
      { for: 'Size and place', text: 'Make the test points round pads, {1.5 mm} across, on the top side, at least {2.5 mm} apart.' },
      { for: 'For a clip', text: 'Make the {GND} test point a through-hole loop that a probe clip can hold.' },
      { for: 'Programming pads', text: 'Add a row of {5} pads, {2.54 mm} apart, for {SWDIO, SWCLK, RESET, 3V3 and GND}.' },
    ],
    code: `export default () => (
  <board width="24mm" height="12mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-6} pcbY={0} />
    <testpoint name="TP1" footprintVariant="pad" padShape="circle" padDiameter="1.5mm" pcbX={2} pcbY={0} />
    <testpoint name="TP2" footprintVariant="through_hole" holeDiameter="1mm" pcbX={8} pcbY={0} />
    <trace from="R1.pin2" to="TP1.pin1" />
    <trace from="R1.pin1" to="TP2.pin1" />
  </board>
)`,
    codeNote: 'A <testpoint> has one pin, pin1. footprintVariant="pad" gives a flat pad: round with padDiameter, or padShape="rect" with width and height. footprintVariant="through_hole" gives a plated hole with holeDiameter. A test point is not a part to buy, so it does not appear in the bill of materials.',
    fabTip: 'A flat pad costs nothing. A test pin that you solder in is a part that must be bought and placed. Factories that test boards with a bed of spring pins want all test points on one side, usually the bottom.',
    confusedWith: [
      { id: 'fiducial', diff: 'A test point is part of a net and is touched by a probe. A fiducial connects to nothing and is read by a camera.' },
      { id: 'via', diff: 'A via exists to change layer. An exposed via can serve as a test point, but a real test point is bigger and has a name.' },
      { id: 'pad', diff: 'A pad holds a part. A test point is a pad with no part on it, kept free for a probe.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[44.1, 41.5], [94.26, 41.5]], { w: 1.6 });
          p.trace([[44.1, 51.5], [50, 51.5], [66, 67.5], [66, 74]], { w: 1.6 });
          p.soic(34, 49);
          p.chip(98, 41.5);
          p.circle(66, 41.5, 4, 'pad');
          p.pth(66, 76, { d: 9, hole: 4 });
          p.silkText(66, 34.4, 'TP1', { size: 3.6 });
          p.silkText(66, 87.5, 'GND', { size: 3.6 });
          p.leader(LX, 20, 71.5, 32.8, 'its name, printed');
          p.leader(LX, 40, 69.4, 41, 'test point: a bare');
          p.label(LX, 45.5, 'pad on the net');
          p.leader(LX, 72, 70.2, 75.6, 'through-hole point:');
          p.label(LX, 77.5, 'a clip can hold it');
          p.caption('Places made for a probe');
        },
      },
    ],
  },
];
