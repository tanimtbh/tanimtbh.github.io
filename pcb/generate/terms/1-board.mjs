// The board itself: its outline, layers, coatings and holes.

const B = [8, 10, 104, 86]; // the usual board, leaving room for labels on the right
const LX = 117; // where those labels start

/**
 * A flat sheet seen at a slant, for layers that are pulled apart.
 * Returns a function that turns a place on the sheet (u across, v down) into a place on the canvas.
 */
function sheet(p, x, y, w, h, skew, cls) {
  p.area([[x + skew, y], [x + skew + w, y], [x + w, y + h], [x, y + h]], cls);
  return (u, v) => [x + u + skew * (1 - v / h), y + v];
}

export default [
  {
    id: 'board-outline',
    name: 'Board outline',
    category: 'board',
    aka: ['board edge', 'edge cuts', 'board shape', 'board size'],
    keywords: 'width height size shape rectangle corner radius rounded profile dimension contour',
    summary: 'The shape and size of the board: the line where the factory cuts it out.',
    definition: 'The outline is the outer edge of the board. The factory cuts along it. Most boards are a rectangle, given by a width and a height, often with rounded corners. An outline can also be any closed shape, given as a list of corner points. Everything else on the board must stay inside it, with a small gap to the edge.',
    say: [
      { for: 'A rectangle', text: 'The board is {40 × 25 mm}, with {3 mm} rounded corners.' },
      { for: 'As small as possible', text: 'Make the board as small as the parts allow, and tell me the size you ended with.' },
      { for: 'To fit a case', text: 'The board must fit a case that is {42 × 27 mm} inside. Leave {0.5 mm} of room on every side.' },
      { for: 'Any shape', text: 'The outline is an L shape. Its corner points, in order, are {(-15, -10), (15, -10), (15, 2), (3, 2), (3, 10), (-15, 10)}.' },
    ],
    code: `export default () => (
  <board width="40mm" height="25mm" borderRadius="3mm">
    <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
  </board>
)`,
    codeNote: 'width and height make a rectangle around the centre of the board, and borderRadius rounds its corners. For any other shape, leave them out and give outline={[{ x: -15, y: -10 }, { x: 15, y: -10 }, ...]}: the corner points in order, in mm from the centre.',
    fabTip: 'A board up to 100 × 100 mm is the cheapest size at most factories. The outline is cut with a round tool, so an inside corner always comes out rounded, with a radius of about 1 mm.',
    confusedWith: [
      { id: 'cutout', diff: 'The outline is the outer edge of the board. A cutout is a hole inside it.' },
      { id: 'panel', diff: 'The outline is the edge of one board. A panel is a larger sheet that holds several boards while they are made.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(44, 26, 100, 62, { r: 6 });
          p.soic(80, 56);
          p.chip(116, 44);
          p.chip(116, 68, { kind: 'c' });
          p.dim([44, 26], [144, 26], 'width: 40 mm', { off: 8, side: -1 });
          p.dim([44, 26], [44, 88], 'height: 25 mm', { off: 8 });
          p.leader(112, 100, 141.5, 86, 'corner radius: 3 mm', { anchor: 'middle' });
          p.caption('The outline is where the board is cut out');
        },
      },
      {
        label: 'Any shape',
        draw(p) {
          const points = [[26, 16], [126, 16], [126, 54], [86, 54], [86, 96], [26, 96]];
          p.area(points, 'brd');
          p.soic(56, 56);
          p.chip(104, 34);
          for (const [x, y] of points) p.circle(x, y, 1.7, 'f-white s-ink', { note: true });
          p.leader(96, 74, 87.5, 55.5, 'corner points, given');
          p.label(96, 79.5, 'in order, one by one');
          p.caption('An outline can have any shape');
        },
      },
    ],
  },

  {
    id: 'layers',
    name: 'Layers',
    category: 'board',
    aka: ['copper layers', 'layer count', 'two-layer board', 'four-layer board', 'multilayer'],
    keywords: 'top bottom inner inner1 inner2 2 4 6 layer sheet copper side signal plane',
    summary: 'The sheets of copper in a board. Traces on different layers do not touch.',
    definition: 'A layer is one sheet of copper in the board. A simple board has two: one on the top and one on the bottom. A four-layer board has two more inside it. Each layer is a separate drawing of traces, and insulating board material lies between them. A trace on one layer can cross a trace on another layer without touching it. Only a via joins layers.',
    say: [
      { for: 'A simple board', text: 'This is a {2}-layer board. Keep all parts on the top layer.' },
      { for: 'Four layers', text: 'Use {4} layers: signals on the top and bottom, a solid ground plane on inner layer 1, and power on inner layer 2.' },
      { for: 'Choose a layer', text: 'Route {the long traces} on the bottom layer, and keep the top layer for the short ones around the chips.' },
      { for: 'Ask what was done', text: 'Tell me which layer each trace is on, and how many vias there are.' },
    ],
    code: `export default () => (
  <board width="20mm" height="12mm" layers={4}>
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-6} pcbY={0} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} layer="bottom" />
    <trace from="R1.pin2" to="R2.pin1" />
  </board>
)`,
    codeNote: 'layers on <board> is the number of copper layers: 1, 2, 4, 6, 8 or 10. Without it the board has 2. The layers are named "top", "inner1", "inner2" and "bottom". In the tscircuit viewer the top layer is drawn red and the bottom layer blue.',
    fabTip: 'Two layers are the cheapest and are enough for most small boards. Four layers cost more, but they give you a whole layer for ground, which makes radio and fast signals work and makes a crowded board much easier to route.',
    confusedWith: [
      { id: 'stackup', diff: 'Layers are the sheets of copper. The stackup is the full recipe: every sheet of copper and of insulation, with its thickness.' },
      { id: 'top-bottom-side', diff: 'A layer is a sheet of copper for traces. A side is where parts are soldered on. Parts can only sit on the two outer sides.' },
    ],
    pictures: [
      {
        label: 'Pulled apart',
        draw(p) {
          const rows = [
            ['top', 'signals and parts'],
            ['inner1', 'ground plane'],
            ['inner2', 'power plane'],
            ['bottom', 'signals'],
          ];
          const places = rows.map((row, i) => sheet(p, 12, 12 + i * 24, 64, 16, 24, 'f-pp s-soft'));
          const [top, in1, in2, bottom] = places;
          // top: traces and pads
          p.line([top(6, 4), top(26, 4), top(32, 10), top(44, 10)], 'cu', { w: 1.5 });
          p.line([top(8, 12), top(22, 12)], 'cu', { w: 1.5 });
          p.line([top(48, 4), top(58, 4)], 'cu', { w: 1.5 });
          // inner layers: almost solid copper
          p.area([in1(2, 1.5), in1(62, 1.5), in1(62, 14.5), in1(2, 14.5)], 'f-cui');
          p.area([in2(2, 1.5), in2(30, 1.5), in2(30, 14.5), in2(2, 14.5)], 'f-cui');
          p.area([in2(33, 1.5), in2(62, 1.5), in2(62, 14.5), in2(33, 14.5)], 'f-cui');
          // bottom: traces
          p.line([bottom(6, 11), bottom(30, 11), bottom(36, 5), bottom(58, 5)], 'cu-b', { w: 1.5 });
          p.line([bottom(40, 12), bottom(58, 12)], 'cu-b', { w: 1.5 });
          // one via that goes through all four
          p.line([top(44, 10), bottom(44, 10)], 'f-none s-ink dash', { w: 0.5 });
          for (const at of places) p.circle(...at(44, 10), 1.9, 'pad');
          rows.forEach(([name, use], i) => {
            p.label(106, 20 + i * 24, name);
            p.label(106, 25 + i * 24, use, { size: 3.6 });
          });
          p.leader(40, 108, 63.6, 96, 'a via joins the layers', { anchor: 'middle' });
          p.caption('Four copper layers, pulled apart');
        },
      },
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.trace([[36, 18], [36, 72]], { layer: 'bottom' });
          p.trace([[84, 18], [84, 72]], { layer: 'bottom' });
          p.trace([[16, 84], [64, 84]], { layer: 'bottom' });
          p.trace([[16, 30], [104, 30]]);
          p.trace([[16, 50], [60, 50], [76, 66], [104, 66]]);
          p.trace([[64, 84], [104, 84]]);
          p.via(64, 84);
          p.leader(LX, 26, 98, 30, 'top layer');
          p.leader(LX, 44, 84.6, 42, 'bottom layer');
          p.leader(LX, 60, 84.6, 65.4, 'they cross, but');
          p.label(LX, 65.5, 'do not touch');
          p.leader(64, 104, 64, 86.6, 'a via: the only place they join', { anchor: 'middle' });
          p.caption('Two layers, seen from above');
        },
      },
    ],
  },

  {
    id: 'stackup',
    name: 'Stackup',
    category: 'board',
    aka: ['layer stack', 'layer stackup', 'board thickness', 'build-up'],
    keywords: 'cross section core prepreg fr4 fr-4 thickness 1.6 mm dielectric material laminate',
    summary: 'The list of every sheet in the board, from top to bottom, with its thickness.',
    definition: 'The stackup is the board seen from the side: every sheet of copper and of insulation, in order, with its thickness. The insulation is glass fibre and resin, called FR-4. A stiff sheet of it is a core, and a thinner sheet that glues the layers together is prepreg. On the outside come solder mask and silkscreen. The usual total thickness is 1.6 mm. The stackup matters when a trace needs an exact impedance, because that depends on the distance to the next copper layer.',
    say: [
      { for: 'Use a standard one', text: 'Use the standard {1.6 mm}, {4}-layer stackup of {JLCPCB}. Tell me the distance from the top layer to inner layer 1.' },
      { for: 'A thin board', text: 'The board must be {0.8 mm} thick, because {it slides into a slot in the case}.' },
      { for: 'For impedance', text: 'Work out the width of a 50 Ω trace for this stackup: {0.2 mm} of prepreg between the top layer and the ground plane.' },
    ],
    table: {
      caption: 'Typical stackups for a 1.6 mm board, in mm',
      columns: ['Sheet', '2 layers', '4 layers'],
      rows: [
        ['Top copper', '0.035', '0.035'],
        ['Insulation', 'core, 1.5', 'prepreg, 0.2'],
        ['Inner copper 1', 'none', '0.0175'],
        ['Insulation', 'none', 'core, 1.1'],
        ['Inner copper 2', 'none', '0.0175'],
        ['Insulation', 'none', 'prepreg, 0.2'],
        ['Bottom copper', '0.035', '0.035'],
      ],
      note: 'Solder mask adds about 0.02 mm on each side. Every factory publishes its own stackups. Use theirs when a number matters.',
    },
    code: `export default () => (
  <board width="20mm" height="12mm" layers={4} thickness="1.6mm" material="fr4">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
  </board>
)`,
    render: false,
    codeNote: 'thickness and material on <board> are passed on to the factory files. Without them the board is 1.6 mm of FR-4. material can be "fr4", "fr1" or "flex". tscircuit does not set the thickness of each inner sheet: that comes from the stackup of the factory.',
    fabTip: 'Stay with the standard stackup of your factory. A custom one costs more and takes longer. Other common thicknesses are 0.8, 1.0 and 1.2 mm.',
    confusedWith: [
      { id: 'layers', diff: 'Layers counts only the copper sheets. The stackup also lists the insulation between them and every thickness.' },
      { id: 'copper-weight', diff: 'Copper weight is the thickness of one copper sheet. The stackup is the whole board.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          const [x, w] = [24, 80];
          p.rect(32, 13, 16, 3, 'f-silk s-ink', { sw: 0.3 });
          p.rect(x, 16, w, 3, 'f-mask').rect(56, 19, 10, 5, 'f-mask');
          p.rect(x, 19, 32, 5, 'f-cu').rect(66, 19, 38, 5, 'f-cu');
          p.rect(x, 24, w, 14, 'f-pp');
          p.rect(x, 38, w, 5, 'f-cui');
          p.rect(x, 43, w, 22, 'f-fr4');
          p.rect(x, 65, w, 5, 'f-cui');
          p.rect(x, 70, w, 14, 'f-pp');
          p.rect(x, 84, 26, 5, 'f-cub').rect(60, 84, 44, 5, 'f-cub');
          p.rect(x, 89, w, 3, 'f-mask').rect(50, 84, 10, 5, 'f-mask');
          p.rect(x, 16, w, 76, 'f-none s-soft', { sw: 0.3 });
          p.dim([x, 16], [x, 92], '1.6 mm', { off: 6 });
          const names = [
            ['silkscreen', 10, 47, 14.4], ['solder mask', 18.5, 102, 17.5], ['copper: top', 27, 102, 21.5],
            ['prepreg', 35.5, 102, 31], ['copper: inner1', 44, 102, 40.5], ['core', 56, 102, 54],
            ['copper: inner2', 68, 102, 67.5], ['prepreg', 78, 102, 77], ['copper: bottom', 88, 102, 86.5],
            ['solder mask', 97, 102, 90.5],
          ];
          for (const [text, y, px, py] of names) p.leader(112, y, px, py, text);
          p.caption('A four-layer board, cut through. Not to scale');
        },
      },
    ],
  },

  {
    id: 'copper-weight',
    name: 'Copper weight',
    category: 'board',
    aka: ['copper thickness', '1 oz copper', '2 oz copper', 'ounce'],
    keywords: 'oz ounce thick thin 35 micron um current heat heavy copper',
    summary: 'How thick the copper layer is. It is given in ounces: 1 oz is 0.035 mm.',
    definition: 'Copper weight says how thick the copper on a layer is. It is given in ounces (oz): the weight of copper spread over one square foot. 1 oz copper is 0.035 mm thick, and it is the usual choice. 2 oz copper is twice as thick, so a trace of the same width carries about 1.6 times the current. Inner layers often have 0.5 oz copper. The copper weight is the same for a whole layer. You choose it when you order the board.',
    say: [
      { for: 'The usual choice', text: 'Use 1 oz copper on the outer layers.' },
      { for: 'For high current', text: 'The motor traces carry {6 A}. Would 2 oz copper let me keep them {2 mm} wide? Show the calculation.' },
      { for: 'Rules that follow', text: 'This board will be made with 2 oz copper, so use at least {0.2 mm} trace width and {0.2 mm} clearance.' },
    ],
    table: {
      caption: 'Copper weight and thickness',
      columns: ['Weight', 'Thickness', 'Where it is used'],
      rows: [
        ['0.5 oz', '0.0175 mm', 'Inner layers'],
        ['1 oz', '0.035 mm', 'Outer layers: the usual choice'],
        ['2 oz', '0.070 mm', 'Power boards and motor drivers'],
      ],
    },
    fabTip: 'Thick copper cannot be etched as finely as thin copper. With 2 oz, the smallest trace width and gap are about twice those of 1 oz, and the board costs more. Check the limits of your factory.',
    confusedWith: [
      { id: 'trace-width', diff: 'Copper weight is how thick the copper is, the same for a whole layer. Trace width is how wide one trace is, and you choose it for each trace.' },
      { id: 'stackup', diff: 'Copper weight is one line of the stackup. The stackup lists every sheet in the board.' },
    ],
    pictures: [
      {
        label: 'Cut through',
        draw(p) {
          const kinds = [[12, 2.5, '0.5 oz', '0.0175 mm', 'inner layers'], [60, 5, '1 oz', '0.035 mm', 'the usual choice'], [108, 10, '2 oz', '0.070 mm', 'high current']];
          for (const [x, h, weight, thick, use] of kinds) {
            p.rect(x, 66, 40, 18, 'f-fr4 s-soft');
            p.rect(x + 9, 66 - h, 22, h, 'f-cu');
            p.label(x + 20, 40, weight, { anchor: 'middle' });
            p.label(x + 20, 46, thick, { anchor: 'middle', size: 3.7 });
            p.label(x + 20, 93, use, { anchor: 'middle', size: 3.7 });
          }
          p.caption('The same trace in three copper weights. Not to scale');
        },
      },
    ],
  },

  {
    id: 'solder-mask',
    name: 'Solder mask',
    category: 'board',
    aka: ['solder resist', 'soldermask', 'mask', 'mask opening', 'mask expansion'],
    keywords: 'green coating lacquer cover protect opening expansion dam colour color black blue red',
    summary: 'The thin coloured coating over the copper. It is left open only where you solder.',
    definition: 'Solder mask is the thin coating that gives a board its colour, usually green. It covers the traces, so they do not corrode, and so solder does not stick to them or join them by mistake. Where a part is soldered, the mask has an opening, a little larger than the pad. The thin strip of mask left between two pads that are close together is called a mask dam. It keeps the solder of one pad away from the next.',
    say: [
      { for: 'Choose the colour', text: 'Use {black} solder mask with white silkscreen.' },
      { for: 'Open an area', text: 'Leave the solder mask off a {4 × 2 mm} area of {the GND trace} near the edge, so I can clip a probe to it.' },
      { for: 'Cover a pad', text: 'Cover {the unused pads under U1} with solder mask, so nothing can short against them.' },
      { for: 'Between fine pads', text: 'Keep at least {0.1 mm} of mask between two pads that are next to each other.' },
    ],
    code: `export default () => (
  <board width="20mm" height="12mm" solderMaskColor="blue">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} pcbY={0} />
    <pcbsoldermaskopening shape="rect" layer="top" width="4mm" height="2mm" pcbX={5} pcbY={0} />
  </board>
)`,
    renderOptions: { showSolderMask: true },
    codeNote: 'Every pad gets its mask opening by itself. solderMaskColor on <board> can be "green", "red", "blue", "purple", "black", "white" or "yellow". On a pad, solderMaskMargin makes its opening larger on every side, and coveredWithSolderMask closes it. <pcbsoldermaskopening> removes the mask from an area that has no pad. Its shape is "rect", "circle" or "polygon".',
    fabTip: 'Green is the cheapest colour and the easiest for the factory to print finely. A mask dam needs to be about 0.1 mm wide. Between pads that are closer than that, the factory removes the mask, and solder bridges become more likely.',
    confusedWith: [
      { id: 'silkscreen', diff: 'Solder mask is the coloured coating that protects the copper. Silkscreen is the ink printed on top of it, for text and outlines.' },
      { id: 'solder-paste', diff: 'Solder mask keeps solder away. Solder paste is the solder itself, printed onto the pads.' },
      { id: 'tented-via', diff: 'Solder mask covers the whole board. Tenting means it is allowed to cover a via as well.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.rect(28, 30, 16, 24, 'f-fr4', { r: 0.8 }).rect(52, 30, 16, 24, 'f-fr4', { r: 0.8 });
          p.trace([[36, 50], [36, 86]]).trace([[60, 50], [60, 86]]);
          p.pad(36, 42, 12, 20).pad(60, 42, 12, 20);
          p.leader(LX, 24, 67, 31.5, 'opening: no mask');
          p.leader(LX, 42, 63, 42, 'pad: bare copper');
          p.leader(LX, 66, 61, 70, 'mask covers');
          p.label(LX, 71.5, 'the trace');
          p.leader(48, 104, 48, 44, 'mask dam between the pads', { anchor: 'middle' });
          p.caption('Solder mask is open only at the pads');
        },
      },
      {
        label: 'Cut through',
        draw(p) {
          p.rect(16, 60, 128, 26, 'f-fr4 s-soft');
          p.rect(26, 54, 20, 6, 'f-cu');
          p.rect(66, 54, 28, 6, 'f-pad s-pad', { sw: 0.25 });
          p.area([[16, 60], [16, 56], [22, 56], [22, 50], [50, 50], [50, 56], [60, 56], [60, 60], [46, 60], [46, 54], [26, 54], [26, 60]], 'f-mask');
          p.rect(100, 56, 44, 4, 'f-mask');
          p.dim([60, 56], [100, 56], 'opening in the mask', { off: 12, side: -1 });
          p.leader(34, 28, 36, 49.5, 'mask over a trace', { anchor: 'middle' });
          p.leader(112, 40, 97, 58, 'gap: about 0.05 mm');
          p.label(80, 68, 'pad: bare copper', { anchor: 'middle', cls: 'lbl-dark' });
          p.label(132, 76, 'board', { anchor: 'middle', cls: 'lbl-dark' });
          p.caption('Cut through a pad and a trace. Not to scale');
        },
      },
    ],
  },

  {
    id: 'silkscreen',
    name: 'Silkscreen',
    category: 'board',
    aka: ['silk', 'legend', 'overlay', 'printed text'],
    keywords: 'ink white text label name outline logo marking print polarity pin 1 dot',
    summary: 'The ink printed on the board: names, outlines and marks for people to read.',
    definition: 'Silkscreen is the ink printed on top of the solder mask, usually white. It is for people, not for the circuit. It shows the name of each part, an outline of where the part sits, a mark at pin 1, and a mark for the plus side of parts that have one. You can add your own text, such as the name and version of the board, or a label beside each pin of a connector.',
    say: [
      { for: 'Your own text', text: 'Print "{SENSOR v1.2}" on the top side, {1.5 mm} tall, near the bottom edge.' },
      { for: 'Label a connector', text: 'Label every pin of {J1} on the silkscreen: {GND, 3V3, SDA, SCL}.' },
      { for: 'Keep it readable', text: 'Make sure no silkscreen text lies on a pad or under a part, and that every part name can still be read after the parts are soldered on.' },
      { for: 'Marks that prevent mistakes', text: 'Mark pin 1 of every chip, and the plus side of every part that has one.' },
    ],
    code: `export default () => (
  <board width="24mm" height="14mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={-6} pcbY={0} />
    <led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />
    <silkscreentext text="BLINK v1.0" pcbX={0} pcbY={5} fontSize="1.2mm" />
    <silkscreentext text="made by me" pcbX={0} pcbY={-5} fontSize="1mm" layer="bottom" />
    <trace from="R1.pin2" to="LED1.anode" />
  </board>
)`,
    codeNote: 'Every footprint brings its own outline, and tscircuit prints the name of the part beside it. <silkscreentext> adds your own words: fontSize is the height of the letters, and layer="bottom" prints on the other side. Part names are only 0.4 mm tall unless you ask for more: pcbStyle={{ silkscreenFontSize: "1mm" }} on <board> sets their height.',
    fabTip: 'Text lower than about 1 mm, or with lines thinner than 0.15 mm, may not print clearly. The factory removes any ink that would land on a pad, so text placed over a pad comes out with pieces missing.',
    confusedWith: [
      { id: 'solder-mask', diff: 'Silkscreen is ink for text and outlines. Solder mask is the coloured coating underneath it.' },
      { id: 'reference-designator', diff: 'A reference designator is the name of a part, such as R1. Silkscreen is the ink that prints that name on the board.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          // a chip footprint with its outline, pin 1 mark and name
          p.soic(78, 40, { body: false });
          p.silk([[73, 31], [83, 31], [83, 49], [73, 49]], { close: true });
          p.circle(67.9, 28.2, 1, 'f-silk');
          p.silkText(78, 57, 'U1', { size: 4 });
          // a resistor
          p.chip(30, 32, { body: false });
          p.silk([[28.6, 28], [31.4, 28]]).silk([[28.6, 36], [31.4, 36]]);
          p.silkText(30, 24.5, 'R1', { size: 3.6 });
          // an LED, with a bracket at one end
          p.chip(30, 62, { body: false });
          p.silk([[24, 57.4], [37.6, 57.4], [37.6, 66.6], [24, 66.6]]);
          p.silkText(30, 54.5, 'LED1', { size: 3.6 });
          p.silkText(58, 86, 'BLINK v1.0', { size: 6.5 });
          p.leader(LX, 20, 69, 28, 'pin 1 mark');
          p.leader(LX, 36, 83, 38, 'outline of the part');
          p.leader(LX, 52, 82.6, 55.6, 'name of the part');
          p.leader(LX, 68, 37.6, 62, 'polarity mark');
          p.leader(LX, 86, 77, 84, 'your own text');
          p.caption('Silkscreen: ink for people to read');
        },
      },
    ],
  },

  {
    id: 'origin-coordinates',
    name: 'Origin and coordinates',
    category: 'board',
    aka: ['origin', 'pcbX and pcbY', 'position', 'X and Y'],
    keywords: 'centre center zero x y coordinate position place where mm axis left right up down edge calc',
    summary: 'How a position on the board is written: X and Y in mm, from the centre.',
    definition: 'Every position on the board is two numbers, X and Y, in millimetres. They are measured from the origin, the point (0, 0). In tscircuit the origin is the centre of the board. X grows to the right and Y grows upward, with the board seen from its top side. The position of a part is the position of its centre. On a 40 × 25 mm board, the right edge is at X = 20 and the top edge is at Y = 12.5.',
    say: [
      { for: 'State the system once', text: 'All positions I give are in mm from the centre of the board. +X is right and +Y is up, seen from the top.' },
      { for: 'An exact place', text: 'Put {J1} at X = {-17}, Y = {0}.' },
      { for: 'From an edge', text: 'Place {the USB connector} with its left edge {1 mm} inside the left edge of the board, centred in Y.' },
      { for: 'Ask where things are', text: 'Give me a table of every part with its X, Y, rotation and side.' },
    ],
    code: `export default () => (
  <board width="40mm" height="25mm">
    <resistor name="R1" resistance="1k" footprint="0603" pcbX={10} pcbY={5} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={-10} pcbY={-5} />
    <chip name="U1" footprint="soic8" pcbLeftEdgeX="calc(board.minX + 2mm)" pcbY={0} />
  </board>
)`,
    codeNote: 'pcbX and pcbY place the centre of a part, in mm from the centre of the board. To measure from an edge of the board instead, use calc(): "calc(board.minX + 2mm)" is 2 mm inside the left edge. board.minX, board.maxX, board.minY and board.maxY are the four edges. pcbLeftEdgeX, pcbRightEdgeX, pcbTopEdgeY and pcbBottomEdgeY place an edge of the part, not its centre.',
    note: 'Many other PCB programs put the origin in a corner and let Y grow downward. When you copy positions from a drawing or from another program, say where its origin is and which way its Y points.',
    confusedWith: [
      { id: 'placement', diff: 'Coordinates are how a position is written. Placement is the work of deciding where each part should go.' },
      { id: 'rotation', diff: 'X and Y say where the centre of a part is. Rotation says which way the part is turned around that centre.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          const [cx, cy] = [64, 51.25];
          p.board(14, 20, 100, 62.5);
          p.line([[89, 38.75], [89, cy]], 'f-none s-white dash', { w: 0.4 });
          p.line([[cx, 38.75], [89, 38.75]], 'f-none s-white dash', { w: 0.4 });
          p.line([[cx, cy], [106, cy]], 'f-none s-white', { w: 0.6 });
          p.line([[cx, cy], [cx, 27]], 'f-none s-white', { w: 0.6 });
          p.chip(89, 38.75);
          p.circle(cx, cy, 1.4, 'f-white');
          p.arrow([cx, cy], [108, cy], 'arw-on').arrow([cx, cy], [cx, 25], 'arw-on');
          p.label(107, 57, '+X', { anchor: 'end', size: 3.8, cls: 'lbl-on' });
          p.label(67, 29, '+Y', { size: 3.8, cls: 'lbl-on' });
          p.label(62, 57, '(0, 0)', { anchor: 'end', size: 3.8, cls: 'lbl-on' });
          p.label(76.5, 36.5, '10', { anchor: 'middle', size: 3.4, cls: 'lbl-on' });
          p.label(91, 47.5, '5', { size: 3.4, cls: 'lbl-on' });
          p.label(14, 16.5, '(-20, 12.5)', { size: 3.7 });
          p.label(114, 88, '(20, -12.5)', { anchor: 'end', size: 3.7 });
          p.leader(119, 32, 94.5, 38.75, 'R1 is at');
          p.label(119, 37.5, 'pcbX={10}');
          p.label(119, 43, 'pcbY={5}');
          p.label(64, 98, 'a 40 × 25 mm board', { anchor: 'middle' });
          p.caption('Positions are measured from the centre');
        },
      },
    ],
  },

  {
    id: 'top-bottom-side',
    name: 'Top side and bottom side',
    category: 'board',
    aka: ['component side', 'solder side', 'front and back', 'double-sided'],
    keywords: 'top bottom flip mirror mirrored back front underside other side layer both sides',
    summary: 'The two faces of the board. The bottom is seen mirrored.',
    definition: 'A board has two sides where parts can be soldered: the top and the bottom. Most parts go on the top. A PCB is always drawn as seen from the top, as if the board were made of glass. So a part on the bottom is seen through the board, and when you turn the real board over, left and right are swapped. Positions are still given in the top view, also for parts on the bottom.',
    say: [
      { for: 'One side only', text: 'All parts go on the top side. Nothing on the bottom, so the board can lie flat in its case.' },
      { for: 'Move a part', text: 'Put {the battery holder} on the bottom side, under {U1}.' },
      { for: 'Avoid confusion', text: 'Positions I give are always in the top view, also for parts on the bottom side.' },
      { for: 'Ask', text: 'List the parts that are on the bottom side.' },
    ],
    code: `export default () => (
  <board width="24mm" height="14mm">
    <chip name="U1" footprint="soic8" pcbX={-5} pcbY={0} />
    <chip name="U2" footprint="soic8" pcbX={5} pcbY={0} layer="bottom" />
  </board>
)`,
    codeNote: 'layer="bottom" puts a part on the bottom side. tscircuit mirrors its footprint for you: in the picture, pin 1 of U2 is on the right. pcbX and pcbY stay in the top view.',
    fabTip: 'Assembly on one side is cheaper, because parts on both sides mean two passes through the machines. If the bottom is needed, keep the large and heavy parts on the top.',
    confusedWith: [
      { id: 'layers', diff: 'A side is where parts sit. A layer is a sheet of copper. A four-layer board still has only two sides.' },
      { id: 'rotation', diff: 'Moving a part to the bottom mirrors it. Rotating a part turns it but keeps it on the same side.' },
    ],
    pictures: [
      {
        label: 'Both sides',
        draw(p) {
          // seen from the top
          p.board(8, 22, 64, 56);
          p.hole(16, 30, 6);
          p.chip(56, 52, { body: false, padCls: 'pad-b faint' });
          p.rect(48.5, 46.5, 15, 11, 'f-none s-white dash', { r: 1 });
          p.soic(28, 54);
          p.silkText(28, 41, 'U1', { size: 3.4 });
          // turned over
          p.board(88, 22, 64, 56);
          p.hole(144, 30, 6);
          p.soic(132, 54, { body: false, padCls: 'pad faint' });
          p.rect(125.5, 44, 13, 20, 'f-none s-white dash', { r: 1 });
          p.chip(104, 52, { kind: 'c', padCls: 'pad-b' });
          p.silkText(104, 45.5, 'C5', { size: 3.4 });
          p.arrow([74, 50], [86, 50]);
          p.label(80, 46, 'flip', { anchor: 'middle', size: 3.8 });
          p.label(40, 87, 'seen from the top', { anchor: 'middle' });
          p.label(40, 93, 'C5 is on the other side', { anchor: 'middle', size: 3.6 });
          p.label(120, 87, 'seen from the bottom', { anchor: 'middle' });
          p.label(120, 93, 'left and right are swapped', { anchor: 'middle', size: 3.6 });
          p.caption('Turn the board over and it is mirrored');
        },
      },
    ],
  },

  {
    id: 'mounting-hole',
    name: 'Mounting hole',
    category: 'board',
    aka: ['screw hole', 'fixing hole', 'NPTH', 'non-plated hole'],
    keywords: 'screw bolt m2 m2.5 m3 m4 standoff case enclosure fix hold corner head washer',
    summary: 'A hole for a screw that holds the board in its case.',
    definition: 'A mounting hole is a hole for a screw or a standoff that fixes the board to a case. It is a little larger than the screw, so the screw passes through freely. The head of the screw covers a circle around the hole, and no trace or part may be inside that circle. Most boards have one mounting hole near each corner. Their positions must match the case exactly, so give them as numbers.',
    say: [
      { for: 'Four corners', text: 'Add four mounting holes for M3 screws, {3.2 mm} in diameter, {3 mm} in from each corner.' },
      { for: 'Room for the head', text: 'Keep all copper and all parts at least {3.5 mm} away from the centre of each mounting hole.' },
      { for: 'Match a case', text: 'The hole centres must match the case: {(-17, 9.5), (17, 9.5), (-17, -9.5) and (17, -9.5)} mm.' },
      { for: 'Check', text: 'Tell me the distance between the hole centres, in X and in Y.' },
    ],
    table: {
      caption: 'Holes for common screws, in mm',
      columns: ['Screw', 'Hole', 'Head', 'Keep clear'],
      rows: [
        ['M2', '2.2', '3.8', '4.8'],
        ['M2.5', '2.7', '4.5', '5.5'],
        ['M3', '3.2', '5.5', '6.5'],
        ['M4', '4.3', '7.0', '8.0'],
      ],
      note: 'Head is the diameter of a socket-head screw. Keep clear is the diameter of the circle to leave free: the head plus 1 mm. A washer needs more. M2.5 fits the holes of a Raspberry Pi.',
    },
    code: `export default () => (
  <board width="40mm" height="30mm">
    <hole diameter="3.2mm" pcbX={-16} pcbY={11} />
    <hole diameter="3.2mm" pcbX={16} pcbY={11} />
    <hole diameter="3.2mm" pcbX={-16} pcbY={-11} />
    <hole diameter="3.2mm" pcbX={16} pcbY={-11} />
  </board>
)`,
    codeNote: '<hole> is a plain drilled hole with no copper. diameter is the finished size of the hole. A hole with a copper ring around it is a <platedhole>, with holeDiameter and outerDiameter.',
    fabTip: 'Leave about 1 mm or more of board between the hole and the edge, or the corner can break off. A hole without copper is called NPTH in the factory files.',
    confusedWith: [
      { id: 'via', diff: 'A mounting hole is large and holds a screw. A via is tiny, plated with copper, and carries a signal between layers.' },
      { id: 'through-hole', diff: 'A mounting hole holds a screw and usually has no copper. A plated through hole holds the leg of a part and is soldered.' },
      { id: 'cutout', diff: 'A mounting hole is round and drilled. A cutout is milled and can have any shape.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          for (const [x, y] of [[17, 19], [103, 19], [17, 87], [103, 87]]) p.hole(x, y, 7);
          p.soic(60, 58);
          p.ring(103, 19, 6.6);
          p.dim([17, 19], [103, 19], '', { off: 12 });
          p.label(60, 37, 'centre to centre', { anchor: 'middle', size: 3.8, cls: 'lbl-on' });
          p.dim([103, 87], [112, 87], '');
          p.leader(LX, 16, 105.5, 17.5, 'hole: 3.2 mm for M3');
          p.leader(LX, 34, 108, 23.6, 'keep clear: room');
          p.label(LX, 39.5, 'for the screw head');
          p.leader(LX, 84, 107.5, 87, '3 mm from the edge');
          p.caption('Mounting holes for screws');
        },
      },
    ],
  },

  {
    id: 'cutout',
    name: 'Cutout and slot',
    category: 'board',
    aka: ['board cutout', 'milled slot', 'routed slot', 'isolation slot', 'internal cutout'],
    keywords: 'hole opening window mill rout notch gap isolation high voltage creepage antenna connector',
    summary: 'An opening milled through the board, of any shape.',
    definition: 'A cutout is an opening milled right through the board. It can have any shape, where a drilled hole is always round. A cutout makes room for a part that drops through the board, or for a tab of the case. A slot is a long narrow cutout. A slot between a high-voltage part and the rest of the circuit keeps the two apart, because a spark cannot creep across air as easily as across the surface of a board.',
    say: [
      { for: 'An opening', text: 'Cut a {12 × 6 mm} opening through the board for {the connector J3}, centred at X = {10}, Y = {0}.' },
      { for: 'An isolation slot', text: 'Add a {1.5 mm} wide slot, {20 mm} long, between {the mains side} and the low-voltage side.' },
      { for: 'Keep copper away', text: 'Keep all copper at least {0.5 mm} away from every cutout.' },
      { for: 'Under an antenna', text: 'Remove the board under {the antenna of U1}: a cutout {18 × 6 mm} at the top edge.' },
    ],
    code: `export default () => (
  <board width="30mm" height="20mm">
    <cutout shape="rect" width="8mm" height="4mm" pcbX={6} pcbY={0} />
    <cutout shape="circle" radius="2mm" pcbX={-8} pcbY={0} />
  </board>
)`,
    codeNote: 'A <cutout> has shape "rect" with width and height, "circle" with radius, or "polygon" with a list of points. The build reports an error when copper is closer than 0.2 mm to a cutout. Read the errors after routing: the autorouter can still lead a trace too close around one.',
    fabTip: 'A cutout is milled with a round tool, so its inside corners come out rounded, and a slot cannot be narrower than the tool. About 1 mm is a safe smallest width. Check the limit of your factory.',
    confusedWith: [
      { id: 'board-outline', diff: 'A cutout is an opening inside the board. The outline is its outer edge.' },
      { id: 'mounting-hole', diff: 'A cutout is milled and can have any shape. A mounting hole is drilled and round.' },
      { id: 'keepout', diff: 'A cutout removes the board itself. A keep-out leaves the board there and only forbids copper or parts in an area.' },
    ],
    pictures: [
      {
        label: 'Top view',
        draw(p) {
          p.board(...B);
          p.rect(27.5, 18, 5, 40, 'hole hole-edge', { r: 2.5 });
          p.rect(62, 30, 36, 26, 'hole hole-edge', { r: 2 });
          p.trace([[18, 38], [18, 18]]).trace([[43, 38], [43, 18]]);
          p.pad(18, 40, 7, 9).pad(43, 40, 7, 9);
          p.label(18, 52, '230 V', { anchor: 'middle', size: 3.5, cls: 'lbl-on' });
          p.label(43, 52, '5 V', { anchor: 'middle', size: 3.5, cls: 'lbl-on' });
          p.leader(LX, 30, 98, 36, 'cutout: an opening');
          p.label(LX, 35.5, 'of any shape');
          p.leader(LX, 66, 96.8, 54.8, 'inside corners');
          p.label(LX, 71.5, 'come out rounded');
          p.leader(46, 104, 30.4, 57, 'slot: keeps the high voltage away', { anchor: 'middle' });
          p.caption('Cutouts and slots are milled through the board');
        },
      },
    ],
  },
];
